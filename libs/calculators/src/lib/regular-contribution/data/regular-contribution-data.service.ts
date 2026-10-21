import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_ENDPOINTS } from '@pf/shared';
import {
  RegularContributionData,
  RegularContributionRequest,
} from '../model/regular-contribution.model';

@Injectable({
  providedIn: 'root',
})
export class RegularContributionDataService {
  #httpClient = inject(HttpClient);
  #endpoints = inject(API_ENDPOINTS);

  calculate(
    request: RegularContributionRequest
  ): Observable<RegularContributionData | null> {
    const host = this.#endpoints.regularContribution;

    const rate = request.skipRate ? 0 : request.rate;
    const url = `${host}?contribution=${request.contribution}&duration=${
      request.duration
    }&rate=${rate / 100}&skipTax=${request.skipTax}`;

    return this.#httpClient
      .get<{ data: RegularContributionData }>(url)
      .pipe(map((result) => ({ ...result.data, ...request })));
  }
}
