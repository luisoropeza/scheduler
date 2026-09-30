import { Component } from '@angular/core';
import { RegisterFormComponent } from "./components/register-form/register-form.component";
import { BannerComponent } from "./components/banner/banner.component";
import { InputType } from '../../shared/components/input-component/enums/input-type.enum';

@Component({
  selector: 'app-register',
  imports: [ RegisterFormComponent, BannerComponent],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  protected inputType = InputType;
}
