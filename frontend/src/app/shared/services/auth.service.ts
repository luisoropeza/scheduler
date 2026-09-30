import { inject, Injectable } from "@angular/core";
import { LoginService } from "./login.service";
import { loginRequest } from "../../features/login/interfaces/login.interface";
import { tap } from "rxjs";
import { Router } from "@angular/router";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  role: string;
  sub?: string;
  exp?: number;
  iat?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly _loginService = inject(LoginService);
  private readonly _router = inject(Router);

  public login(credentials: loginRequest) {
    this._loginService.login(credentials)
      .pipe(
        tap((token) => this.decodeToken(token.token)),
        tap((token) => this._saveToken(token.token)),
        tap(() => this._router.navigate(['./clinic-options']))
      )
      .subscribe();
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this._router.navigate(['./login'])
  }

  public isTokenExpired(token: string): boolean {
    let decoded: TokenPayload;

    try {
      decoded = jwtDecode<TokenPayload>(token);
    } catch {
      return true;
    }

    if (!decoded.exp) {
      return true;
    }

    const expirationDate = decoded.exp * 1000;

    return Date.now() >= expirationDate;
  }

  private _saveToken(token: string) {
    localStorage.setItem("token", token);
  }

  private decodeToken(token: string) {
    const tokenDecodificado = jwtDecode<TokenPayload>(token);
    localStorage.setItem('role', tokenDecodificado.role)
  }
}
