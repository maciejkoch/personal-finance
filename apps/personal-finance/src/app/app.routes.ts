import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: async () => (await import('@pf/blog')).BlogComponent,
  },
  {
    path: 'calculators',
    loadComponent: async () =>
      (await import('@pf/calculators')).CalculatorsShellComponent,
  },
  {
    path: 'about-us',
    loadComponent: async () => (await import('@pf/about-us')).AboutUsComponent,
  },
  {
    path: '404',
    loadComponent: async () => (await import('@pf/blog')).BlogComponent, // temp
  },
  {
    path: '**',
    redirectTo: '404',
  },
];
