import { CreateRoutesFn, redirectToChild } from '@pf/shared';
import { CalculatorsShellComponent } from './calculators-shell.component';

export const createRoutes: CreateRoutesFn = (parent) => [
  {
    path: '',
    component: CalculatorsShellComponent,
    canActivate: [redirectToChild(parent, 'treasury-bonds')],
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: 'long-term-savings',
        loadComponent: async () =>
          (await import('../long-term-savings/long-term-savings.component'))
            .LongTermSavingsComponent,
      },
      {
        path: 'regular-contribution',
        loadComponent: async () =>
          (
            await import(
              '../regular-contribution/regular-contribution.component'
            )
          ).RegularContributionComponent,
      },
      {
        path: 'treasury-bonds',
        loadComponent: async () =>
          (await import('../treasury-bonds/treasury-bonds.component'))
            .TreasuryBondsComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'treasury-bonds',
  },
];
