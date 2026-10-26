import { getApps, initializeApp } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { logger } from "firebase-functions";

interface CheckRequest {
  method: string;
  path: string;
  header(name: string): string | undefined;
}
interface CheckResponse {
  setHeader(name: string, value: string): unknown;
  status(code: number): CheckResponse;
  send(body: unknown): unknown;
}
interface Dependencies {
  mode: string;
  emulator: boolean;
  appIds: string[];
  verify(token: string): Promise<{ appId: string }>;
  log(fields: Record<string, string>): void;
}

// Unknown modes fail closed so a typo cannot silently disable protection.
export async function checkAppRequest(
  request: CheckRequest,
  response: CheckResponse,
  dependencies: Dependencies = {
    mode: process.env.APP_CHECK_MODE ?? "off",
    emulator: process.env.FUNCTIONS_EMULATOR === "true",
    appIds: (process.env.APP_CHECK_APP_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
    verify: async (token) => {
      if (!getApps().length) initializeApp();
      return getAppCheck().verifyToken(token);
    },
    log: (fields) => logger.info("APP_CHECK_REQUEST", fields),
  },
): Promise<boolean> {
  const { mode, emulator, verify, log, appIds } = dependencies;
  if (request.method === "OPTIONS" || mode === "off") return true;
  if (emulator && mode === "monitor") return true;
  // A shared cache must never serve an attested response to an unattested client.
  response.setHeader("Cache-Control", "no-store");
  if (!["monitor", "enforce"].includes(mode)) {
    response.status(503).send({ error: "APP_CHECK_CONFIGURATION_ERROR" });
    return false;
  }
  let outcome = "missing";
  const token = request.header("X-Firebase-AppCheck");
  if (token) {
    try {
      const claims = await verify(token);
      outcome =
        !appIds.length || appIds.includes(claims.appId) ? "valid" : "wrong-app";
    } catch {
      outcome = "invalid";
    }
  }
  // Never log tokens, query parameters or verifier errors (which may contain tokens).
  log({ mode, outcome, path: request.path });
  if (mode === "monitor" || outcome === "valid") return true;
  response.status(401).send({ error: "APP_CHECK_REQUIRED" });
  return false;
}
