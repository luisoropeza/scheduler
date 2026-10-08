import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AppointmentsApi } from '../../core/api/appointments.api';
import { AuthService } from '../../core/auth/auth.service';
import { AppointmentResponse, AppointmentStatus } from '../../core/models/api.models';
import { ROLES } from '../../core/navigation/navigation';
import { datePart, formatDayLabel, formatTime } from '../../core/utils/calendar.util';
import { statusFromDisplay } from '../../core/utils/labels.util';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PaginationComponent } from '../../shared/ui/pagination/pagination.component';
import { SegmentedTabsComponent, SegmentedTabItem } from '../../shared/ui/segmented-tabs/segmented-tabs.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { UiIconComponent } from '../../shared/ui/ui-icon/ui-icon.component';
import { AppointmentActionsService } from './appointment-actions.service';

type StatusFilter = AppointmentStatus | 'ALL';

const PAGE_SIZE = 12;

interface AppointmentRow extends AppointmentResponse {
  statusKey: AppointmentStatus;
  dayLabel: string;
  timeLabel: string;
}

@Component({
  selector: 'app-appointments-page',
  imports: [
    RouterLink,
    PageHeaderComponent,
    SegmentedTabsComponent,
    StatusBadgeComponent,
    PaginationComponent,
    EmptyStateComponent,
    UiIconComponent
  ],
  templateUrl: './appointments-page.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' }
})
export class AppointmentsPageComponent {
  private readonly api = inject(AppointmentsApi);
  private readonly auth = inject(AuthService);
  protected readonly actions = inject(AppointmentActionsService);

  protected readonly isPatient = this.auth.hasRole('PATIENT');
  protected readonly canBook = this.auth.hasRole(...ROLES.booking);
  protected readonly canManage = this.actions.canManage();

  protected readonly tabs: SegmentedTabItem[] = [
    { id: 'ALL', label: 'Todas' },
    { id: 'PENDING', label: 'Pendientes' },
    { id: 'CONFIRMED', label: 'Confirmadas' },
    { id: 'CANCELLED', label: 'Canceladas' }
  ];

  protected readonly status = signal<StatusFilter>('ALL');
  protected readonly page = signal(0);

  protected readonly resource = rxResource({
    request: () => ({ status: this.status(), page: this.page() }),
    loader: ({ request }) =>
      this.api.list({
        status: request.status === 'ALL' ? undefined : request.status,
        page: request.page,
        size: PAGE_SIZE,
        sort: 'startTime,desc'
      })
  });

  protected readonly rows = computed<AppointmentRow[]>(() =>
    (this.resource.value()?.content ?? []).map((appointment) => ({
      ...appointment,
      statusKey: statusFromDisplay(appointment.status),
      dayLabel: formatDayLabel(datePart(appointment.startTime)),
      timeLabel: `${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`
    }))
  );
  protected readonly pageInfo = computed(() => this.resource.value()?.page);

  protected setStatus(id: string): void {
    this.status.set(id as StatusFilter);
    this.page.set(0);
  }

  protected open(row: AppointmentRow): void {
    this.actions.openDetail(row.id).subscribe((changed) => changed && this.resource.reload());
  }

  protected confirm(row: AppointmentRow, event: Event): void {
    event.stopPropagation();
    this.actions.confirm(row.id, row.patientName).subscribe(() => this.resource.reload());
  }

  protected cancel(row: AppointmentRow, event: Event): void {
    event.stopPropagation();
    this.actions.cancel(row.id, row.patientName).subscribe(() => this.resource.reload());
  }
}
