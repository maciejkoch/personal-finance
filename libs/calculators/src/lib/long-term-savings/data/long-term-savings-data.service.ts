import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  LongTermSavingsRequest,
  LongTermSavingsResponse,
} from './long-term-savings.model';

@Injectable({
  providedIn: 'root',
})
export class LongTermSavingsDataService {
  #httpClient = inject(HttpClient);

  calculate(
    request: LongTermSavingsRequest
  ): Observable<LongTermSavingsResponse | null> {
    const host =
      'https://us-central1-calc-b6a6d.cloudfunctions.net/calculateSavingsHttpFunction';

    const inflation = request.skipInflation ? 0 : request.inflation;
    const rate = request.skipRate ? 0 : request.rate;

    const url = `${host}?amount=${request.amount}&duration=${
      request.duration
    }&inflation=${inflation / 100}&rate=${rate / 100}&skipTax=${
      request.skipTax
    }`;

    return this.#httpClient
      .get<{ data: LongTermSavingsResponse }>(url)
      .pipe(map((result) => ({ ...result.data, ...request })));
  }
}
