import { copyFileSync, rmSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
const browser = new URL(
  "../dist/apps/personal-finance/browser/",
  import.meta.url,
);
// Firebase uses this document for missing paths while preserving HTTP 404.
const notFound = new URL("404/index.html", browser);
assert.match(readFileSync(notFound, "utf8"), /noindex, follow/);
copyFileSync(notFound, new URL("404.html", browser));
rmSync(new URL("404/", browser), { recursive: true });
// Do not expose the unrendered CSR shell as another indexable page.
rmSync(new URL("index.csr.html", browser), { force: true });
assert.match(
  readFileSync(new URL("index.html", browser), "utf8"),
  /Kalkulatory finansowe/,
);

const pages = JSON.parse(
  readFileSync(
    new URL("../apps/personal-finance/src/app/seo/pages.json", import.meta.url),
    "utf8",
  ),
);
for (const page of pages) {
  const html = readFileSync(
    new URL(
      page.path === "/" ? "index.html" : `${page.path.slice(1)}/index.html`,
      browser,
    ),
    "utf8",
  );
  assert.equal(
    (html.match(/<h1\b/g) ?? []).length,
    1,
    `${page.path}: incomplete prerendered content`,
  );
  assert.ok(
    html.includes(`<title>${page.title}</title>`),
    `${page.path}: missing SEO metadata`,
  );
}
