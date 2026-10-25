import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { syncOffers } from "./bond-offers/importer";
import { serveOffers } from "./bond-offers/http";
import cors from "cors";
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { buildId } from "./build-info";
import { execute as executeArticle } from "./articles/articles";
import { execute as executeRegularContributions } from "./regular-contributions/regular-contributions";
import { execute as executeSavings } from "./savings/savings";
import { execute as executeTreasuryBonds } from "./treasury-bonds/treasury-bonds";

// Preserve the production scaling limit across Firebase CLI default changes.
setGlobalOptions({ maxInstances: 100 });

const whitelist = [
  "http://localhost:4200", //
  ...(process.env.FUNCTIONS_EMULATOR === "true"
    ? ["http://localhost:4300"]
    : []),
  "https://personal-finance-2ee61.web.app",
  "https://oszczedzify.org",
];
const options: cors.CorsOptions = {
  origin: whitelist,
  exposedHeaders: ["X-Oszczedzify-Build"],
};

// Keep CORS in our middleware, including when emulator debug features are on.
export const calculateSavingsHttpFunction = onRequest(
  { cors: false },
  (request, response) => {
    response.setHeader("X-Oszczedzify-Build", buildId);
    cors(options)(request, response, () => executeSavings(request, response));
  },
);

export const calculateRegularContributionHttpFunction = onRequest(
  { cors: false },
  (request, response) => {
    response.setHeader("X-Oszczedzify-Build", buildId);
    cors(options)(request, response, () =>
      executeRegularContributions(request, response),
    );
  },
);

export const calculateTreasuryBondsHttpFunction = onRequest(
  { cors: false },
  (request, response) => {
    response.setHeader("X-Oszczedzify-Build", buildId);
    cors(options)(request, response, () =>
      executeTreasuryBonds(request, response),
    );
  },
);

export const articleHttpFunction = onRequest(
  { cors: false },
  (request, response) => {
    response.setHeader("X-Oszczedzify-Build", buildId);
    cors(options)(request, response, () => executeArticle(request, response));
  },
);

// Keep the old US exports until clients have migrated; remove them in a separate rollout.
const warsaw = { cors: false as const, region: "europe-central2" };
export const calculateSavingsWarsaw = onRequest(warsaw, (request, response) => {
  response.setHeader("X-Oszczedzify-Build", buildId);
  cors(options)(request, response, () => executeSavings(request, response));
});
export const calculateRegularContributionWarsaw = onRequest(
  warsaw,
  (request, response) => {
    response.setHeader("X-Oszczedzify-Build", buildId);
    cors(options)(request, response, () =>
      executeRegularContributions(request, response),
    );
  },
);
export const calculateTreasuryBondsWarsaw = onRequest(
  warsaw,
  (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Oszczedzify-Build", buildId);
    cors(options)(request, response, () => {
      if (request.method !== "GET") {
        response.status(405).send({ error: "GET required" });
        return;
      }
      if (
        request.query.action === "catalog" ||
        request.query.action === "offer"
      ) {
        void serveOffers(request, response);
      } else {
        void executeTreasuryBonds(request, response);
      }
    });
  },
);
export const articleWarsaw = onRequest(warsaw, (request, response) => {
  response.setHeader("X-Oszczedzify-Build", buildId);
  cors(options)(request, response, () => executeArticle(request, response));
});
export const syncBondOffers = onSchedule(
  {
    schedule: "0 8,20 * * *",
    timeZone: "Europe/Warsaw",
    region: "europe-central2",
    timeoutSeconds: 540,
    memory: "1GiB",
    maxInstances: 1,
    retryCount: 2,
  },
  async () => {
    if (process.env.BOND_IMPORT_ENABLED !== "true") {
      logger.info(
        "Bond import disabled; set BOND_IMPORT_ENABLED=true after seed and monitoring setup",
      );
      return;
    }
    try {
      await syncOffers();
      logger.info("BOND_IMPORT_SUCCEEDED");
    } catch (error) {
      logger.error("BOND_IMPORT_FAILED", error);
      throw error;
    }
  },
);
