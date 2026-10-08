---
name: frontend-resource-service
description: Move a feature's server state into a component-scoped `<Feature>ResourceService` (rxResource + filters signal + linkedSignal/computed projections + reset). Use when a frontend page loads/filters/paginates backend data, when a page component is getting too much state, or when asked to create a "resource service" in frontend/.
---

# Frontend resource service

Pattern: the **API class** (`core/api/*.api.ts`) only does HTTP; a **resource service** per feature owns the server state
(filters → `rxResource` → derived signals); the **component** only reads signals and calls methods.
Read `frontend/CLAUDE.md` first. Existing example to align/upgrade: `features/clinic-options/services/clinic-options-resource.service.ts`.

> Angular here is **19.2** → `rxResource({ request, loader: ({ request }) => ... })`.
> The v20+ names `params` / `stream` do NOT compile. `linkedSignal` is available (19).

## Files

```
features/<feature>/
  services/<feature>-resource.service.ts   @Injectable() — NOT providedIn root
  constants/<feature>.constants.ts         PAGE_SIZE, getDefault<Feature>Filters()   (optional, if reused)
  <feature>-page.component.ts              providers: [<Feature>ResourceService]
```

Types (`Page<T>`, filters, DTOs) live in `core/models/api.models.ts`; HTTP in `core/api/<resource>.api.ts` (see `new-frontend-page`).

## Template

```ts
import { computed, inject, Injectable, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { StaffApi } from '../../../core/api/staff.api';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Page, Staff, StaffFilters } from '../../../core/models/api.models';
import { getDefaultStaffFilters } from '../constants/staff.constants';

@Injectable()
export class StaffResourceService {
  private readonly _staffApi = inject(StaffApi);

  // 1. Inputs of the request — the only thing the UI writes to trigger a fetch.
  public filters = signal<StaffFilters>(getDefaultStaffFilters());

  // 2. The resource (private). Re-runs whenever `filters()` changes; previous request is cancelled.
  private _staffResource = rxResource({
    request: () => this.filters(),
    loader: ({ request }) => this._staffApi.list(request)
  });

  // 3. UI state that is not server data.
  public selectedStaff = signal<Staff | null>(null);

  // 4. Projections. linkedSignal when the UI may edit the list locally (optimistic update, remove row);
  //    computed when it is read-only.
  public staff = linkedSignal(() => this._staffResource.value()?.content ?? ([] as Staff[]));
  public pagination = computed(() => this._staffResource.value()?.page ?? ({} as Page<Staff>['page']));
  public isLoading = this._staffResource.isLoading;
  public isError = computed(() => !!this._staffResource.error());
  public errorMessage = computed(() => {
    const error = this._staffResource.error();
    return error ? apiErrorMessage(error, 'No se pudo cargar el personal') : '';
  });
  public reloadStaff = () => this._staffResource.reload();

  // 5. Intent methods — components never call `filters.set` with hand-built objects.
  public updateFilters = (patch: Partial<StaffFilters>) =>
    this.filters.update(current => ({ ...current, page: 0, ...patch }));

  public setPage = (page: number) => this.filters.update(current => ({ ...current, page }));

  public resetResource = () => {
    this.filters.set(getDefaultStaffFilters());
    this.selectedStaff.set(null);
    this.staff.set([]);
  };
}
```

Constants (when defaults are computed or shared):

```ts
export const STAFF_PAGE_SIZE = 12;

export const getDefaultStaffFilters = (): StaffFilters => ({ page: 0, size: STAFF_PAGE_SIZE, sort: 'id', isActive: true });
```

Component:

```ts
@Component({
  selector: 'app-staff-page',
  providers: [StaffResourceService],
  ...
})
export class StaffPageComponent {
  protected readonly resource = inject(StaffResourceService);
}
```

```html
@if (resource.isLoading()) { <!-- pulse skeleton --> }
@else if (resource.isError()) {
  <app-empty-state icon="alert" [title]="resource.errorMessage()"> <button class="btn btn-secondary" (click)="resource.reloadStaff()">Reintentar</button> </app-empty-state>
} @else {
  @for (item of resource.staff(); track item.id) { ... } @empty { <app-empty-state ...> }
  <app-pagination
    [page]="resource.pagination().number" [totalPages]="resource.pagination().totalPages"
    [totalElements]="resource.pagination().totalElements" (pageChange)="resource.setPage($event)" />
}
```

## Rules

- **Naming:** class `<Feature>ResourceService`, file `<feature>-resource.service.ts`; injected deps `private readonly _x`; private resource `_<thing>Resource`; public members `public` explicit; actions as arrow-function properties (`reloadX`, `resetResource`, `updateFilters`) so they can be passed as callbacks.
- **Scope:** `@Injectable()` + `providers: [...]` on the page component → state is created/destroyed with the page and is shared by its child dialogs/components (they `inject()` the same instance). Use `providedIn: 'root'` only if the state must survive navigation.
- **One filters signal per resource.** Everything the request depends on (page, size, sort, filters, ids, date) goes inside it; changing a filter resets `page` to 0. Use an `equal` comparer or avoid new object identities if a set should not refetch.
- **Request = `undefined` skips the load** (Angular 19): `request: () => this.doctorId() ?? undefined` when a required input is missing (e.g. no doctor selected).
- **Never subscribe** inside the service for loading data; use `rxResource`. Mutations (create/update/delete) are done in the component/dialog with the API class, then call `reloadX()` (or edit the `linkedSignal` for an optimistic change).
- **Errors** come from `resource.error()` → `apiErrorMessage(...)` (Spanish). Only add writable `isError`/`errorMessage` signals if errors also come from outside the resource.
- **Dates** in filters use `toIso(date)` from `core/utils/calendar.util.ts`, never `toISOString()`.
- **Context-dependent defaults** (equivalent of "county context ready"): if defaults depend on the session/clinic, derive them from `AuthService` signals (`auth.clinic()`, `auth.userId()`) inside `request` or reset filters from an `effect` in the constructor, checking that the user has not already changed them:
  ```ts
  constructor() {
    const initialFilters = this.filters();
    effect(() => {
      this._auth.clinic(); // dependency
      untracked(() => { if (this.filters() === initialFilters) this.filters.set(getDefaultStaffFilters()); });
    });
  }
  ```
- Keep the service free of UI concerns (dialogs, notifications, router).

## Verify

`cd frontend && pnpm build` (strict templates). With the stack up, open the page, change filters/page and check in the network tab (or `mcp__playwright__browser_network_requests`) that each change fires exactly one request and stale ones are cancelled.
