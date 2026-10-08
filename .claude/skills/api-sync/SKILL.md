---
name: api-sync
description: Keep the Angular client in sync with the Spring Boot API. Use after changing a backend controller/DTO/enum, when the frontend gets 400/403/404/500 from an endpoint, or when asked whether the frontend matches the backend.
---

# Backend ↔ frontend contract sync

Source of truth is the Java code, not docs. Map:

| Backend | Frontend |
|---|---|
| `controller/*Controller.java` (paths, `@PreAuthorize`, params) | `frontend/src/app/core/api/*.api.ts` + route roles in `app.routes.ts` / `core/navigation/navigation.ts` |
| `dto/**/*.java` records | interfaces in `core/models/api.models.ts` (identical field names) |
| `enums/*.java` | string unions in `api.models.ts`; Spanish labels in `core/utils/labels.util.ts` |
| `exception/GlobalExceptionHandler.java` + `throw new XxxException("...")` messages | `core/http/api-error.ts` translation table |

## Steps

1. Diff the changed Java files (`git diff -- backend/src/main/java`).
2. For every changed endpoint, update the API service method (path, verb, params, body) and the model interfaces.
3. Role changes in `@PreAuthorize` → update `roleGuard` on the routes and `NAV_ITEMS`, and any `auth.hasRole(...)` checks that show/hide actions.
4. New business error messages → add a regex → Spanish entry in `KNOWN_MESSAGES`.
5. `cd frontend && pnpm build` — strict templates catch most mismatches.
6. With the stack up (`run-stack` skill), hit the endpoint with curl and compare the real JSON with the interface.

## Known wire quirks (verified)

- `LocalTime` is serialized as `"08:00:00"`, `LocalDateTime` as `"2026-10-06T08:00:00"` (no zone). Format with `formatTime` / `toLocalDateTime` from `core/utils/calendar.util.ts`.
- `AppointmentResponse.status` is the Spanish display name (`"Pendiente"`); filters and board/calendar items use the enum (`PENDING`). Convert with `statusFromDisplay`.
- `GET /appointments/calendar` keys are `"MM-dd-yyyy"` → `calendarKeyToIso`.
- Business rule violations return **406**, not 409; optimistic-lock conflicts return 409.
- For DOCTOR/PATIENT callers the backend overrides `doctorId`/`patientId` with the caller's id on appointment endpoints.
- The tenant migration seeds a placeholder specialty `"None"`; `CatalogsApi.specialties()` filters it out.
