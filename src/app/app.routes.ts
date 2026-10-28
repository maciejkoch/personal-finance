import { inject } from "@angular/core";
import { Route, Router } from "@angular/router";
import pages from "./core/seo/pages.json";

export const legacyPageRedirects: Route[] = [
  ["calculators", "/kalkulatory/obligacje-skarbowe"],
  ["calculators/treasury-bonds", "/kalkulatory/obligacje-skarbowe"],
  ["calculators/regular-contribution", "/kalkulatory/regularne-oszczedzanie"],
  ["calculators/long-term-savings", "/kalkulatory/oszczedzanie-na-cel"],
  ["about-us", "/o-nas"],
].flatMap(([path, destination]) =>
  [path, `${path}/`].map((legacyPath): Route => ({
    path: legacyPath,
    pathMatch: "full",
    redirectTo: ({ queryParams, fragment }) =>
      inject(Router).createUrlTree([destination], {
        queryParams,
        fragment: fragment ?? undefined,
      }),
  })),
);

export const appRoutes: Route[] = [
  ...legacyPageRedirects,
  {
    path: "",
    pathMatch: "full",
    loadComponent: () =>
      import("./features/home/home.component").then((m) => m.HomeComponent),
  },
  {
    path: "kalkulatory",
    loadChildren: () =>
      import("@features/calculators/shell/calculators.routes").then((m) =>
        m.createRoutes("kalkulatory"),
      ),
  },
  {
    path: "inflacja",
    loadComponent: () =>
      import("./features/inflation/inflation.component").then(
        (m) => m.InflationComponent,
      ),
  },
  {
    path: "o-nas",
    loadComponent: async () =>
      (await import("@features/about/about-us.component")).AboutUsComponent,
  },
  ...pages
    .filter((page) => page.type === "Article")
    .map((page) => ({
      path: page.path.slice(1),
      data: { slug: page.path.slice(1) },
      loadComponent: async () =>
        (await import("@features/articles/article/article.component"))
          .ArticleComponent,
    })),
  {
    path: "**",
    loadComponent: () =>
      import("./features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
];
