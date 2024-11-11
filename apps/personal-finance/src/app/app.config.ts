import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withRouterConfig,
  withViewTransitions,
} from '@angular/router';
import { appRoutes } from './app.routes';

import '@angular/common/locales/global/pl';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'pl-PL' },
    provideClientHydration(),
    // provideExperimentalZonelessChangeDetection(), // TODO temporarily removed because pages are not pre-rendered
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      appRoutes,
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
      }),
      withViewTransitions(),
      withComponentInputBinding()
    ),
    provideHttpClient(withFetch()),
  ],
};
