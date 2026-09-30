import { Directive, inject } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { LoginService } from '../../../shared/services/login.service';
import { AuthService } from '../../../shared/services/auth.service';
import { loginRequest } from '../interfaces/login.interface';

@Directive({
  selector: '[appClickLogin]',
  host: { '(click)': 'onClick()' }

})
export class ClickLoginDirective {
  private readonly _loginService = inject(LoginService)
  private readonly _authService = inject(AuthService)
  private readonly _formGroupDirective = inject(FormGroupDirective)
  public onClick() {
    const form = this._formGroupDirective.form
    this._authService.login(form.value)

  }

}
