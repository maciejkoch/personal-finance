import { CreateRoutesFn } from "@shared/router/create-routes";
import { CalculatorsShellComponent } from "./calculators-shell.component";

export const createRoutes: CreateRoutesFn = () => [
  {
    path: "",
    component: CalculatorsShellComponent,
    children: [
      { path: "", pathMatch: "full", redirectTo: "obligacje-skarbowe" },
      {
        path: "oszczedzanie-na-cel",
        loadComponent: async () =>
          (await import("../long-term-savings/long-term-savings.component"))
            .LongTermSavingsComponent,
      },
      {
        path: "regularne-oszczedzanie",
        loadComponent: async () =>
          (
            await import("../regular-contribution/regular-contribution.component")
          ).RegularContributionComponent,
      },
      {
        path: "obligacje-skarbowe",
        loadComponent: async () =>
          (await import("../treasury-bonds/treasury-bonds.component"))
            .TreasuryBondsComponent,
      },
    ],
  },
];
