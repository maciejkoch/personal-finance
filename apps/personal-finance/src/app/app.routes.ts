import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  // Blog has been disabled for now
  // {
  //   path: '',
  //   loadComponent: async () => (await import('@pf/blog')).BlogComponent,
  // },
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
    path: ':slug',
    loadComponent: async () => (await import('@pf/blog')).ArticleComponent,
  },
  {
    path: '**',
    redirectTo: 'calculators', // since blog is disabled
  },
];
