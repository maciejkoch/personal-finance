import {
  ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideExperimentalZonelessChangeDetection(),
    provideRouter(
      appRoutes,
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      })
    ),
  ],
};
