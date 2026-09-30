import { Component, input, output } from '@angular/core';
import { AppointmentListItemComponent } from '../appointment-list-item/appointment-list-item.component';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-day-agenda-panel',
  imports: [AppointmentListItemComponent],
  templateUrl: './day-agenda-panel.component.html',
  host: { class: 'glass-panel flex min-h-0 w-[22rem] shrink-0 flex-col rounded-3xl p-6' }
})
export class DayAgendaPanelComponent {
  dayLabel = input.required<string>();
  appointments = input.required<Appointment[]>();

  newAppointment = output<void>();
}
