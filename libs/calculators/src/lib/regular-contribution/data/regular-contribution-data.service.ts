import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  RegularContributionData,
  RegularContributionRequest,
} from '../model/regular-contribution.model';

@Injectable({
  providedIn: 'root',
})
export class RegularContributionDataService {
  #httpClient = inject(HttpClient);

  calculate(
    request: RegularContributionRequest
  ): Observable<RegularContributionData | null> {
    const host =
      'https://calculateregularcontributionhttpfunction-4mtb3gtbjq-uc.a.run.app';

    const rate = request.skipRate ? 0 : request.rate;
    const url = `${host}?contribution=${request.contribution}&duration=${
      request.duration
    }&rate=${rate / 100}&skipTax=${request.skipTax}`;

    return this.#httpClient
      .get<{ data: RegularContributionData }>(url)
      .pipe(map((result) => ({ ...result.data, ...request })));
  }
}
