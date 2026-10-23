import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";
import { marked } from "marked";

const root = new URL("../", import.meta.url);
// jsdom does not implement Tailwind 4's full CSS syntax; this check reads HTML.
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (error) => {
  if (error.type !== "css-parsing") throw error;
});
const pages = JSON.parse(
  readFileSync(new URL("src/app/core/seo/pages.json", root), "utf8"),
);
for (const page of pages) {
  const file =
    page.path === "/" ? "index.html" : `${page.path.slice(1)}/index.html`;
  const doc = new JSDOM(
    readFileSync(new URL(`dist/oszczedzify/browser/${file}`, root), "utf8"),
    { virtualConsole },
  ).window.document;
  const schema = JSON.parse(
    doc.getElementById("page-structured-data").textContent,
  );
  assert.equal(schema.dateModified, page.lastmod);
  if (page.type === "WebApplication") {
    const method = doc.getElementById("methodology-title")?.parentElement;
    assert.ok(
      method,
      `${page.path}: methodology must be present without JavaScript`,
    );
    assert.ok(method.querySelector("time[datetime]"));
    assert.equal(schema.maintainer.name, "Oszczędzify");
    assert.match(method.textContent, /Przykład/);
  }
  if (page.type === "Article") {
    const slug = page.path.slice(1);
    const markdown = readFileSync(
      new URL(`functions/content/${slug}.md`, root),
      "utf8",
    );
    const expected = new JSDOM(marked.parse(markdown, { async: false })).window
      .document.body;
    assert.equal(
      doc.querySelector("pf-article .prose").innerHTML.trim(),
      expected.innerHTML.trim(),
      `${slug}: prerender must match local Markdown, not a previous API deployment`,
    );
    assert.equal(
      doc.querySelector("time").getAttribute("datetime"),
      page.lastmod,
    );
    assert.equal(schema.author.url, "https://oszczedzify.org/about-us");
    const state = JSON.parse(
      doc.querySelector('script[id$="-state"]').textContent,
    );
    assert.equal(
      state[`article:${slug}`].html,
      marked.parse(markdown, { async: false }),
    );
  }
  for (const link of doc.querySelectorAll('a[href^="/"]')) {
    const path = new URL(link.getAttribute("href"), "https://oszczedzify.org")
      .pathname;
    assert.ok(
      pages.some((p) => p.path === path) || path === "/calculators",
      `${page.path}: broken internal link ${path}`,
    );
  }
  console.log(`PASS ${page.path}: local content, dates and internal links`);
}
const stats = JSON.parse(
  readFileSync(new URL("dist/oszczedzify/browser-stats.json", root), "utf8"),
);
assert.ok(
  !Object.keys(stats.inputs).some((path) =>
    /node_modules\/marked\//.test(path),
  ),
  "Marked must stay out of browser JavaScript",
);
console.log("PASS Marked remains server-only");
