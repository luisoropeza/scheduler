import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export const handleUri: HttpInterceptorFn = (req, next) => {

  const uriBase = environment.apiUrl;

  const requestWithUri = req.clone({
    url: uriBase + req.url
  });

  return next(requestWithUri);
};
