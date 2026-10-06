---
name: java-springdoc
description: 'Document Spring Boot REST APIs with springdoc-openapi / Swagger UI: dependency per Boot version, OpenApiConfig bean with JWT Bearer security scheme, @Tag per controller, @Operation summaries, public endpoints without the lock, DTO schemas inferred from records and Bean Validation, and exposing /swagger-ui and /v3/api-docs through Spring Security. Use it whenever the user mentions Swagger, OpenAPI, springdoc, API docs, documenting endpoints or controllers, the "Authorize" button, swagger-ui not loading, or adds a new controller/endpoint that should appear in the docs, even if they do not say "springdoc" explicitly.'
---

# API documentation with springdoc-openapi

Philosophy: **let springdoc infer as much as possible from the code** (mappings, records, `@Valid` constraints, return types) and add annotations only where they add information a reader can't get from the signature. Lots of `@Schema`/`@ApiResponse` boilerplate goes stale fast and nobody updates it.

## Before writing code

1. **Check the Spring Boot version** — the springdoc major must match:
   - Spring Boot 4 → `springdoc-openapi-starter-webmvc-ui:3.x`
   - Spring Boot 3 → `springdoc-openapi-starter-webmvc-ui:2.x`
   - WebFlux → `springdoc-openapi-starter-webflux-ui` instead.
2. **Check what exists**: an `OpenApiConfig`, existing `@Tag`/`@Operation` conventions. Match the convention already in the project instead of introducing a new one.
3. **Is there security?** If the API uses JWT, the docs need a Bearer scheme and the Swagger paths must be public (see `java-security-jwt` skill).

## 1. Dependency

```gradle
implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.2'   // Boot 4
```

That's all. With no extra config you get:
- UI: `/swagger-ui/index.html` (and `/swagger-ui.html` redirect)
- JSON spec: `/v3/api-docs`

## 2. OpenApiConfig — global JWT Bearer

```java
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info().title("Scheduler API").version("v1"))   // optional
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
```

- `addSecurityItem` at the root applies the scheme to **every** operation, so the "Authorize" button sends `Authorization: Bearer <token>` everywhere without annotating each controller.
- The name (`"bearerAuth"`) is just an identifier; it must match between `addList(...)` and `addSecuritySchemes(...)`.
- Paste only the raw token in "Authorize" — Swagger adds the `Bearer ` prefix.
- Imports come from `io.swagger.v3.oas.models.*` (the model API), not `io.swagger.v3.oas.annotations.*`.

## 3. Let Spring Security expose the docs

```yaml
security:
  public-paths: /api/auth/login, /swagger-ui/**, /v3/api-docs/**
```

Both patterns are needed: the UI page loads the spec from `/v3/api-docs` (and `/v3/api-docs/swagger-config`). If only `/swagger-ui/**` is public, the page loads but shows "Failed to load API definition".

To disable docs in production:

```yaml
springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false
```

## 4. Controllers — the project convention

```java
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Appointment Controller")
public class AppointmentController {

    @PostMapping
    @Operation(summary = "POST /api/appointments — book an appointment for a patient on a given schedule slot")
    public ResponseEntity<AppointmentResponse> bookAppointment(@Valid @RequestBody AppointmentRequest request) { ... }

    @GetMapping("/{appointmentId}")
    @Operation(summary = "GET /api/appointments/{id} — get an appointment details by id")
    public ResponseEntity<AppointmentResponse> findAppointmentById(@PathVariable Long appointmentId, Authentication auth) { ... }

    @GetMapping
    @Operation(summary = "GET /api/appointments — list appointments, filtered by ?doctorId={id}&patientId={id}&status={status}")
    public ResponseEntity<Page<AppointmentResponse>> findAllAppointments(
            @RequestParam(required = false) Long doctorId,
            @PageableDefault(sort = "startTime") Pageable pageable,
            Authentication auth) { ... }
}
```

Rules:
- **One `@Tag` per controller**, plural resource name (`"Appointments"`, `"Clinics"`), so the UI groups endpoints by resource. Without it springdoc derives an ugly name from the class (`appointment-controller`).
- **One `@Operation(summary = ...)` per endpoint**, format: `"<METHOD> <path> — <what it does, in a short lowercase phrase>"`. Mention query filters, who can call it (`(public)`, role restrictions) or side effects when they're not obvious from the path.
- Keep summaries short (one line); use `description = "..."` on `@Operation` only for genuinely longer explanations (business rules, edge cases).
- `Authentication`, `Principal` and `HttpServletRequest` params need no `@Parameter(hidden = true)` — springdoc already hides them.

### Public endpoints: remove the lock

Because Bearer is applied globally, public endpoints (login, sign-up) show a lock. Override it with an empty requirement:

```java
@PostMapping("/login")
@SecurityRequirements   // io.swagger.v3.oas.annotations.security.SecurityRequirements — empty = no auth
@Operation(summary = "POST /api/auth/login — authenticate a user and return a JWT token")
public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) { ... }
```

Optional but makes the docs honest about what needs a token.

## 5. DTOs — let springdoc infer the schema

```java
public record AppointmentRequest(
        @NotNull Long doctorId,
        @NotNull Long patientId,
        LocalDateTime startTime,
        LocalDateTime endTime
) {}
```

springdoc reads records and Bean Validation: `@NotNull`/`@NotBlank` → `required`, `@Size`/`@Min`/`@Max`/`@Email`/`@Pattern` → schema constraints. Validation annotations therefore document **and** enforce, which is why they beat `@Schema(required = true)`.

Add `@Schema` only when it adds something:

```java
public record LoginRequest(
        @Schema(example = "admin@clinic.com") @NotBlank @Email String email,
        @Schema(example = "secret123") @NotBlank String password,
        @Schema(description = "Clinic the user belongs to", example = "1") @NotNull Long clinicId
) {}
```

Good reasons: a realistic `example` (makes "Try it out" usable), a `description` for a non-obvious field, `accessMode = READ_ONLY` for server-generated fields, `allowableValues` when a `String` is really an enum. Prefer a real Java `enum` — springdoc lists its values automatically.

## 6. Responses and errors (optional)

springdoc documents the 200 response from the return type. Add `@ApiResponse` only for non-obvious status codes clients must handle:

```java
@ApiResponse(responseCode = "201", description = "Created")
@ApiResponse(responseCode = "409", description = "Slot already booked",
        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
```

Don't document 401/403/500 on every endpoint — they apply globally and are implied by the lock.

## Common pitfalls

| Symptom | Cause |
|---|---|
| Swagger UI returns 401/403 | `/swagger-ui/**` and `/v3/api-docs/**` not in the public paths |
| "Failed to load API definition" | `/v3/api-docs/**` blocked by security, or springdoc major doesn't match Boot version (NoSuchMethodError in logs) |
| Requests from "Try it out" return 401 | Not authorized in the UI, or scheme name mismatch between `addList` and `addSecuritySchemes` |
| Token sent as `Bearer Bearer xxx` | Pasted the token with the prefix in "Authorize" |
| Endpoint missing from the docs | Controller outside the component-scan package, or annotated `@Hidden` |
| `Pageable` shown as a JSON object instead of `page`/`size`/`sort` query params | Annotate the param with `@ParameterObject` (`org.springdoc.core.annotations.ParameterObject`) |
| CORS error in "Try it out" | UI served from a different origin than the API; add it to allowed origins |

## Checklist when adding a controller/endpoint

- [ ] `@Tag(name = "<Resources>", description = "<Resource> Controller")` on the class
- [ ] `@Operation(summary = "<METHOD> <path> — <what it does>")` on every endpoint
- [ ] Request DTO uses Bean Validation (shows as required/constraints in the docs)
- [ ] Public endpoints listed in `security.public-paths` (and optionally `@SecurityRequirements`)
- [ ] Open `/swagger-ui/index.html` and check the endpoint appears under the right tag
