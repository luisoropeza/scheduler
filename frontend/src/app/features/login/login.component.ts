import { Component } from '@angular/core';
import { InputComponentComponent } from "../../shared/components/input-component/input-component.component";
import { InputType } from '../../shared/components/input-component/enums/input-type.enum';
import { ButtonComponentComponent } from "../../shared/components/button-component/button-component.component";
import { BannerComponent } from "../register/components/banner/banner.component";
import { RegisterFormComponent } from "../register/components/register-form/register-form.component";
import { LoginFormComponent } from "./components/login-form/login-form.component";

@Component({
  selector: 'app-login',
  imports: [ BannerComponent, LoginFormComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
protected inputType = InputType;
}
