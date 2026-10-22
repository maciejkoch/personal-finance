import { Route } from "@angular/router";
import pages from "./core/seo/pages.json";

export const appRoutes: Route[] = [
  {
    path: "",
    pathMatch: "full",
    loadComponent: () =>
      import("./features/home/home.component").then((m) => m.HomeComponent),
  },
  {
    path: "calculators",
    loadChildren: () =>
      import("@features/calculators/shell/calculators.routes").then((m) => m.createRoutes("calculators")),
  },
  {
    path: "about-us",
    loadComponent: async () => (await import("@features/about/about-us.component")).AboutUsComponent,
  },
  ...pages
    .filter((page) => page.type === "Article")
    .map((page) => ({
      path: page.path.slice(1),
      data: { slug: page.path.slice(1) },
      loadComponent: async () => (await import("@features/articles/article/article.component")).ArticleComponent,
    })),
  {
    path: "**",
    loadComponent: () =>
      import("./features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
];
