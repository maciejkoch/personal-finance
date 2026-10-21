import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../", import.meta.url));

export function writeVersion(part, apiTarget) {
  if (
    part === "frontend" &&
    !["local", "production", "staging"].includes(apiTarget)
  ) {
    throw new Error("Unknown frontend API target");
  }
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const commit = git("rev-parse", "HEAD");
  const dirty = git("status", "--porcelain").length > 0;
  const builtAt = new Date().toISOString();
  const offerData = readFileSync(
    resolve(root, "functions/src/treasury-bonds/treasury-bonds.offer.json"),
  );
  const metadata = {
    buildId: `${commit.slice(0, 7)}${dirty ? "-dirty" : ""}-${builtAt}`,
    commit,
    dirty,
    builtAt,
    apiTarget,
    offerVersion: JSON.parse(offerData).version,
    calculationVersion: 2,
    offerDataHash: createHash("sha256").update(offerData).digest("hex"),
  };
  const output = resolve(
    root,
    part === "functions"
      ? "functions/lib/version.json"
      : `.build-metadata/${apiTarget}/version.json`,
  );
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(metadata, null, 2)}\n`);
  return metadata;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const part = process.argv[2];
  if (part !== "functions" && part !== "frontend")
    throw new Error("Expected frontend or functions");
  writeVersion(part, process.argv[3] ?? "backend");
}
