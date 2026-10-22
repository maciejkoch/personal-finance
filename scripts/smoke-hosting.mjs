import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const base = process.argv[2] ?? "https://oszczedzify.org";
const preview = process.argv.includes("--preview");
const pages = JSON.parse(
  readFileSync(
    new URL("../src/app/core/seo/pages.json", import.meta.url),
    "utf8",
  ),
);
const offer = JSON.parse(
  readFileSync(
    new URL(
      "../functions/src/treasury-bonds/treasury-bonds.offer.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const read = async (path) => {
  const response = await fetch(new URL(path, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  });
  return { response, body: await response.text() };
};
const attribute = (tag, name) =>
  tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const meta = (html, key, value) => {
  const tags = html.match(/<meta\b[^>]*>/g) ?? [];
  const matches = tags.filter((tag) => attribute(tag, key) === value);
  assert.equal(matches.length, 1, `Expected exactly one ${key}=${value}`);
  return attribute(matches[0], "content");
};
const titles = new Set();
for (const page of pages) {
  const { response, body: html } = await read(page.path);
  assert.equal(response.status, 200, `${page.path}: expected prerendered HTML`);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(
    (html.match(/<h1\b/g) ?? []).length,
    1,
    `${page.path}: one visible H1 in initial HTML`,
  );
  assert.ok(
    html.includes(`<title>${page.title}</title>`),
    `${page.path}: unique title`,
  );
  titles.add(page.title);
  assert.equal(meta(html, "name", "description"), page.description);
  assert.equal(meta(html, "property", "og:title"), page.title);
  assert.equal(meta(html, "property", "og:description"), page.description);
  assert.equal(
    meta(html, "property", "og:url"),
    `https://oszczedzify.org${page.path}`,
  );
  assert.equal(
    meta(html, "name", "robots"),
    preview ? "noindex, follow" : "index, follow",
  );
  const canonicals = (html.match(/<link\b[^>]*>/g) ?? []).filter(
    (tag) => attribute(tag, "rel") === "canonical",
  );
  assert.equal(canonicals.length, 1);
  assert.equal(
    attribute(canonicals[0], "href"),
    `https://oszczedzify.org${page.path}`,
  );
  const structured = html.match(
    /<script[^>]*id="page-structured-data"[^>]*>(.*?)<\/script>/s,
  );
  assert.ok(structured, `${page.path}: JSON-LD`);
  const schema = JSON.parse(structured[1]);
  assert.equal(schema["@type"], page.type);
  assert.equal(schema.url, `https://oszczedzify.org${page.path}`);
  if (preview)
    assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
  if (page.path.endsWith("/treasury-bonds"))
    assert.ok(html.includes(`Oferta zakupu: ${offer.label}`));
  if (page.path === "/") {
    for (const calculator of pages.filter((p) => p.type === "WebApplication"))
      assert.ok(html.includes(`href="${calculator.path}"`));
  }
  console.log(`PASS ${page.path}: 200, H1, metadata, canonical, JSON-LD`);
}
assert.equal(titles.size, pages.length);
for (const path of ["/calculators", "/calculators/"]) {
  const { response } = await read(path);
  assert.equal(response.status, 301);
  assert.equal(
    new URL(response.headers.get("location"), base).pathname,
    "/calculators/treasury-bonds",
  );
  console.log(`PASS ${path}: 301`);
}
for (const path of ["/about-us/", "/calculators/treasury-bonds/"]) {
  const { response } = await read(path);
  assert.equal(response.status, 301, `${path}: normalize trailing slash`);
  assert.equal(
    new URL(response.headers.get("location"), base).pathname,
    path.slice(0, -1),
  );
  console.log(`PASS ${path}: 301 to canonical path`);
}
for (const path of [
  "/nieistniejacy-artykul-etap-3",
  "/calculators/missing",
  "/missing/deep/path",
  "/index.csr.html",
]) {
  const { response, body } = await read(path);
  assert.equal(response.status, 404, `${path}: real HTTP 404`);
  assert.ok(body.includes("Nie znaleziono strony"));
  assert.equal(meta(body, "name", "robots"), "noindex, follow");
  assert.ok(!body.includes('rel="canonical"'));
  console.log(`PASS ${path}: 404, noindex`);
}
// With cleanUrls, production Hosting exposes the authored 404.html document
// at /404 with HTTP 200. The emulator instead returns 404 for this utility URL.
// Arbitrary missing pages above must always retain a real HTTP 404.
const { response: errorDocumentResponse, body: errorDocument } =
  await read("/404");
assert.ok([200, 404].includes(errorDocumentResponse.status));
assert.ok(errorDocument.includes("Nie znaleziono strony"));
assert.equal(meta(errorDocument, "name", "robots"), "noindex, follow");
assert.ok(!errorDocument.includes('rel="canonical"'));
console.log("PASS /404: authored error document, noindex, no canonical");

const { response: robotsResponse, body: robots } = await read("/robots.txt");
assert.equal(robotsResponse.status, 200);
assert.match(robotsResponse.headers.get("content-type"), /text\/plain/);
assert.match(robots, /Sitemap: https:\/\/oszczedzify.org\/sitemap.xml/);
assert.ok(!robots.includes("<html"));
const { response: sitemapResponse, body: sitemap } = await read("/sitemap.xml");
assert.equal(sitemapResponse.status, 200);
assert.match(sitemapResponse.headers.get("content-type"), /xml/);
assert.match(sitemap, /^<\?xml/);
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
assert.deepEqual(
  urls.sort(),
  pages.map((p) => `https://oszczedzify.org${p.path}`).sort(),
);
assert.ok(!sitemap.includes("/404"));
console.log(
  "PASS robots.txt and sitemap.xml: valid content types and canonical URLs",
);
