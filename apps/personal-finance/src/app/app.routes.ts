import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: async () => (await import('@pf/blog')).BlogComponent,
  },
  {
    path: 'calculators',
    loadChildren: () =>
      import('@pf/calculators').then((m) => m.createRoutes('calculators')),
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
