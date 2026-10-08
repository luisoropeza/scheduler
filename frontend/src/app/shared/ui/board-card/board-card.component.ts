import { Component, computed, input } from '@angular/core';
import { AppointmentSummaryItem } from '../../../core/models/api.models';
import { formatDayLabel, formatTime } from '../../../core/utils/calendar.util';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-board-card',
  imports: [UiIconComponent],
  templateUrl: './board-card.component.html',
  host: { class: 'block' }
})
export class BoardCardComponent {
  appointment = input.required<AppointmentSummaryItem>();
  /** Show the day too (when the board spans more than one day). */
  showDate = input(false);
  draggable = input(true);

  protected readonly timeLabel = computed(() => {
    const { startTime, endTime } = this.appointment();
    return endTime ? `${formatTime(startTime)} – ${formatTime(endTime)}` : formatTime(startTime);
  });
  protected readonly dayLabel = computed(() => formatDayLabel(this.appointment().appointmentDate));
}
