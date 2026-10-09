import { Component, inject, signal } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AgendaApi } from '../../core/api/agenda.api';
import { apiErrorMessage } from '../../core/http/api-error';
import { DayOfWeek } from '../../core/models/api.models';
import { DAYS_OF_WEEK } from '../../core/utils/labels.util';
import { DialogFrameComponent } from '../../shared/ui/dialog-frame/dialog-frame.component';

function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const { startTime, endTime } = group.value as { startTime: string; endTime: string };
  return startTime && endTime && endTime <= startTime ? { endBeforeStart: true } : null;
}

/** Adds one weekly block. Several days can be selected at once: one POST per day (the API takes a single day). */
@Component({
  selector: 'app-availability-form-dialog',
  imports: [DialogFrameComponent, ReactiveFormsModule],
  templateUrl: './availability-form-dialog.component.html',
})
export class AvailabilityFormDialogComponent {
  private readonly api = inject(AgendaApi);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly days = DAYS_OF_WEEK;
  protected readonly durations = [15, 20, 30, 45, 60];
  protected readonly selectedDays = signal<Set<DayOfWeek>>(new Set(['MONDAY']));
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      startTime: ['08:00', Validators.required],
      endTime: ['12:00', Validators.required],
      slotDurationMinutes: [30, [Validators.required, Validators.min(5)]],
    },
    { validators: endAfterStart },
  );

  protected toggleDay(day: DayOfWeek): void {
    this.selectedDays.update((days) => {
      const next = new Set(days);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  protected close(): void {
    this.ref.close(false);
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    if (this.form.invalid || !this.selectedDays().size) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const days = this.days.map((d) => d.value).filter((day) => this.selectedDays().has(day));
    this.saving.set(true);
    this.error.set(null);

    let createdAny = false;
    for (const dayOfWeek of days) {
      try {
        await firstValueFrom(this.api.addAvailability({ dayOfWeek, ...value }));
        createdAny = true;
      } catch (error) {
        this.error.set(apiErrorMessage(error, 'No se pudo guardar el horario'));
        this.saving.set(false);
        if (createdAny) this.ref.close(true);
        return;
      }
    }
    this.saving.set(false);
    this.ref.close(true);
  }
}
