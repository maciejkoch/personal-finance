import { readFileSync } from "node:fs";
import { join } from "node:path";

function readBuildId(): string {
  try {
    const metadata: unknown = JSON.parse(
      readFileSync(join(__dirname, "version.json"), "utf8"),
    );
    if (
      typeof metadata === "object" &&
      metadata !== null &&
      "buildId" in metadata &&
      typeof metadata.buildId === "string"
    ) {
      return metadata.buildId;
    }
  } catch {
    // A checkout built directly with tsc may not have build metadata yet.
  }
  return "unknown";
}

export const buildId = readBuildId();
