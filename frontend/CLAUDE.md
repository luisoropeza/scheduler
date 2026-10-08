# Frontend — Angular 19

`pnpm start` (proxy `/api` → :8080) · `pnpm build` · `pnpm format` · `pnpm e2e:smoke` (stack must be up). pnpm is pinned in `package.json`; if it is not installed use `npx -y pnpm@10.33.2 <cmd>`.

## Structure

```
src/app/
  core/                    no UI
    api/                   one injectable per backend resource (AppointmentsApi, StaffApi, AgendaApi…) — the ONLY place that uses HttpClient
    models/api.models.ts   backend DTO contracts (mirror of backend/src/main/java/.../dto)
    auth/                  AuthService (JWT session as signals, clinic selection), guards: authGuard, guestGuard, roleGuard, homeRedirect
    http/                  interceptors (base URL + bearer/401), apiErrorMessage (backend message → Spanish), toHttpParams
    navigation/            ROLES groups + NAV_ITEMS (sidebar) — keep in sync with app.routes.ts
    utils/                 calendar/date helpers (backend wire formats), labels (roles, statuses, days)
  shared/
    ui/                    presentational glass components (page-header, dialog-frame, confirm-dialog, empty-state, pagination,
                           status-badge, ui-icon, board-*, calendar-*, sidebar-nav, topbar…) — inputs/outputs only, no API calls
    components/            flat form controls used by the auth screens (input/button with ControlValueAccessor)
    services/              NotificationService (toasts), LoaderService
  features/<feature>/      pages + their dialogs; may import `features/appointments` (AppointmentActionsService, detail dialog)
  layout/shell/            sidebar + topbar + router-outlet for authenticated pages
```

## Conventions

- Standalone components, `inject()`, `input()/output()`, signals + `computed`; server state with `rxResource({ request, loader })` (Angular 19 API: `request`/`loader`, not `params`/`stream`).
- Every page under the shell is a lazy route with `title` and `canActivate: [roleGuard(...ROLES.x)]` mirroring the backend `@PreAuthorize`.
- Styling: Tailwind utilities + design primitives in `src/styles.css` (`.glass-panel`, `.glass-card`, `.glass-modal`, `.btn*`, `.field-*`, `.data-table`, `.chip`). Don't add per-component CSS files; extend `styles.css` if a pattern repeats.
- Tailwind v4 runs with `optimize` in `.postcssrc.json` so nested CSS from `@apply` is flattened; without it the production optimizer drops hover/disabled rules.
- Icons: `<app-ui-icon name>` for UI glyphs; `<app-icon>` + `core/icons/icon-registry.ts` only for SVG files in `public/icons`.
- Dialog footers: a top-level `<div dialogFooter class="contents">` inside `<app-dialog-frame>`; content inside a multi-node `@if` is not projected into named slots.
- Dates: backend `LocalDate` = `yyyy-MM-dd`, `LocalTime` = `HH:mm:ss`, `LocalDateTime` = `yyyy-MM-ddTHH:mm:ss` without zone — use the helpers in `core/utils/calendar.util.ts`, never `Date#toISOString()` (UTC shift).
- User-facing errors: `apiErrorMessage(err, fallback)` + `NotificationService`.

`docs/wiki/` is the team wiki (Waqwaq format, see `docs/CLAUDE.md`); `docs/wiki/agenda-api` documents the API as consumed by the frontend.
