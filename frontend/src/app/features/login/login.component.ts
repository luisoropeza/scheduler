import { Component } from '@angular/core';
import { BannerComponent } from '../register/components/banner/banner.component';
import { LoginFormComponent } from './components/login-form/login-form.component';

@Component({
  selector: 'app-login',
  imports: [BannerComponent, LoginFormComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {}
