import { provideServerRendering } from "@angular/ssr";
import { mergeApplicationConfig, ApplicationConfig } from "@angular/core";
import { appConfig } from "./app.config";
import { ArticleDataService } from "./features/articles/article/data/article-data.service";
import { PrerenderArticleDataService } from "./features/articles/article/data/prerender-article-data.service";

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    { provide: ArticleDataService, useClass: PrerenderArticleDataService },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
