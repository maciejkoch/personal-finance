import {
  cpSync,
  rmSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const source = new URL("../dist/oszczedzify/browser/", import.meta.url);
const destination = new URL("../dist/hosting-preview/", import.meta.url);
rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true, force: true });
function noindex(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) noindex(path);
    else if (entry.name.endsWith(".html")) {
      let html = readFileSync(path, "utf8").replace(
        /<meta\s+name="robots"[^>]*>/g,
        "",
      );
      html = html.replace(
        "</head>",
        '<meta name="robots" content="noindex, follow"></head>',
      );
      writeFileSync(path, html);
    }
  }
}
noindex(fileURLToPath(destination));
const config = JSON.parse(
  readFileSync(new URL("../firebase.json", import.meta.url), "utf8"),
);
config.hosting.public = "hosting-preview";
config.hosting.headers.push({
  source: "**",
  headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
});
writeFileSync(
  new URL("../dist/firebase.preview.json", import.meta.url),
  JSON.stringify({ hosting: config.hosting }, null, 2) + "\n",
);
console.log(
  "Prepared dist/firebase.preview.json; production output was preserved.",
);
