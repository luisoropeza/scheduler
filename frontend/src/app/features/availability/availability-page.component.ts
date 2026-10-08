import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { filter, map, switchMap } from 'rxjs';
import { AgendaApi } from '../../core/api/agenda.api';
import { AuthService } from '../../core/auth/auth.service';
import { apiErrorMessage } from '../../core/http/api-error';
import { Availability, ScheduleException } from '../../core/models/api.models';
import { formatLongDate, formatTime, toIso } from '../../core/utils/calendar.util';
import { DAYS_OF_WEEK } from '../../core/utils/labels.util';
import { NotificationService } from '../../shared/services/notification.service';
import { ConfirmService } from '../../shared/ui/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { UiIconComponent } from '../../shared/ui/ui-icon/ui-icon.component';
import { AvailabilityFormDialogComponent } from './availability-form-dialog.component';
import { ExceptionFormDialogComponent } from './exception-form-dialog.component';

/** DOCTOR: weekly availability blocks, schedule exceptions and a preview of the resulting free slots. */
@Component({
  selector: 'app-availability-page',
  imports: [FormsModule, PageHeaderComponent, EmptyStateComponent, UiIconComponent],
  templateUrl: './availability-page.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' }
})
export class AvailabilityPageComponent {
  private readonly api = inject(AgendaApi);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(Dialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);

  private readonly doctorId = this.auth.userId()!;
  protected readonly today = toIso(new Date());
  protected readonly formatTime = formatTime;
  protected readonly formatLongDate = formatLongDate;

  protected readonly availabilityResource = rxResource({ loader: () => this.api.availabilities(this.doctorId) });
  protected readonly exceptionsResource = rxResource({ loader: () => this.api.exceptions(this.today) });

  protected readonly week = computed(() => {
    const blocks = this.availabilityResource.value() ?? [];
    return DAYS_OF_WEEK.map((day) => ({
      ...day,
      blocks: blocks.filter((block) => block.dayOfWeek === day.value).sort((a, b) => a.startTime.localeCompare(b.startTime))
    }));
  });

  protected readonly previewDate = signal(this.today);
  protected readonly previewResource = rxResource({
    request: () => this.previewDate(),
    loader: ({ request }) => this.api.availableSlots(this.doctorId, request).pipe(map((res) => res.availableSlots.map(formatTime)))
  });

  protected addAvailability(): void {
    this.dialog
      .open<boolean>(AvailabilityFormDialogComponent, { backdropClass: 'glass-backdrop' })
      .closed.pipe(filter(Boolean))
      .subscribe(() => {
        this.notifications.success('Horario agregado');
        this.refresh();
      });
  }

  protected removeAvailability(block: Availability, dayLabel: string): void {
    this.confirm
      .ask({
        title: 'Quitar horario',
        message: `¿Quitar el bloque del ${dayLabel.toLowerCase()} de ${formatTime(block.startTime)} a ${formatTime(block.endTime)}? Las citas ya agendadas se mantienen.`,
        confirmLabel: 'Quitar',
        danger: true
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.removeAvailability(block.id))
      )
      .subscribe({
        next: () => {
          this.notifications.success('Horario quitado');
          this.refresh();
        },
        error: (error) => this.notifications.error(apiErrorMessage(error))
      });
  }

  protected addException(): void {
    this.dialog
      .open<boolean>(ExceptionFormDialogComponent, { backdropClass: 'glass-backdrop' })
      .closed.pipe(filter(Boolean))
      .subscribe(() => {
        this.notifications.success('Agenda bloqueada');
        this.refresh();
      });
  }

  protected removeException(exception: ScheduleException): void {
    this.confirm
      .ask({
        title: 'Quitar bloqueo',
        message: `¿Habilitar nuevamente el ${formatLongDate(exception.date).toLowerCase()}?`,
        confirmLabel: 'Quitar'
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.removeException(exception.id))
      )
      .subscribe({
        next: () => {
          this.notifications.success('Bloqueo quitado');
          this.refresh();
        },
        error: (error) => this.notifications.error(apiErrorMessage(error))
      });
  }

  protected setPreviewDate(iso: string): void {
    if (iso) this.previewDate.set(iso);
  }

  private refresh(): void {
    this.availabilityResource.reload();
    this.exceptionsResource.reload();
    this.previewResource.reload();
  }
}
