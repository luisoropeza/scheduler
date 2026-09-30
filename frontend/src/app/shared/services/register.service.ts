import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterRequest } from '../../features/register/interfaces/register.interface';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private readonly url = environment.apiUrl;
  private readonly _http = inject(HttpClient);

  public register(data: RegisterRequest) {
    return this._http.post(`${this.url}clinics`, data)
  }
}
