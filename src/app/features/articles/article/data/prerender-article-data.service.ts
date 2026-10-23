import { inject, Injectable, TransferState } from "@angular/core";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { marked } from "marked";
import { of } from "rxjs";
import pages from "@core/seo/pages.json";
import { ArticleDataService, articleStateKey } from "./article-data.service";

// Provided only by app.config.server.ts. Node and Marked stay out of browser JS.
@Injectable()
export class PrerenderArticleDataService implements Pick<
  ArticleDataService,
  "fetch"
> {
  private readonly state = inject(TransferState);

  fetch(slug: string) {
    if (
      !pages.some((page) => page.type === "Article" && page.path === `/${slug}`)
    ) {
      return of(null);
    }
    // Build from the reviewed checkout, even before its Functions are deployed.
    const markdown = readFileSync(
      resolve(process.cwd(), "functions/content", `${slug}.md`),
      "utf8",
    );
    const article = { html: marked.parse(markdown, { async: false }) };
    this.state.set(articleStateKey(slug), article);
    return of(article);
  }
}
