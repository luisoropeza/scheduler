import { Component, computed, input } from '@angular/core';
import { AppointmentSummaryItem } from '../../../core/models/api.models';
import { formatTime } from '../../../core/utils/calendar.util';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-appointment-list-item',
  imports: [StatusBadgeComponent, UiIconComponent],
  templateUrl: './appointment-list-item.component.html',
  host: { class: 'block' }
})
export class AppointmentListItemComponent {
  appointment = input.required<AppointmentSummaryItem>();
  /** Patients already know who they are: show the doctor as the title instead. */
  doctorAsTitle = input(false);

  protected readonly timeLabel = computed(() => {
    const { startTime, endTime } = this.appointment();
    return endTime ? `${formatTime(startTime)} – ${formatTime(endTime)}` : formatTime(startTime);
  });
}
