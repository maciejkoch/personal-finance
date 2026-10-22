// Regenerate raster exports from the checked-in SVGs. Requires librsvg's rsvg-convert.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const root = new URL("../public/", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const body = (svg) =>
  svg
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>/, "")
    .replace(/<title>.*?<\/title>/, "")
    .trim();
const mark = body(read("brand/mark.svg"));
const logoSvg = read("brand/logo-dark.svg");
const logoWidth = Number(logoSvg.match(/viewBox="0 0 (\d+) 112"/)[1]);
const logo = body(logoSvg);
const render = (svg, size) =>
  execFileSync(
    "rsvg-convert",
    size ? ["-w", String(size), "-h", String(size), "-"] : ["-"],
    { input: svg },
  );
const save = (path, data) => writeFileSync(new URL(path, root), data);

const favicon16 = render(read("brand/mark-small.svg"), 16);
const favicon32 = render(read("brand/mark.svg"), 32);
const favicon48 = render(read("brand/mark.svg"), 48);
save("favicon-16x16.png", favicon16);
save("favicon-32x32.png", favicon32);

// ICO supports lossless PNG entries; include the native 16px simplification.
const entries = [
  [16, favicon16],
  [32, favicon32],
  [48, favicon48],
];
const header = Buffer.alloc(6 + entries.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(entries.length, 4);
let offset = header.length;
for (const [index, [size, png]] of entries.entries()) {
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
}
save("favicon.ico", Buffer.concat([header, ...entries.map(([, png]) => png)]));

const deviceIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112"><rect width="112" height="112" fill="#171E2B"/><g transform="translate(10.08 10.08) scale(.82)">${mark}</g></svg>`;
for (const [file, size] of [
  ["apple-touch-icon.png", 180],
  ["android-chrome-192x192.png", 192],
  ["android-chrome-512x512.png", 512],
]) {
  save(file, render(deviceIcon, size));
}

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
function wrap(text, length = 30) {
  const lines = [""];
  for (const word of text.split(/\s+/)) {
    const index = lines.length - 1;
    if (lines[index] && lines[index].length + word.length + 1 > length)
      lines.push(word);
    else lines[index] += (lines[index] ? " " : "") + word;
  }
  return lines;
}

const pages = JSON.parse(
  readFileSync(
    new URL("../src/app/core/seo/pages.json", import.meta.url),
    "utf8",
  ),
);
mkdirSync(new URL("brand/social/", root), { recursive: true });
for (const page of pages) {
  const title = page.title.split(" | ")[0];
  const lines = wrap(title);
  if (lines.length > 3)
    throw new Error(`Social title needs a shorter heading: ${page.path}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#171E2B"/>
    <g transform="translate(64 64) scale(${280 / logoWidth})">${logo}</g>
    <g fill="#F1F2F4" font-family="Arial, sans-serif" font-size="52" font-weight="700">
      ${lines.map((line, index) => `<text x="64" y="${238 + index * 66}">${escapeXml(line)}</text>`).join("")}
    </g>
    <text x="64" y="474" fill="#B6BDC9" font-family="Arial, sans-serif" font-size="26">Kalkulatory i wiedza o oszczędzaniu</text>
    <path d="M64 528H1136" stroke="#344050"/>
    <text x="64" y="574" fill="#D88A16" font-family="Arial, sans-serif" font-size="24">oszczedzify.org</text>
  </svg>`;
  const key = page.path.slice(1).replaceAll("/", "-") || "home";
  save(`brand/social/${key}.png`, render(svg));
}
console.log(
  `Generated favicons, device icons and ${pages.length} social previews.`,
);
