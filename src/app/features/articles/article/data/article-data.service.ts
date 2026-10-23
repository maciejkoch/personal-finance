import { HttpClient } from "@angular/common/http";
import { inject, Injectable, makeStateKey, TransferState } from "@angular/core";
import { Observable, of } from "rxjs";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import { ArticleData, ArticleRequest } from "../model/article.model";

export const articleStateKey = (slug: string) =>
  makeStateKey<ArticleData | null>(`article:${slug}`);

@Injectable({
  providedIn: "root",
})
export class ArticleDataService {
  #httpClient = inject(HttpClient);
  #endpoints = inject(API_ENDPOINTS);
  #transferState = inject(TransferState);

  fetch(request: ArticleRequest): Observable<ArticleData | null> {
    const key = articleStateKey(request);
    if (this.#transferState.hasKey(key)) {
      const article = this.#transferState.get(key, null);
      this.#transferState.remove(key);
      return of(article);
    }
    const host = this.#endpoints.article;

    const url = `${host}?slug=${request}`;

    return this.#httpClient.get<ArticleData>(url);
  }
}
