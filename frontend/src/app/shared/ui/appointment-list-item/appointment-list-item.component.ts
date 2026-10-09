import { Component, computed, input } from '@angular/core';
import { AppointmentSummaryItem } from '../../../core/models/api.models';
import { formatTime } from '../../../core/utils/calendar.util';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-appointment-list-item',
  imports: [StatusBadgeComponent, UiIconComponent],
  templateUrl: './appointment-list-item.component.html',
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
export class AppointmentListItemComponent {
  appointment = input.required<AppointmentSummaryItem>();
  /** Patients already know who they are: show the doctor as the title instead. */
  doctorAsTitle = input(false);

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
}
