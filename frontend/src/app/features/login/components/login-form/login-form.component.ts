import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { apiErrorMessage } from '../../../../core/http/api-error';
import { ButtonComponentComponent } from '../../../../shared/components/button-component/button-component.component';
import { InputType } from '../../../../shared/components/input-component/enums/input-type.enum';
import { InputComponentComponent } from '../../../../shared/components/input-component/input-component.component';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-login-form',
  imports: [ButtonComponentComponent, InputComponentComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './login-form.component.html',
  host: { class: 'flex h-full items-center justify-center px-6' }
})
export class LoginFormComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly inputType = InputType;
  protected readonly clinic = this.auth.clinic;
  protected readonly submitting = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  protected submit(): void {
    const clinic = this.clinic();
    if (!clinic) {
      this.router.navigate(['/clinic-options']);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.auth
      .login(email.trim(), password, clinic.id)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl(this.auth.homeUrl()),
        error: (error) => this.notifications.error(apiErrorMessage(error, 'No se pudo iniciar sesión'))
      });
  }
}
