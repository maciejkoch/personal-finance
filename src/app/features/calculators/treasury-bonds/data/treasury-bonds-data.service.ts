import { z } from "zod";
import {
  offerSchema,
  OfferCatalog,
  PublishedOffer,
} from "@contracts/bond-offer";
import * as offer from "@data/bond-offer";
import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import { adaptBondComparison } from "../model/bond-comparison-adapter";
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

  catalog(cursor?: string): Observable<OfferCatalog> {
    return this.#httpClient
      .get<{ data: OfferCatalog }>(this.#endpoints.treasuryBonds, {
        params: { action: "catalog", ...(cursor ? { cursor } : {}) },
      })
      .pipe(map((response) => response.data));
  }

  offer(id: string): Observable<PublishedOffer> {
    return this.#httpClient
      .get<{ data: PublishedOffer }>(this.#endpoints.treasuryBonds, {
        params: { action: "offer", offerId: id },
      })
      .pipe(
        map((response) => {
          const { offerId, ...raw } = response.data;
          if (offerId !== id || raw.version !== id)
            throw new Error("Incompatible offer");
          return {
            ...offerSchema.parse(raw),
            offerId: z.string().parse(offerId),
          };
        }),
      );
  }

  calculate(
    request: TreasuryBondsRequest,
  ): Observable<TreasuryBondsResult | null> {
    const host = this.#endpoints.treasuryBonds;
    const comparison =
      request.offerId !== undefined || request.familyEligible !== undefined;
    const fromObject = {
      ...request, //
      ...(comparison ? { contractVersion: request.offerId ? 4 : 3 } : {}),
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
          if (comparison) return adaptBondComparison(result.data, request);
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
