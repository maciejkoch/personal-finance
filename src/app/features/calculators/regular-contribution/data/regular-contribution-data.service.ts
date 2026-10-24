import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import { regularContributionResultSchema } from "@contracts/savings";
import { validateTimeline } from "../../shared/validate-timeline";
import {
  RegularContributionData,
  RegularContributionRequest,
} from "../model/regular-contribution.model";

@Injectable({ providedIn: "root" })
export class RegularContributionDataService {
  #httpClient = inject(HttpClient);
  #endpoints = inject(API_ENDPOINTS);

  calculate(
    request: RegularContributionRequest,
  ): Observable<RegularContributionData> {
    const params = new HttpParams({
      fromObject: {
        contribution: request.contribution,
        initialCapital: request.initialCapital ?? 0,
        duration: request.duration,
        rate: (request.skipRate ? 0 : request.rate) / 100,
        skipTax: request.skipTax,
      },
    });
    return this.#httpClient
      .get<{ data: unknown }>(this.#endpoints.regularContribution, { params })
      .pipe(
        map((response) => {
          const result = regularContributionResultSchema.parse(response.data);
          validateTimeline(result, request.duration);
          if (result.initialCapital !== (request.initialCapital ?? 0))
            throw new Error("Incompatible initial capital");
          return { ...request, ...result };
        }),
      );
  }
}
