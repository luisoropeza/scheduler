import { Component, computed, input } from '@angular/core';
import { AppointmentSummaryItem } from '../../../core/models/api.models';
import { formatDayLabel, formatTime } from '../../../core/utils/calendar.util';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-board-card',
  imports: [UiIconComponent],
  templateUrl: './board-card.component.html',
  // Consumers bind (click) on the host; Enter/Space re-dispatch it so keyboard users get the same action.
  // Focus outline comes from the global :focus-visible rule in styles.css.
  host: {
    class: 'block rounded-2xl',
    '[attr.role]': 'interactive() ? "button" : null',
    '[attr.tabindex]': 'interactive() ? 0 : null',
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
})
export class BoardCardComponent {
  appointment = input.required<AppointmentSummaryItem>();
  /** Show the day too (when the board spans more than one day). */
  showDate = input(false);
  draggable = input(true);

  protected activate(event: Event): void {
    if (!this.interactive()) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).click();
  }

  /** Items without id (backend does not send one yet) can't be opened, so they are not presented as buttons. */
  protected readonly interactive = computed(() => this.appointment().id !== null);
  protected readonly timeLabel = computed(() => {
    const { startTime, endTime } = this.appointment();
    return endTime ? `${formatTime(startTime)} – ${formatTime(endTime)}` : formatTime(startTime);
  });
  protected readonly dayLabel = computed(() => formatDayLabel(this.appointment().appointmentDate));
}
