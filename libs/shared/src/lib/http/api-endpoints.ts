import { InjectionToken } from "@angular/core";

export interface ApiEndpoints {
  savings: string;
  regularContribution: string;
  treasuryBonds: string;
  article: string;
}

export const PRODUCTION_API_ENDPOINTS: ApiEndpoints = {
  savings: "https://calculatesavingshttpfunction-4mtb3gtbjq-uc.a.run.app",
  regularContribution:
    "https://calculateregularcontributionhttpfunction-4mtb3gtbjq-uc.a.run.app",
  treasuryBonds:
    "https://calculatetreasurybondshttpfunction-4mtb3gtbjq-uc.a.run.app",
  article: "https://articleHttpFunction-4mtb3gtbjq-uc.a.run.app",
};

export const API_ENDPOINTS = new InjectionToken<ApiEndpoints>("API_ENDPOINTS", {
  providedIn: "root",
  factory: () => PRODUCTION_API_ENDPOINTS,
});
