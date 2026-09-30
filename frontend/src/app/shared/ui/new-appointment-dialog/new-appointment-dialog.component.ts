import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Priority } from '../../../core/models/appointment.model';
import { formatTime } from '../../../core/utils/calendar.util';

export interface NewAppointmentDialogData {
  dayLabel: string;
}

export interface NewAppointmentResult {
  patientName: string;
  reason: string;
  time: string;
  durationMinutes: number;
  priority: Priority;
  doctor?: string;
}

@Component({
  selector: 'app-new-appointment-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './new-appointment-dialog.component.html'
})
export class NewAppointmentDialogComponent {
  private readonly dialogRef = inject(DialogRef<NewAppointmentResult>);
  private readonly fb = inject(FormBuilder);
  protected readonly data = inject<NewAppointmentDialogData>(DIALOG_DATA);

  protected readonly form = this.fb.nonNullable.group({
    patientName: ['', Validators.required],
    reason: ['', Validators.required],
    time: ['09:00', Validators.required],
    durationMinutes: [30, [Validators.required, Validators.min(5)]],
    priority: ['low' as Priority, Validators.required],
    doctor: ['']
  });

  protected close(): void {
    this.dialogRef.close();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.dialogRef.close({ ...raw, time: formatTime(raw.time), doctor: raw.doctor || undefined });
  }
}
