import * as cors from 'cors';
import * as logger from 'firebase-functions/logger';
import { onRequest } from 'firebase-functions/v2/https';
import { execute as executeRegularContributions } from './regular-contributions/regular-contributions';
import { execute as executeSavings } from './savings/savings';

export const helloWorld = onRequest((request, response) => {
  logger.info('Hello logs!', { structuredData: true });
  response.send('Hello from Firebase!');
});

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
