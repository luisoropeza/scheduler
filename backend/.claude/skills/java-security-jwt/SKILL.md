---
name: java-security-jwt
description: 'Set up stateless JWT security in Spring Boot (Spring Security 6/7 + jjwt): SecurityConfig with SecurityFilterChain, JWT filter (OncePerRequestFilter), token generation and validation, login with PasswordEncoder, public routes, roles with @PreAuthorize, CORS, and JSON 401/403 responses. Use it whenever the user talks about security, authentication, authorization, login, JWT, tokens, Bearer, roles, permissions, protecting endpoints, public routes, CORS, BCrypt, 401/403, or asks why an endpoint returns 401/403 in Spring Boot, even if they do not mention "Spring Security" explicitly.'
---

# JWT Security in Spring Boot

Pattern: **stateless** API. The client logs in, receives a signed JWT, and sends it as `Authorization: Bearer <token>` on every request. A filter validates the token and populates the `SecurityContext`; Spring Security decides access by route and by role.

## Example layout (layered MVC architecture)

Use this as a guide and map each piece to the target project's existing packages instead of forcing this structure:

```
com.example.app
├── config/
│   ├── SecurityConfig.java          # SecurityFilterChain, PasswordEncoder, 401/403 handlers
│   └── WebConfig.java               # CORS (WebMvcConfigurer)
├── security/
│   ├── JwtService.java              # generate / parse tokens
│   ├── JwtAuthFilter.java           # OncePerRequestFilter that reads the Bearer token
│   └── SecurityUtils.java           # optional helpers (current user id, role)
├── controller/
│   ├── AuthController.java          # POST /api/auth/login (public)
│   └── OrderController.java         # protected endpoints with @PreAuthorize
├── service/
│   ├── AuthService.java
│   └── impl/AuthServiceImpl.java    # validates credentials, issues the token
├── repository/UserRepository.java
├── dto/auth/{LoginRequest, LoginResponse}.java
└── exception/
    ├── ErrorResponse.java           # single error format for the whole API
    ├── UnauthorizedException.java
    └── GlobalExceptionHandler.java  # @RestControllerAdvice
```

## Before writing code

Inspect the target project and adapt:
1. **Versions**: Spring Boot 3 (Security 6) vs 4 (Security 7) — see differences below. Check whether `jjwt` (`io.jsonwebtoken`) is already present.
2. **What already exists**: if there is a `SecurityConfig`, filter, encoder or exception handler, extend it; do not create duplicates.
3. **What goes in the token**: `sub` = user id (stable, not the email), role(s), and only the claims the backend needs on every request (e.g. `tenantId` with multi-tenancy → see the `java-multi-tenancy` skill). Anyone can read a JWT: never put sensitive data in it.
4. **Public routes**: login, sign-up, docs (`/swagger-ui/**`, `/v3/api-docs/**`), health.
5. **Role model**: single or multiple roles; DB enum or string.

## Dependencies

```gradle
implementation 'org.springframework.boot:spring-boot-starter-security'
implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.6'
```

## Configuration

```yaml
jwt:
  secret: ${JWT_SECRET}          # >= 32 bytes for HS256; never in the repo
  expiration: 24h                # Duration
security:
  public-paths: /api/auth/**, /swagger-ui/**, /v3/api-docs/**
cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS}
```

Externalizing public routes in yaml lets you change them per environment without touching code. The secret goes in an environment variable / git-ignored `.env`: anyone holding it can sign valid tokens.

## 1. JwtService — generate and validate

```java
@Component
public class JwtService {

    private final SecretKey key;
    private final Duration expiration;

    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.expiration:24h}") Duration expiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); // fails at startup if < 32 bytes
        this.expiration = expiration;
    }

    public String generate(Long userId, String role, Map<String, Object> extraClaims) {
        var now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("role", role)
                .claims(extraClaims)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(key)
                .compact();
    }

    /** Returns the claims if the token is valid (signature + expiration), empty otherwise. */
    public Optional<Claims> parse(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
```

Why this way:
- **Parse once** and return `Claims`: one `extractX()` per claim re-verifies the signature on every call.
- **Catch `JwtException`**, not `Exception`: don't hide real bugs.
- Key built once in the constructor; if the secret is too short the app won't start (better than failing on the first login).
- Configurable expiration instead of a millisecond literal.

## 2. JWT filter

```java
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            jwtService.parse(header.substring(7)).ifPresent(claims -> {
                var role = claims.get("role", String.class);
                var authorities = role != null
                        ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        : List.<GrantedAuthority>of();
                var auth = new UsernamePasswordAuthenticationToken(claims.getSubject(), null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }
        chain.doFilter(request, response);
    }
}
```

- Invalid or missing token → do **not** respond here, just leave the request unauthenticated. Spring Security decides afterwards: public routes pass, otherwise it responds 401 via the `AuthenticationEntryPoint`. This way the filter doesn't need to know the public routes.
- `ROLE_` prefix: `hasRole('ADMIN')` looks for the `ROLE_ADMIN` authority. Forgetting it is the #1 cause of unexplained 403s.
- If the principal needs more data (id + role + tenant), use a `record AuthUser(Long id, String role, ...)` as the principal and read it with `@AuthenticationPrincipal AuthUser user` instead of parsing `auth.getName()`.
- If the filter stores state in a `ThreadLocal` (tenant, etc.), wrap in `try/finally` and clear it.

## 3. SecurityConfig

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper objectMapper;

    @Value("${security.public-paths:}")
    private String[] publicPaths;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)            // no session cookies → CSRF doesn't apply
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> {
                    a.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll(); // CORS preflight
                    if (publicPaths.length > 0) a.requestMatchers(publicPaths).permitAll();
                    a.anyRequest().authenticated();
                })
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> writeError(res, HttpStatus.UNAUTHORIZED, "Unauthorized"))
                        .accessDeniedHandler((req, res, ex) -> writeError(res, HttpStatus.FORBIDDEN, "Forbidden")))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        var body = ErrorResponse.builder()
                .status(status.value())
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), body);
    }
}
```

- `authenticationEntryPoint` / `accessDeniedHandler`: errors raised inside the filter chain do **not** reach `@RestControllerAdvice`. Without these handlers, a request without a token returns an empty 403 instead of a JSON 401.
- `writeError` reuses the project's error DTO (`ErrorResponse` or equivalent, the same one `GlobalExceptionHandler` returns) and serializes it with Spring's `ObjectMapper`: the client gets **a single error format** whether it comes from a filter or a controller, and dates use the same Jackson configuration. If the project has no error DTO, create it first; don't build the JSON by hand with `String.format` (breaks on quotes in the message and drifts from the real format).
- Set the UTF-8 charset: `getWriter()` defaults to ISO-8859-1 and non-ASCII characters in the message would be corrupted.
- `ObjectMapper` import by version: Spring Boot 4 (Jackson 3) → `tools.jackson.databind.ObjectMapper`; Spring Boot 3 (Jackson 2) → `com.fasterxml.jackson.databind.ObjectMapper`. Inject Spring's bean rather than `new ObjectMapper()`, to inherit its config (Java time support, date format).
- Expose the bean as `PasswordEncoder` (interface), not `BCryptPasswordEncoder`, so the algorithm can change without touching services.
- URL rules for the coarse split (public vs authenticated, `/api/admin/**` → `hasRole('ADMIN')`); `@PreAuthorize` for fine-grained per-endpoint rules.

**Spring Boot 4 / Security 7**: `HttpSecurity` no longer throws a checked exception → drop `throws Exception`. On Boot 3 it is required. The rest of the API (lambda DSL) is the same.

## 4. CORS

With `.cors(Customizer.withDefaults())`, Spring Security uses a `CorsConfigurationSource` bean if present, otherwise the `WebMvcConfigurer.addCorsMappings` configuration. Either works; don't define both. Never combine `allowedOrigins("*")` with `allowCredentials(true)`.

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
```

## 5. Login

```java
public LoginResponse login(LoginRequest request) {
    var user = userRepository.findByEmail(request.email())
            .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
            .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
    return new LoginResponse(jwtService.generate(user.getId(), user.getRole().name(), Map.of()));
}
```

Same message for "user doesn't exist" and "wrong password": don't reveal which emails are registered. Store passwords only via `passwordEncoder.encode()`.

## 6. Protecting endpoints and reading the user

```java
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@PatchMapping("/{id}/approve")
public ResponseEntity<OrderResponse> approve(@PathVariable Long id, Authentication auth) {
    var userId = Long.parseLong(auth.getName());
    return ResponseEntity.ok(orderService.approve(id, userId));
}
```

- `@PreAuthorize` requires `@EnableMethodSecurity`. When it fails it throws `AuthorizationDeniedException` (Security 6.3+), which **does** go through `@RestControllerAdvice`: map it to 403 there, or a generic `Exception` handler will turn it into a 500.
- **Ownership** checks (does this resource belong to the user?) belong in the service, using the id from the token — never an id the client sends in the body.
- A static helper to extract the role from `Authentication` (e.g. `SecurityUtils.extractRole(auth)`) is fine; if it grows, switch to `@AuthenticationPrincipal` with a record.

## Common pitfalls

| Symptom | Cause |
|---|---|
| 403 with no body on a request without token | Missing `authenticationEntryPoint` (should be 401) |
| 403 with a valid token and the right role | Authority without `ROLE_` prefix, or `hasRole('ROLE_X')` (doubles the prefix) |
| 500 instead of 403 with `@PreAuthorize` | `AuthorizationDeniedException` caught by the generic `Exception` handler |
| CORS preflight fails with 401 | Missing `permitAll` for `OPTIONS` or missing `.cors(...)` in the chain |
| `WeakKeyException` at startup | Secret < 32 bytes for HS256 |
| Public route returns 401 | Pattern mismatch (`/api/auth` vs `/api/auth/**`), or `server.servlet.context-path` included in the pattern (matchers go without it) |
| Filter runs twice | It's a `@Component`, so Boot also registers it as a servlet filter; `OncePerRequestFilter` prevents the double run |

## Final checklist

- [ ] JWT secret from env, >= 32 bytes, configurable expiration
- [ ] Token parsed once; JWT exceptions caught specifically
- [ ] `STATELESS` session, CSRF disabled, httpBasic/formLogin disabled
- [ ] Explicit public routes; everything else `authenticated()`
- [ ] JSON 401/403 from the filter chain, and `AuthorizationDeniedException` → 403 in the advice
- [ ] Authorities with `ROLE_` prefix, `@EnableMethodSecurity` if `@PreAuthorize` is used
- [ ] Login with a generic message and `PasswordEncoder`
- [ ] CORS configured in one place only
