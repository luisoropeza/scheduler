import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";
import { AuthService } from "../../shared/services/auth.service";

export const errorAuthInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);

  const token = authService.getToken();

  if (token && authService.isTokenExpired(token)) {

    authService.logout();

    return next(req);
  }

  const requestWithToken = token
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    : req;

  return next(requestWithToken).pipe(

    catchError((error: HttpErrorResponse) => {

      if (error.status === HttpStatusCode.Unauthorized) {
        authService.logout();
      }

      return throwError(() => error);

    })

  );
};
