import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponentComponent } from "../../../../shared/components/button-component/button-component.component";
import { InputComponentComponent } from "../../../../shared/components/input-component/input-component.component";
import { InputType } from '../../../../shared/components/input-component/enums/input-type.enum';
import { Router } from '@angular/router';
import { ClickLoginDirective } from "../../directives/click-login.directive";

@Component({
  selector: 'app-login-form',
  imports: [ButtonComponentComponent, InputComponentComponent, ClickLoginDirective, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
  host: { class: 'flex h-full items-center justify-center px-6' }
})
export class LoginFormComponent {
  protected inputType = InputType;
  protected router = inject(Router)
  private readonly fb = inject(FormBuilder)

  protected form = this.fb.nonNullable.group({
    email: ['', Validators.required],
    password: ['', Validators.required]
  })

  protected navigate(e: Event) {
    e.preventDefault()
    this.router.navigate(["/register"])
  }
}
