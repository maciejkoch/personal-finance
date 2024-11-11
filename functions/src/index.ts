import * as cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';
import { execute as executeArticle } from './articles/articles';
import { execute as executeRegularContributions } from './regular-contributions/regular-contributions';
import { execute as executeSavings } from './savings/savings';
import { execute as executeTreasuryBonds } from './treasury-bonds/treasury-bonds';

const whitelist = [
  'http://localhost:4200', //
  'https://personal-finance-2ee61.web.app',
];
const options: cors.CorsOptions = {
  origin: whitelist,
};

export const calculateSavingsHttpFunction = onRequest((request, response) => {
  cors(options)(request, response, () => executeSavings(request, response));
});

export const calculateRegularContributionHttpFunction = onRequest(
  (request, response) => {
    cors(options)(request, response, () =>
      executeRegularContributions(request, response)
    );
  }
);

export const calculateTreasuryBondsHttpFunction = onRequest(
  (request, response) => {
    cors(options)(request, response, () =>
      executeTreasuryBonds(request, response)
    );
  }
);

export const articleHttpFunction = onRequest((request, response) => {
  cors(options)(request, response, () => executeArticle(request, response));
});
