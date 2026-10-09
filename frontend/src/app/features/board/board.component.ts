import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CdkDragDrop, CdkDropListGroup, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { AppointmentsApi } from '../../core/api/appointments.api';
import {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentSummaryItem,
} from '../../core/models/api.models';
import { BoardColumn } from '../../core/models/board.model';
import { addDays, toIso } from '../../core/utils/calendar.util';
import { NotificationService } from '../../shared/services/notification.service';
import { BoardColumnComponent } from '../../shared/ui/board-column/board-column.component';
import {
  DateRange,
  DateRangePickerComponent,
} from '../../shared/ui/date-range-picker/date-range-picker.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { UiIconComponent } from '../../shared/ui/ui-icon/ui-icon.component';
import { AppointmentActionsService } from '../appointments/appointment-actions.service';

/** The board only ever has these 3 columns — they mirror the backend AppointmentStatus enum. */
const COLUMN_DEFS: { id: AppointmentStatus; title: string; accentClass: string }[] = [
  { id: 'PENDING', title: 'Pendientes', accentClass: 'bg-tertiary' },
  { id: 'CONFIRMED', title: 'Confirmadas', accentClass: 'bg-primary' },
  { id: 'CANCELLED', title: 'Canceladas', accentClass: 'bg-gray-400' },
];

/**
 * Kanban of appointments by status. Dragging a card is the same as using the actions:
 * PENDING → CONFIRMED confirms, anything → CANCELLED cancels. Other moves are not allowed by the backend.
 */
@Component({
  selector: 'app-board',
  imports: [
    CdkDropListGroup,
    BoardColumnComponent,
    PageHeaderComponent,
    DateRangePickerComponent,
    UiIconComponent,
  ],
  templateUrl: './board.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class BoardComponent {
  private readonly api = inject(AppointmentsApi);
  private readonly actions = inject(AppointmentActionsService);
  private readonly notifications = inject(NotificationService);

  protected readonly readonly = !this.actions.canManage();
  protected readonly dateFrom = signal(toIso(new Date()));
  protected readonly dateTo = signal(toIso(addDays(new Date(), 6)));
  protected readonly showDates = computed(() => this.dateFrom() !== this.dateTo());

  protected readonly resource = rxResource({
    request: () => ({ from: this.dateFrom(), to: this.dateTo() }),
    loader: ({ request }) => this.api.board(request),
  });

  protected readonly columns = computed<BoardColumn[]>(() => {
    const board = this.resource.value();
    return COLUMN_DEFS.map((def) => ({ ...def, appointments: [...(board?.[def.id] ?? [])] }));
  });

  protected setDateRange(range: DateRange): void {
    this.dateFrom.set(range.from);
    this.dateTo.set(range.to);
  }

  protected open(appointment: AppointmentSummaryItem): void {
    this.actions
      .openDetail(appointment.id)
      .subscribe((changed) => changed && this.resource.reload());
  }

  protected drop(event: CdkDragDrop<AppointmentSummaryItem[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const appointment = event.item.data as AppointmentSummaryItem;
    const target = event.container.id as AppointmentStatus;
    let action: Observable<AppointmentResponse> | null = null;

    if (target === 'CONFIRMED' && appointment.status === 'PENDING')
      action = this.actions.confirm(appointment.id, appointment.clientName);
    if (target === 'CANCELLED')
      action = this.actions.cancel(appointment.id, appointment.clientName);

    if (!action) {
      this.notifications.error(
        target === 'PENDING'
          ? 'Una cita no puede volver a pendiente'
          : 'Una cita cancelada no puede reactivarse',
      );
      return;
    }
    action.subscribe(() => this.resource.reload());
  }
}
