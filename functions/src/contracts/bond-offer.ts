import { z } from "zod";

export const bondTypes = [
  "ROR",
  "DOR",
  "TOS",
  "COI",
  "EDO",
  "ROS",
  "ROD",
] as const;
export type BondType = (typeof bondTypes)[number];
const date = z.iso.date();
const rate = z.number().finite().min(0).max(1);
const months = z.number().int().min(0).max(144);
const source = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" && url.hostname === "www.obligacjeskarbowe.pl"
  );
});
export const bondSchema = z
  .object({
    name: z.enum(bondTypes),
    series: z.string().regex(/^(ROR|DOR|TOS|COI|EDO|ROS|ROD)\d{4}$/),
    maturityInMonths: months.min(1),
    firstPeriodRate: rate,
    rateUpdateInMonths: months.min(1),
    indexation: z.enum(["fixed", "inflation", "referenceRate"]),
    margin: rate,
    paymentOfInterestInMonths: months,
    capitalizationOfInterestInMonths: months,
    exchangeCost: z.number().positive().max(100),
    earlyBuyoutCost: z.number().min(0).max(100),
    buyoutProtectionInMonths: months,
    familyOnly: z.boolean(),
    source,
    issueLetter: z.string().regex(/^\d+\/\d{4}$/),
    earlyRedemption: z
      .object({
        minimumHoldingDays: z.number().int().nonnegative(),
        cutoffDaysBeforeMaturity: z.number().int().nonnegative(),
        settlementBusinessDays: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export const offerSchema = z
  .object({
    version: z.string().min(1).max(100),
    month: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),
    label: z.string().min(1).max(100),
    verifiedAt: date,
    saleFrom: date,
    saleTo: date,
    source,
    bonds: z.record(z.enum(bondTypes), bondSchema),
  })
  .strict()
  .superRefine((offer, ctx) => {
    if (
      offer.saleFrom !== `${offer.month}-01` ||
      !offer.saleTo.startsWith(offer.month) ||
      offer.saleTo < offer.saleFrom
    )
      ctx.addIssue({ code: "custom", message: "Invalid sale period" });
    for (const type of bondTypes) {
      const bond = offer.bonds[type];
      // Algorithm v2 implements these structures; rates/fees are data, new rules need code review.
      const shapes = {
        ROR: [12, 1, "referenceRate", 1, 0, 1, false],
        DOR: [24, 1, "referenceRate", 1, 0, 1, false],
        TOS: [36, 36, "fixed", 0, 12, 36, false],
        COI: [48, 12, "inflation", 12, 0, 12, false],
        EDO: [120, 12, "inflation", 0, 12, 120, false],
        ROS: [72, 12, "inflation", 0, 12, 72, true],
        ROD: [144, 12, "inflation", 0, 12, 144, true],
      };
      const structure = [
        bond.maturityInMonths,
        bond.rateUpdateInMonths,
        bond.indexation,
        bond.paymentOfInterestInMonths,
        bond.capitalizationOfInterestInMonths,
        bond.buyoutProtectionInMonths,
        bond.familyOnly,
      ];
      if (JSON.stringify(structure) !== JSON.stringify(shapes[type]))
        ctx.addIssue({
          code: "custom",
          message: `Unsupported calculation rules: ${type}`,
        });
      const maturity = new Date(`${offer.saleFrom}T00:00:00Z`);
      maturity.setUTCMonth(maturity.getUTCMonth() + bond.maturityInMonths);
      const expected =
        type +
        String(maturity.getUTCMonth() + 1).padStart(2, "0") +
        String(maturity.getUTCFullYear()).slice(-2);
      if (bond.name !== type || bond.series !== expected)
        ctx.addIssue({ code: "custom", message: `Invalid series: ${type}` });
    }
  });
export type BondOffer = z.infer<typeof offerSchema>;
export interface OfferSummary {
  offerId: string;
  month: string;
  label: string;
  saleFrom: string;
  saleTo: string;
}
export interface OfferCatalog {
  today: string;
  entries: OfferSummary[];
  currentOfferId: string | null;
  stale: boolean;
  nextCursor: string | null;
}
export interface PublishedOffer extends BondOffer {
  offerId: string;
}
