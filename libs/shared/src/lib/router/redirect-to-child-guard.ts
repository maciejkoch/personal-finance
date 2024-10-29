import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

type RedirectToChildFn = (parentUrl: string, childUrl: string) => CanActivateFn;

export const redirectToChild: RedirectToChildFn =
  (parentUrl, childUrl) => (_, state) => {
    const router = inject(Router);

    if (state.url === '/' + parentUrl) {
      return router.createUrlTree([parentUrl, '/', childUrl]);
    }
    return true;
  };
