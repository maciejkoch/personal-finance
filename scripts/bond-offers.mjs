import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { importMonth } = require("../functions/lib/bond-offers/importer");
const { OfferRepository } = require("../functions/lib/bond-offers/repository");
const [command, argument, ...flags] = process.argv.slice(2);
const write = flags.includes("--write") || argument === "--write";
if (write && !process.env.GCLOUD_PROJECT && !process.env.GOOGLE_CLOUD_PROJECT)
  throw new Error(
    "Set GCLOUD_PROJECT explicitly before writes. Use ADC credentials; never commit keys.",
  );
switch (command) {
  case "import":
    console.log(JSON.stringify(await importMonth(argument, !write), null, 2));
    break;
  case "seed": {
    const offer = JSON.parse(
      await readFile(
        new URL(
          "../functions/src/treasury-bonds/treasury-bonds.offer.json",
          import.meta.url,
        ),
      ),
    );
    console.log(
      write
        ? await new OfferRepository().publish(offer, {
            method: "reviewed-seed",
            sourceVersion: offer.version,
          })
        : JSON.stringify(offer, null, 2),
    );
    break;
  }
  case "publish": {
    const offer = JSON.parse(await readFile(argument, "utf8"));
    const { offerSchema } = require("../functions/lib/contracts/bond-offer");
    const validated = offerSchema.parse(offer);
    console.log(
      write
        ? await new OfferRepository().publish(validated, {
            method: "manual-reviewed-import",
            file: argument,
          })
        : JSON.stringify(validated, null, 2),
    );
    break;
  }
  case "withdraw": {
    const reason = flags.filter((flag) => flag !== "--write").join(" ");
    if (!reason) throw new Error("Withdrawal requires a reason");
    if (write) await new OfferRepository().withdraw(argument, reason);
    console.log(write ? "Withdrawn" : "Dry run: withdraw", argument);
    break;
  }
  case "activate":
    if (!write) console.log(`Dry run: activate revision ${argument}`);
    else {
      await new OfferRepository().activate(argument);
      console.log("Activated", argument);
    }
    break;
  default:
    throw new Error(
      "Usage: bonds:admin -- import YYYY-MM [--write] | seed [--write] | publish FILE [--write] | activate OFFER_ID [--write] | withdraw OFFER_ID REASON [--write]",
    );
}
