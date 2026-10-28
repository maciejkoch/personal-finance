import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { importInflation } = require("../functions/lib/inflation/importer");
const {
  InflationRepository,
} = require("../functions/lib/inflation/repository");
const [command = "import", ...args] = process.argv.slice(2);
const write = args.includes("--write");
if (write && !process.env.GCLOUD_PROJECT && !process.env.GOOGLE_CLOUD_PROJECT)
  throw new Error("Set GCLOUD_PROJECT explicitly for writes");
if (command === "import")
  console.log(JSON.stringify(await importInflation(write), null, 2));
else if (command === "activate" && args[0]) {
  if (write) await new InflationRepository().activate(args[0]);
  console.log(write ? "Activated" : "Dry run: activate", args[0]);
} else if (
  command === "withdraw" &&
  args[0] &&
  args[1] &&
  args[1] !== "--write"
) {
  if (write) await new InflationRepository().withdraw(args[0], args[1]);
  console.log(write ? "Withdrawn" : "Dry run: withdraw", args[0]);
} else
  throw new Error(
    "Usage: inflation:admin -- import [--write] | activate ID [--write] | withdraw ID REASON [--write]",
  );
