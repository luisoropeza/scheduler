---
name: flyway-migration
description: Add a database schema change to the multi-tenant backend with Flyway (public vs per-clinic tenant schemas). Use for any new table, column, index, constraint or seed data change in backend/.
---

# Flyway migration (schema-per-tenant)

The database has one `public` schema (accounts, roles, clinics) and one `clinic_<id>` schema per clinic (everything else). Hibernate runs with `ddl-auto: none`: **every** entity change needs a migration.

| Change touches… | Folder | Applied |
|---|---|---|
| `Account`, `Role`, `Clinic` (entities with `schema = "public"`) | `backend/src/main/resources/db/migration/public` | at startup by Spring's Flyway |
| any other entity | `backend/src/main/resources/db/migration/tenant` | by `SchemaProvisioningServiceImpl` to every existing clinic at startup, and to each new clinic on creation |

## Rules

1. **Never edit a committed migration** (a hook blocks it). Create the next version: `V2__add_appointment_notes.sql`, `V3__...`. Check existing versions in the folder first; versions are per folder.
2. Tenant migrations must not hardcode the schema: use `${flyway:defaultSchema}` for table names and for constraint/index names that must be unique (`uq_${flyway:defaultSchema}_...`).
3. Make them re-runnable where cheap (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) — the same script runs on clinics created months apart.
4. Adding a NOT NULL column to an existing table: add it nullable or with a `DEFAULT`, backfill, then constrain.
5. Update the JPA entity, the DTO/mapper, and then the frontend contract (`api-sync` skill).

## Verify

```bash
cd backend && ./gradlew compileJava
```
Then restart the backend (`run-stack` skill) and check the log for `Successfully applied` for `public` and for each `clinic_<id>`; a checksum or SQL error there stops the app.
