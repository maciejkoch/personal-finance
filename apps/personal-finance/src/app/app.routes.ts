import { Route } from "@angular/router";
import pages from "./seo/pages.json";

export const appRoutes: Route[] = [
  {
    path: "",
    pathMatch: "full",
    loadComponent: () =>
      import("./home/home.component").then((m) => m.HomeComponent),
  },
  {
    path: "calculators",
    loadChildren: () =>
      import("@pf/calculators").then((m) => m.createRoutes("calculators")),
  },
  {
    path: "about-us",
    loadComponent: async () => (await import("@pf/about-us")).AboutUsComponent,
  },
  ...pages
    .filter((page) => page.type === "Article")
    .map((page) => ({
      path: page.path.slice(1),
      data: { slug: page.path.slice(1) },
      loadComponent: async () => (await import("@pf/blog")).ArticleComponent,
    })),
  {
    path: "**",
    loadComponent: () =>
      import("./not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
];
