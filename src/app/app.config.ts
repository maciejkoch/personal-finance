import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import { ApplicationConfig, LOCALE_ID } from "@angular/core";
import {
  provideClientHydration,
  withNoIncrementalHydration,
} from "@angular/platform-browser";
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
  withRouterConfig,
  withViewTransitions,
} from "@angular/router";
import { appCheckInterceptor } from "./core/http/app-check.interceptor";
import { appRoutes } from "./app.routes";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import { environment } from "../environments/environment";
import { skipCalculatorTransition } from "./shared/router/view-transitions";

import "@angular/common/locales/global/pl";
import {
  SEO_INDEXABLE,
  SeoTitleStrategy,
} from "./core/seo/seo-title-strategy.service";

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    { provide: SEO_INDEXABLE, useValue: environment.seoIndexable },
    { provide: API_ENDPOINTS, useValue: environment.apiEndpoints },
    { provide: LOCALE_ID, useValue: "pl-PL" },
    provideClientHydration(withNoIncrementalHydration()),
    provideRouter(
      appRoutes,
      withRouterConfig({
        onSameUrlNavigation: "reload",
      }),
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
      }),
      withViewTransitions({
        onViewTransitionCreated: skipCalculatorTransition,
      }),
      withComponentInputBinding(),
    ),
    provideHttpClient(withFetch(), withInterceptors([appCheckInterceptor])),
  ],
};
