import { Component, computed, input, output } from '@angular/core';
import { Appointment } from '../../../core/models/appointment.model';
import { PRIORITY_DOT } from '../../../core/models/priority.util';
import { CalendarDay, toIso } from '../../../core/utils/calendar.util';

@Component({
  selector: 'app-calendar-day-cell',
  templateUrl: './calendar-day-cell.component.html',
  host: { class: 'block' }
})
export class CalendarDayCellComponent {
  day = input.required<CalendarDay>();
  appointments = input<Appointment[]>([]);
  selected = input(false);

  select = output<string>();

  protected readonly today = toIso(new Date());

  protected readonly dotTones = computed(() => {
    const tones = new Set(this.appointments().map((appointment) => PRIORITY_DOT[appointment.priority]));
    return [...tones].slice(0, 3);
  });
}
