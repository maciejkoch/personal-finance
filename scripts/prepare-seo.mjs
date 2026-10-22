import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const pages = JSON.parse(
  readFileSync(
    new URL("../src/app/core/seo/pages.json", import.meta.url),
    "utf8",
  ),
);
assert.equal(new Set(pages.map((p) => p.path)).size, pages.length);

const articles = readdirSync(new URL("../functions/content/", import.meta.url))
  .filter((file) => file.endsWith(".md"))
  .map((file) => "/" + file.slice(0, -3))
  .sort();
assert.deepEqual(
  pages
    .filter((page) => page.type === "Article")
    .map((page) => page.path)
    .sort(),
  articles,
  "Register every published article in pages.json",
);

assert.equal(new Set(pages.map((p) => p.title)).size, pages.length);
for (const page of pages) {
  assert.match(page.path, /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/);
  assert.match(page.lastmod, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(
    page.lastmod <= new Date().toISOString().slice(0, 10),
    "Future lastmod",
  );
}
writeFileSync(
  new URL("../routes.txt", import.meta.url),
  pages.map((p) => p.path).join("\n") + "\n/404\n",
);
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages
    .map(
      (p) =>
        `  <url><loc>https://oszczedzify.org${p.path}</loc><lastmod>${p.lastmod}</lastmod></url>`,
    )
    .join("\n") +
  "\n</urlset>\n";
writeFileSync(new URL("../public/sitemap.xml", import.meta.url), xml);
writeFileSync(
  new URL("../public/robots.txt", import.meta.url),
  "User-agent: *\nAllow: /\n\nSitemap: https://oszczedzify.org/sitemap.xml\n",
);
