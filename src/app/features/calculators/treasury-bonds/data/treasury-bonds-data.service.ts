import * as offer from "@data/bond-offer";
import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import {
  TreasuryBondsRequest,
  TreasuryBondsResult,
} from "../model/treasury-bonds.model";

@Injectable({
  providedIn: "root",
})
export class TreasuryBondsDataService {
  #httpClient = inject(HttpClient);
  #endpoints = inject(API_ENDPOINTS);

  calculate(
    request: TreasuryBondsRequest,
  ): Observable<TreasuryBondsResult | null> {
    const host = this.#endpoints.treasuryBonds;
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
      .pipe(
        map((result) => {
          if (
            result.data.offerVersion !== offer.version ||
            result.data.calculationVersion !== 2
          ) {
            throw new Error("Incompatible bond offer or calculation version");
          }
          return { ...result.data, ...request };
        }),
      );
  }
}
