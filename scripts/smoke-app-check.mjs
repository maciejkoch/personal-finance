import assert from "node:assert/strict";

const project = process.env.OSZCZEDZIFY_EMULATOR_PROJECT ?? "demo-oszczedzify";
const functions = [
  [
    "us-central1",
    [
      "calculateSavingsHttpFunction",
      "calculateRegularContributionHttpFunction",
      "calculateTreasuryBondsHttpFunction",
      "articleHttpFunction",
    ],
  ],
  [
    "europe-central2",
    [
      "calculateSavingsWarsaw",
      "calculateRegularContributionWarsaw",
      "calculateTreasuryBondsWarsaw",
      "articleWarsaw",
    ],
  ],
];
for (const [region, names] of functions) {
  for (const name of names) {
    const url = `http://127.0.0.1:5001/${project}/${region}/${name}`;
    const preflight = await fetch(url, {
      method: "OPTIONS",
      headers: {
        Origin: "https://oszczedzify.org",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "X-Firebase-AppCheck",
      },
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(preflight.status, 204, `${name}: preflight`);
    assert.match(
      preflight.headers.get("access-control-allow-headers"),
      /x-firebase-appcheck/i,
    );
    for (const token of [null, "invalid-token"]) {
      const response = await fetch(url, {
        headers: {
          Origin: "https://oszczedzify.org",
          ...(token ? { "X-Firebase-AppCheck": token } : {}),
        },
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(response.status, 401, `${name}: unauthenticated access`);
      assert.equal(
        response.headers.get("access-control-allow-origin"),
        "https://oszczedzify.org",
      );
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(await response.json(), { error: "APP_CHECK_REQUIRED" });
    }
  }
}
console.log(
  "App Check: all eight HTTP exports reject missing/invalid tokens; CORS preflight succeeds.",
);
