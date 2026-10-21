import { ApiEndpoints } from "@pf/shared";

const base = "http://127.0.0.1:5001/personal-finance-2ee61/us-central1";

export const environment: { apiEndpoints: ApiEndpoints } = {
  apiEndpoints: {
    savings: `${base}/calculateSavingsHttpFunction`,
    regularContribution: `${base}/calculateRegularContributionHttpFunction`,
    treasuryBonds: `${base}/calculateTreasuryBondsHttpFunction`,
    article: `${base}/articleHttpFunction`,
  },
};
