import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { InputComponentComponent } from '../../../../shared/components/input-component/input-component.component';
import { SelectComponentComponent } from '../../../../shared/components/select-component/select-component.component';
import { ButtonComponentComponent } from '../../../../shared/components/button-component/button-component.component';
import { InputType } from '../../../../shared/components/input-component/enums/input-type.enum';
import { ClickRegisterDirective } from "./directives/click-register.directive";
import { ɵInternalFormsSharedModule, ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { REGISTER_FORM } from './constants/register-form.constants';

@Component({
  selector: 'app-register-form',
  imports: [InputComponentComponent, ButtonComponentComponent, ClickRegisterDirective, ɵInternalFormsSharedModule, ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  host: { class: 'flex min-h-screen items-center justify-center px-6 py-10' }
})
export class RegisterFormComponent {
  protected inputType = InputType;
  protected router = inject(Router)
  private readonly _formBuilder = inject(FormBuilder)
  protected formGroup = this._formBuilder.group(REGISTER_FORM)

  protected navigate(e: Event) {
    e.preventDefault()
    this.router.navigate(["/login"])
  }
  protected rolesData = [
    { label: 'Doctor', value: 1 },
    { label: 'Nurse', value: 2 },
    { label: 'Patient', value: 3 },
  ];
  protected specialityData = [
    { label: 'Cardiology', value: 1 },
    { label: 'Dermatology', value: 2 },
    { label: 'Neurology', value: 3 },
    { label: 'Pediatrics', value: 4 },
    { label: 'Psychiatry', value: 5 },
    { label: 'Radiology', value: 6 },
    { label: 'Surgery', value: 7 },
  ];
}
