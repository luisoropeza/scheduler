import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { HttpClient } from "@angular/common/http";
import { loginRequest, loginResponse } from "../../features/login/interfaces/login.interface";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly url = environment.apiUrl;
  private readonly _http = inject(HttpClient);

  public login(credentials: loginRequest): Observable<loginResponse> {
    return this._http.post<loginResponse>(`auth/login`, credentials)
  }
}
