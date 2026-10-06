---
name: java-multi-tenancy
description: 'Set up schema-per-tenant multi-tenancy in Spring Boot with Hibernate, PostgreSQL and Flyway: ThreadLocal TenantContext, CurrentTenantIdentifierResolver, MultiTenantConnectionProvider using search_path, HibernatePropertiesCustomizer, tenant resolution from the JWT, and schema provisioning with Flyway. Use it whenever the user mentions multitenancy, multi-tenant, tenants, one schema per customer/clinic/company, isolating data per organization, search_path, or asks why a query hits the wrong schema, even if they do not say "multi-tenancy" explicitly.'
---

# Schema-based multi-tenancy in Spring Boot

Pattern proven in this project (`scheduler`): **one PostgreSQL schema per tenant** + a `public` schema for shared data. Hibernate picks the schema on each connection via `SET search_path`, the tenant travels in a `ThreadLocal` and is populated from the JWT.

Live reference in this repo (read it if it exists, it is the source of truth):
- `config/tenant/TenantContext.java`, `CustomTenantResolver.java`, `SchemaBasedMultiTenantConnectionProvider.java`
- `config/HibernateConfig.java`
- `service/impl/SchemaProvisioningServiceImpl.java`
- `middleware/JwtAuthFilter.java`
- `src/main/resources/db/migration/{public,tenant}/`

## Before writing code

Read the target project and decide (ask only what can't be inferred):
1. **What a tenant is** (clinic, company, org…) and its schema prefix. Here: `clinic_<id>`. Use `<prefix>_<numeric id>` — a numeric id can be validated with a regex and prevents SQL injection in `search_path`.
2. **Which tables are shared** (live in `public`: tenants, accounts, roles) and which are per tenant.
3. **Spring Boot version** — one import changes (see below).
4. **Where the tenant comes from** on each request: JWT claim (this project), header, subdomain…

If the project already has some of the pieces, reuse them; don't duplicate.

## The 6 pieces

Replace `<pkg>` with the base package and `clinic_` with the chosen prefix.

### 1. TenantContext — the current thread's tenant

```java
package <pkg>.config.tenant;

public class TenantContext {
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    public static void setCurrentTenant(String tenantId) { CURRENT_TENANT.set(tenantId); }
    public static String getCurrentTenant() { return CURRENT_TENANT.get(); }
    public static void clear() { CURRENT_TENANT.remove(); }
}
```

### 2. CurrentTenantIdentifierResolver — Hibernate asks "which tenant?"

```java
@Component
public class CustomTenantResolver implements CurrentTenantIdentifierResolver<String> {
    private static final String DEFAULT_TENANT = "public";

    @Override
    public String resolveCurrentTenantIdentifier() {
        var tenant = TenantContext.getCurrentTenant();
        return (tenant != null && !tenant.isBlank()) ? tenant : DEFAULT_TENANT;
    }

    @Override
    public boolean validateExistingCurrentSessions() { return true; }
}
```

Defaulting to `public` lets tenant-less endpoints (superadmin login, tenant creation, health) use the shared tables without blowing up.

### 3. MultiTenantConnectionProvider — switches the `search_path`

```java
@Component
@RequiredArgsConstructor
public class SchemaBasedMultiTenantConnectionProvider implements MultiTenantConnectionProvider<String> {

    private final DataSource dataSource;

    @Override
    public Connection getAnyConnection() throws SQLException {
        var connection = dataSource.getConnection();
        setSearchPath(connection, "public");
        return connection;
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException { connection.close(); }

    @Override
    public Connection getConnection(String tenantIdentifier) throws SQLException {
        var connection = dataSource.getConnection();
        setSearchPath(connection, tenantIdentifier + ", public");
        return connection;
    }

    @Override
    public void releaseConnection(String tenantIdentifier, Connection connection) throws SQLException {
        setSearchPath(connection, "public");
        connection.close();
    }

    @Override public boolean supportsAggressiveRelease() { return false; }
    @Override public boolean isUnwrappableAs(Class<?> unwrapType) { return false; }
    @Override public <T> T unwrap(Class<T> unwrapType) { throw new UnsupportedOperationException("Unwrap not supported"); }

    private void setSearchPath(Connection connection, String path) throws SQLException {
        try (Statement stmt = connection.createStatement()) {
            stmt.execute("SET search_path TO " + path);
        }
    }
}
```

Why this way:
- `tenant, public`: tenant entities resolve to their schema while FKs/joins to shared tables keep working.
- **Reset to `public` on release**: Hikari reuses connections; without the reset, the next request could inherit another tenant's schema (data leak).
- The string concatenation in `SET search_path` is only safe because the tenant name is validated/built from a numeric id. Never put raw user input there.

### 4. HibernateConfig — registers provider and resolver

```java
@Configuration
@RequiredArgsConstructor
public class HibernateConfig implements HibernatePropertiesCustomizer {

    private final SchemaBasedMultiTenantConnectionProvider connectionProvider;
    private final CustomTenantResolver tenantResolver;

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put(AvailableSettings.MULTI_TENANT_CONNECTION_PROVIDER, connectionProvider);
        hibernateProperties.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, tenantResolver);
    }
}
```

`HibernatePropertiesCustomizer` import:
- Spring Boot 4: `org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer`
- Spring Boot 3: `org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer`

Hibernate 6+ enables multi-tenancy when it detects the provider; `hibernate.multiTenancy: SCHEMA` in the yaml is no longer needed (harmless if present).

### 5. Set the tenant per request (JWT filter)

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
    try {
        var header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            jwtUtil.parse(header.substring(7)).ifPresent(claims -> {
                TenantContext.setCurrentTenant("clinic_" + claims.get("clinicId", Long.class));
                // ... Spring Security authentication
            });
        }
        chain.doFilter(request, response);
    } finally {
        TenantContext.clear();
    }
}
```

The `clear()` in `finally` is mandatory: Tomcat threads are reused, so without it the next request starts with the previous request's tenant. The tenant must come from a **signed** JWT claim (issued at login), never from a header the client can change.

### 6. Provision schemas with Flyway

```java
@Service
@RequiredArgsConstructor
public class SchemaProvisioningServiceImpl implements SchemaProvisioningService, ApplicationRunner {
    private static final String TENANT_MIGRATIONS = "classpath:db/migration/tenant";

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    // On startup, migrate every existing tenant (applies new migrations)
    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.queryForList("SELECT id FROM public.clinics", Long.class)
                .forEach(id -> createTenantSchema("clinic_" + id));
    }

    @Override
    public void createTenantSchema(String schemaName) {
        validateSchemaName(schemaName);
        Flyway.configure()
                .dataSource(dataSource)
                .schemas(schemaName)
                .locations(TENANT_MIGRATIONS)
                .baselineOnMigrate(true)
                .load()
                .migrate();
    }

    private void validateSchemaName(String schemaName) {
        if (schemaName == null || !schemaName.matches("^clinic_\\d+$"))
            throw new IllegalArgumentException("Invalid tenant schema name: " + schemaName);
    }
}
```

`application.yaml` — Spring Boot's Flyway migrates only `public`:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none        # schemas are managed by Flyway, never by Hibernate
    open-in-view: false
  flyway:
    locations: classpath:db/migration/public
    baseline-on-migrate: true
```

Migrations:
- `db/migration/public/V1__init_public_schema.sql` — shared tables (tenants, accounts, roles).
- `db/migration/tenant/V1__init_tenant_schema.sql` — per-tenant tables, prefixed with `${flyway:defaultSchema}`, with references to shared tables via `public.`:

```sql
CREATE TABLE IF NOT EXISTS ${flyway:defaultSchema}.personal (
    id BIGSERIAL PRIMARY KEY,
    personal_account_id BIGINT NOT NULL REFERENCES public.accounts(id),
    CONSTRAINT uq_${flyway:defaultSchema}_personal_account UNIQUE (personal_account_id)
);
```

Each schema has its own `flyway_schema_history`, so new versions in `tenant/` are applied to every tenant on the next startup.

## Entities

- Shared: `@Table(name = "clinics", schema = "public")` — the explicit schema guarantees they are always read from `public` regardless of the tenant.
- Per tenant: `@Table(name = "appointments")` **without** a schema, so the `search_path` decides.

## Working with a tenant outside a request

Login, tenant creation, seeders and jobs don't go through the filter. Pattern:

```java
var tx = new TransactionTemplate(transactionManager);
var clinic = tx.execute(_ -> clinicRepository.save(entity));   // in public
var schemaName = "clinic_" + clinic.getId();
schemaProvisioningService.createTenantSchema(schemaName);
try {
    TenantContext.setCurrentTenant(schemaName);
    return tx.execute(_ -> { /* tenant repositories */ });
} finally {
    TenantContext.clear();
}
```

**The tenant must be set BEFORE the transaction opens.** Hibernate resolves the tenant when it opens the session; changing `TenantContext` inside an already-running `@Transactional` method has no effect. That's why `TransactionTemplate` is used here instead of `@Transactional` on the method that switches tenants, with separate transactions for `public` and for the tenant.

## Common pitfalls

| Symptom | Cause |
|---|---|
| `relation "x" does not exist` | Tenant not set (falls back to `public`), schema not provisioned, or tenant changed inside an open transaction |
| Data from another tenant | Missing `TenantContext.clear()` in `finally`, or missing `search_path` reset when releasing the connection |
| Shared tables empty inside a tenant | Shared entity without `schema = "public"` and a same-named table in the tenant schema |
| `@Async`, `CompletableFuture`, schedulers without tenant | `ThreadLocal` doesn't propagate to other threads: pass the tenant as a parameter and set/clear it inside the thread |
| Hibernate creates tables in `public` | `ddl-auto` other than `none`/`validate` |

## Final checklist

- [ ] 3 classes in `config/tenant` + `HibernateConfig` with the right import for the Boot version
- [ ] Filter sets the tenant from a signed claim and clears it in `finally`
- [ ] Regex validation of the schema name before any SQL
- [ ] Separate Flyway runs: `public` (Spring Boot) and `tenant` (programmatic, on tenant creation and on startup)
- [ ] Shared entities with `schema = "public"`
- [ ] Code outside a request uses `TransactionTemplate` with the tenant set beforehand
