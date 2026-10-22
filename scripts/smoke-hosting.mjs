import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "https://oszczedzify.org";
const offer = JSON.parse(
  readFileSync(
    new URL(
      "../functions/src/treasury-bonds/treasury-bonds.offer.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const destination = "/calculators/treasury-bonds";
for (const path of ["/", "/calculators", "/calculators/"]) {
  const response = await fetch(new URL(path, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(
    response.status,
    302,
    `${path}: expected the calculator redirect`,
  );
  assert.equal(
    new URL(response.headers.get("location"), base).pathname,
    destination,
  );
  await response.arrayBuffer();
  console.log(`PASS ${path} -> ${destination} (302)`);
}

const routes = readFileSync(
  new URL("../apps/personal-finance/routes.txt", import.meta.url),
  "utf8",
)
  .trim()
  .split(/\r?\n/);
for (const route of routes) {
  const response = await fetch(new URL(route, base), {
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `${route}: expected prerendered HTML`);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  assert.ok(html.includes("<pf-root"), `${route}: expected the application`);
  if (route === destination)
    assert.ok(html.includes(`Oferta zakupu: ${offer.label}`));
  console.log(`PASS ${route} (200)`);
}
