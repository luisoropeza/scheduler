import { Component, computed, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { CalendarDayCellComponent } from '../../shared/ui/calendar-day-cell/calendar-day-cell.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { CalendarNavComponent } from '../../shared/ui/calendar-nav/calendar-nav.component';
import { DayAgendaPanelComponent } from '../../shared/ui/day-agenda-panel/day-agenda-panel.component';
import { NewAppointmentDialogComponent, NewAppointmentResult } from '../../shared/ui/new-appointment-dialog/new-appointment-dialog.component';
import { CalendarService } from '../../core/services/calendar.service';
import { buildMonthMatrix, formatDayLabel, formatMonthLabel, toIso } from '../../core/utils/calendar.util';

@Component({
  selector: 'app-calendar',
  imports: [CalendarDayCellComponent, PageHeaderComponent, CalendarNavComponent, DayAgendaPanelComponent],
  templateUrl: './calendar.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' }
})
export class CalendarComponent {
  private readonly calendarService = inject(CalendarService);
  private readonly dialog = inject(Dialog);

  protected readonly weekdayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  private readonly viewDate = signal(new Date());
  protected readonly selectedDate = signal(toIso(new Date()));

  protected readonly monthLabel = computed(() => formatMonthLabel(this.viewDate()));
  protected readonly weeks = computed(() => buildMonthMatrix(this.viewDate().getFullYear(), this.viewDate().getMonth()));

  private readonly appointments = this.calendarService.appointments;

  protected readonly selectedDayLabel = computed(() => formatDayLabel(this.selectedDate()));
  protected readonly selectedDayAppointments = computed(() =>
    this.appointments()
      .filter((appointment) => appointment.date === this.selectedDate())
      .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  );

  protected appointmentsFor(iso: string) {
    return this.appointments().filter((appointment) => appointment.date === iso);
  }

  protected previousMonth(): void {
    this.viewDate.update((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    this.viewDate.update((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1));
  }

  protected goToday(): void {
    const today = new Date();
    this.viewDate.set(today);
    this.selectedDate.set(toIso(today));
  }

  protected selectDay(iso: string): void {
    this.selectedDate.set(iso);
  }

  protected openNewAppointment(): void {
    const dialogRef = this.dialog.open<NewAppointmentResult>(NewAppointmentDialogComponent, {
      data: { dayLabel: this.selectedDayLabel() },
      backdropClass: 'glass-backdrop'
    });

    dialogRef.closed.subscribe((result) => {
      if (result) {
        this.calendarService.add({ ...result, date: this.selectedDate() });
      }
    });
  }
}
