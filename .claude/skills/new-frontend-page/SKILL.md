---
name: new-frontend-page
description: Add a new page/module to the Angular frontend following the project conventions (typed API service, role-guarded lazy route, sidebar entry, glass UI primitives, Spanish copy). Use whenever a new screen, feature or CRUD module is requested in frontend/.
---

# New frontend page

Read `frontend/CLAUDE.md` first. Reference implementations: `features/staff/` (paginated CRUD table + form dialog), `features/availability/` (cards + dialogs), `features/appointments/booking/` (wizard).

## Checklist

1. **Contract** — find the endpoint in `backend/src/main/java/com/example/scheduler/controller/` and note:
   - `@PreAuthorize` roles → these become the route roles.
   - Request/response records in `dto/` → add/extend interfaces in `core/models/api.models.ts` (same field names, see `api-sync` skill).
   - Paged endpoints return `Page<T>` = `{ content, page: { number, size, totalElements, totalPages } }`.
2. **API service** — one method per endpoint in `core/api/<resource>.api.ts` (`@Injectable({ providedIn: 'root' })`, relative URL like `'personal'`, query params through `toHttpParams`). No component calls `HttpClient` directly.
3. **Page** — `features/<feature>/<feature>-page.component.{ts,html}`:
   - standalone, `inject()`, signals; data via `rxResource({ request, loader })`; derived state with `computed`. Pages with filters/pagination keep that state in a `<Feature>ResourceService` (see `frontend-resource-service` skill).
   - host class `flex min-h-0 flex-1 flex-col`; start with `<app-page-header title subtitle>` (actions in its default slot).
   - containers: `glass-panel rounded-3xl p-6`; tables: `.data-table`; buttons: `.btn .btn-primary|btn-secondary|btn-danger|btn-ghost`, `.btn-icon`; inputs: `.field-label`, `.field-input`, `.field-error` (defined in `src/styles.css`).
   - always handle loading (pulse skeleton), error (`<app-empty-state icon="alert">` + retry) and empty states.
   - icons: `<app-ui-icon name="...">` (add paths to `shared/ui/ui-icon` if missing). Never paste raw `<svg>`.
4. **Dialogs** — `<app-dialog-frame>` + `Dialog.open(Component, { data, backdropClass: 'glass-backdrop' })`; footer buttons go in a top-level `<div dialogFooter class="contents">` (not inside an `@if` with siblings, or projection breaks). Confirmations: `ConfirmService.ask(...)`.
5. **Errors & feedback** — `apiErrorMessage(error, fallback)` + `NotificationService.success/error`. Add new backend messages to the table in `core/http/api-error.ts`.
6. **Route** — lazy `loadComponent` in `app.routes.ts` inside the shell, with `title` and `canActivate: [roleGuard(...ROLES.x)]` (add a group in `core/navigation/navigation.ts` if needed).
7. **Navigation** — add a `NavItem` to `NAV_ITEMS` with the same roles.
8. **Copy** — user-facing text in Spanish; code, comments and identifiers in English.
9. **Verify** — `pnpm build` (strict templates), then `pnpm e2e:smoke` with the stack running (add the new route to the role lists in `e2e/smoke.mjs`), and look at a screenshot.
