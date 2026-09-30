import { Directive, inject } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { RegisterService } from '../../../../../shared/services/register.service';
import { LoaderService } from '../../../../../shared/services/loader.service';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Directive({
  selector: '[appClickRegister]',
  host: { '(click)': 'onClick()' }
})
export class ClickRegisterDirective {
  private readonly _formGroupDirective = inject(FormGroupDirective);
  private readonly _registerService = inject(RegisterService);
  private readonly _loaderService = inject(LoaderService);
  private readonly _notificationService = inject(NotificationService);

  onClick() {
    if (this._formGroupDirective.form.invalid) {
      this._formGroupDirective.form.markAllAsTouched();
      return;
    }

    this._loaderService.show();

    this._registerService
      .register(this._formGroupDirective.form.value)
      .pipe(finalize(() => this._loaderService.hide()))
      .subscribe({
        next: () => {
          this._notificationService.success('Registro completado con éxito');
          this._formGroupDirective.resetForm();
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message ?? 'Ocurrió un error al registrar, intenta de nuevo';
          this._notificationService.error(message);
        },
      });
  }
}
