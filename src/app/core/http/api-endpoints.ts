import { InjectionToken } from "@angular/core";

export interface ApiEndpoints {
  savings: string;
  regularContribution: string;
  treasuryBonds: string;
  article: string;
}

const warsaw =
  "https://europe-central2-personal-finance-2ee61.cloudfunctions.net";
export const PRODUCTION_API_ENDPOINTS: ApiEndpoints = {
  savings: `${warsaw}/calculateSavingsWarsaw`,
  regularContribution: `${warsaw}/calculateRegularContributionWarsaw`,
  treasuryBonds: `${warsaw}/calculateTreasuryBondsWarsaw`,
  article: `${warsaw}/articleWarsaw`,
};

export const API_ENDPOINTS = new InjectionToken<ApiEndpoints>("API_ENDPOINTS", {
  providedIn: "root",
  factory: () => PRODUCTION_API_ENDPOINTS,
});
