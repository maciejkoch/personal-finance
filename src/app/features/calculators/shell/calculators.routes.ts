import { CreateRoutesFn } from "@shared/router/create-routes";
import { CalculatorsShellComponent } from "./calculators-shell.component";

export const createRoutes: CreateRoutesFn = () => [
  {
    path: "",
    component: CalculatorsShellComponent,
    children: [
      { path: "", pathMatch: "full", redirectTo: "treasury-bonds" },
      {
        path: "long-term-savings",
        loadComponent: async () =>
          (await import("../long-term-savings/long-term-savings.component"))
            .LongTermSavingsComponent,
      },
      {
        path: "regular-contribution",
        loadComponent: async () =>
          (
            await import(
              "../regular-contribution/regular-contribution.component"
            )
          ).RegularContributionComponent,
      },
      {
        path: "treasury-bonds",
        loadComponent: async () =>
          (await import("../treasury-bonds/treasury-bonds.component"))
            .TreasuryBondsComponent,
      },
    ],
  },
];
