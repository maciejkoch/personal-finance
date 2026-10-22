import * as cors from 'cors';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import { buildId } from './build-info';
import { execute as executeArticle } from './articles/articles';
import { execute as executeRegularContributions } from './regular-contributions/regular-contributions';
import { execute as executeSavings } from './savings/savings';
import { execute as executeTreasuryBonds } from './treasury-bonds/treasury-bonds';

// Preserve the production scaling limit across Firebase CLI default changes.
setGlobalOptions({ maxInstances: 100 });

const whitelist = [
  'http://localhost:4200', //
  ...(process.env.FUNCTIONS_EMULATOR === 'true' ? ['http://localhost:4300'] : []),
  'https://personal-finance-2ee61.web.app',
  'https://oszczedzify.org'
];
const options: cors.CorsOptions = {
  origin: whitelist,
  exposedHeaders: ['X-Oszczedzify-Build'],
};

export const calculateSavingsHttpFunction = onRequest((request, response) => {
  response.setHeader('X-Oszczedzify-Build', buildId);
  cors(options)(request, response, () => executeSavings(request, response));
});

export const calculateRegularContributionHttpFunction = onRequest(
  (request, response) => {
    response.setHeader('X-Oszczedzify-Build', buildId);
    cors(options)(request, response, () =>
      executeRegularContributions(request, response)
    );
  }
);

export const calculateTreasuryBondsHttpFunction = onRequest(
  (request, response) => {
    response.setHeader('X-Oszczedzify-Build', buildId);
    cors(options)(request, response, () =>
      executeTreasuryBonds(request, response)
    );
  }
);

export const articleHttpFunction = onRequest((request, response) => {
  response.setHeader('X-Oszczedzify-Build', buildId);
  cors(options)(request, response, () => executeArticle(request, response));
});
