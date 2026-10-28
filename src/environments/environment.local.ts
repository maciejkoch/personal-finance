import { ApiEndpoints } from "@core/http/api-endpoints";

const base = "http://127.0.0.1:5001/personal-finance-2ee61/europe-central2";

export const environment: {
  apiEndpoints: ApiEndpoints;
  seoIndexable: boolean;
} = {
  seoIndexable: false,
  apiEndpoints: {
    savings: `${base}/calculateSavingsWarsaw`,
    regularContribution: `${base}/calculateRegularContributionWarsaw`,
    treasuryBonds: `${base}/calculateTreasuryBondsWarsaw`,
    article: `${base}/articleWarsaw`,
    inflation: `${base}/inflationWarsaw`,
  },
};
