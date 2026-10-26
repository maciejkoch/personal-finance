import assert from "node:assert/strict";
import { checkAppRequest } from "./app-check";

describe("HTTP App Check gate", () => {
  async function check({
    mode = "enforce",
    token,
    valid = true,
    appId = "web-app",
    emulator = false,
    method = "GET",
  }: {
    mode?: string;
    token?: string;
    valid?: boolean;
    appId?: string;
    emulator?: boolean;
    method?: string;
  } = {}) {
    let status = 200;
    let body: unknown;
    let calls = 0;
    const logs: Record<string, string>[] = [];
    const headers: Record<string, string> = {};
    const response = {
      setHeader(name: string, value: string) {
        headers[name] = value;
      },
      status(value: number) {
        status = value;
        return response;
      },
      send(value: unknown) {
        body = value;
      },
    };
    const allowed = await checkAppRequest(
      {
        method,
        path: "/calculator",
        header: () => token,
      },
      response,
      {
        mode,
        emulator,
        appIds: ["web-app"],
        verify: async () => {
          calls++;
          if (!valid) throw new Error("SECRET");
          return { appId };
        },
        log: (fields) => logs.push(fields),
      },
    );
    return { allowed, status, body, headers, logs, calls };
  }
  it("rejects missing, forged/expired and wrong-app tokens before execution", async () => {
    for (const input of [
      {},
      { token: "SECRET", valid: false },
      { token: "SECRET", appId: "other-app" },
    ]) {
      const result = await check(input);
      assert.equal(result.allowed, false);
      assert.equal(result.status, 401);
      assert.deepEqual(result.body, { error: "APP_CHECK_REQUIRED" });
      assert.equal(result.headers["Cache-Control"], "no-store");
      assert.ok(!JSON.stringify(result.logs).includes("SECRET"));
    }
  });
  it("accepts valid tokens", async () => {
    assert.equal((await check({ token: "valid" })).allowed, true);
  });
  it("monitors missing and invalid tokens without blocking", async () => {
    for (const input of [{}, { token: "bad", valid: false }, { token: "ok" }]) {
      const result = await check({ ...input, mode: "monitor" });
      assert.equal(result.allowed, true);
      assert.equal(result.logs.length, 1);
    }
  });
  it("allows preflight and explicit off mode without verification", async () => {
    for (const input of [{ method: "OPTIONS" }, { mode: "off" }]) {
      const result = await check(input);
      assert.equal(result.allowed, true);
      assert.equal(result.calls, 0);
    }
  });
  it("allows monitor in emulators but preserves enforcement for integration tests", async () => {
    assert.equal(
      (await check({ mode: "monitor", emulator: true })).allowed,
      true,
    );
    assert.equal((await check({ emulator: true })).status, 401);
  });
  it("fails closed on an unknown mode", async () => {
    assert.equal((await check({ mode: "enfroce" })).status, 503);
  });
});
