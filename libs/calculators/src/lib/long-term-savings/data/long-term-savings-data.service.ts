import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  LongTermSavingsData,
  LongTermSavingsRequest,
} from '../model/long-term-savings.model';

@Injectable({
  providedIn: 'root',
})
export class LongTermSavingsDataService {
  #httpClient = inject(HttpClient);

  calculate(
    request: LongTermSavingsRequest
  ): Observable<LongTermSavingsData | null> {
    const host = 'https://calculatesavingshttpfunction-4mtb3gtbjq-uc.a.run.app';

    const inflation = request.skipInflation ? 0 : request.inflation;
    const rate = request.skipRate ? 0 : request.rate;

    const url = `${host}?amount=${request.amount}&duration=${
      request.duration
    }&inflation=${inflation / 100}&rate=${rate / 100}&skipTax=${
      request.skipTax
    }`;

    return this.#httpClient
      .get<{ data: LongTermSavingsData }>(url)
      .pipe(map((result) => ({ ...result.data, ...request })));
  }
}
