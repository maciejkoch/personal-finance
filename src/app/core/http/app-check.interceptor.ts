import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { defer, switchMap } from "rxjs";
import { API_ENDPOINTS } from "./api-endpoints";
import { AppCheckService } from "./app-check.service";

export const appCheckInterceptor: HttpInterceptorFn = (request, next) => {
  const endpoints = inject(API_ENDPOINTS);
  // Match the complete endpoint, allowing only query parameters. Never leak tokens
  // to another origin, a similar hostname, or an arbitrary path on our API host.
  if (!Object.values(endpoints).includes(request.url.split("?")[0]))
    return next(request);
  const appCheck = inject(AppCheckService);
  return defer(() => appCheck.token()).pipe(
    switchMap((token) =>
      next(
        token
          ? request.clone({ setHeaders: { "X-Firebase-AppCheck": token } })
          : request,
      ),
    ),
  );
};
