import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  TreasuryBondsRequest,
  TreasuryBondsResult,
} from '../model/treasury-bonds.model';

@Injectable({
  providedIn: 'root',
})
export class TreasuryBondsDataService {
  #httpClient = inject(HttpClient);

  calculate(
    request: TreasuryBondsRequest
  ): Observable<TreasuryBondsResult | null> {
    const host =
      'http://127.0.0.1:5001/personal-finance-2ee61/us-central1/calculateTreasuryBondsHttpFunction';

    const fromObject = {
      ...request, //
      inflation: JSON.stringify(request.inflation),
      wibor6m: JSON.stringify(request.wibor6m),
      referenceRate: JSON.stringify(request.referenceRate),
      savingsRate: JSON.stringify(request.savingsRate),
    };
    const params = new HttpParams({ fromObject });

    return this.#httpClient
      .get<{ data: TreasuryBondsResult }>(host, { params })
      .pipe(map((result) => ({ ...result.data, ...request })));
  }
}
