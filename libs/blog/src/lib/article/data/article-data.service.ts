import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArticleData, ArticleRequest } from '../model/article.model';

@Injectable({
  providedIn: 'root',
})
export class ArticleDataService {
  #httpClient = inject(HttpClient);

  fetch(request: ArticleRequest): Observable<ArticleData | null> {
    const host = 'https://articleHttpFunction-4mtb3gtbjq-uc.a.run.app';

    const url = `${host}?slug=${request}`;

    return this.#httpClient.get<ArticleData>(url);
  }
}
