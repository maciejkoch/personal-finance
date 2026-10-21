import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@pf/shared';
import { ArticleData, ArticleRequest } from '../model/article.model';

@Injectable({
  providedIn: 'root',
})
export class ArticleDataService {
  #httpClient = inject(HttpClient);
  #endpoints = inject(API_ENDPOINTS);

  fetch(request: ArticleRequest): Observable<ArticleData | null> {
    const host = this.#endpoints.article;

    const url = `${host}?slug=${request}`;

    return this.#httpClient.get<ArticleData>(url);
  }
}
