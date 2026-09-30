import { Component, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumnComponent } from '../../shared/ui/board-column/board-column.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { DateRange, DateRangePickerComponent } from '../../shared/ui/date-range-picker/date-range-picker.component';
import { AppointmentsService } from '../../core/services/appointments.service';
import { AppointmentStatus, BoardAppointment, BoardColumn } from '../../core/models/board.model';
import { toIso } from '../../core/utils/calendar.util';

/** The board only ever has these 3 columns — they mirror the backend AppointmentStatus enum. */
const COLUMN_DEFS: { id: AppointmentStatus; title: string; accentClass: string }[] = [
  { id: 'PENDING', title: 'Pending', accentClass: 'bg-tertiary' },
  { id: 'CONFIRMED', title: 'Confirmed', accentClass: 'bg-primary' },
  { id: 'CANCELLED', title: 'Cancelled', accentClass: 'bg-gray-400' }
];

@Component({
  selector: 'app-board',
  imports: [CdkDropListGroup, BoardColumnComponent, PageHeaderComponent, DateRangePickerComponent],
  templateUrl: './board.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' }
})
export class BoardComponent {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly appointments = this.appointmentsService.appointments;

  protected readonly dateFrom = signal(toIso(new Date()));
  protected readonly dateTo = signal(toIso(new Date()));

  protected readonly columns = computed<BoardColumn[]>(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    const inRange = this.appointments().filter((appointment) => appointment.appointmentDate >= from && appointment.appointmentDate <= to);

    return COLUMN_DEFS.map((def) => ({
      ...def,
      appointments: inRange.filter((appointment) => appointment.status === def.id)
    }));
  });

  protected setDateRange(range: DateRange): void {
    this.dateFrom.set(range.from);
    this.dateTo.set(range.to);
  }

  protected drop(event: CdkDragDrop<BoardAppointment[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
  }
}
