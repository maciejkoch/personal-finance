import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import { savingsResultSchema } from "@contracts/savings";
import { validateTimeline } from "../../shared/validate-timeline";
import {
  LongTermSavingsData,
  LongTermSavingsRequest,
} from "../model/long-term-savings.model";

@Injectable({ providedIn: "root" })
export class LongTermSavingsDataService {
  #httpClient = inject(HttpClient);
  #endpoints = inject(API_ENDPOINTS);

  calculate(request: LongTermSavingsRequest): Observable<LongTermSavingsData> {
    const params = new HttpParams({
      fromObject: {
        amount: request.amount,
        inflation: (request.skipInflation ? 0 : request.inflation) / 100,
        initialCapital: request.initialCapital ?? 0,
        duration: request.duration,
        rate: (request.skipRate ? 0 : request.rate) / 100,
        skipTax: request.skipTax,
      },
    });
    return this.#httpClient
      .get<{ data: unknown }>(this.#endpoints.savings, { params })
      .pipe(
        map((response) => {
          const result = savingsResultSchema.parse(response.data);
          validateTimeline(result, request.duration);
          if (result.initialCapital !== (request.initialCapital ?? 0))
            throw new Error("Incompatible initial capital");
          return { ...request, ...result };
        }),
      );
  }
}
