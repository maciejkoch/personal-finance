import { z } from "zod";
import * as offer from "@data/bond-offer";
import {
  availablePolishBonds,
  effectiveSkipTax,
} from "@markets/pl/polish-calculator-options";
import {
  TreasuryBondsRecord,
  TreasuryBondsRequest,
  TreasuryBondsResult,
} from "./treasury-bonds.model";

const point = z.object({
  month: z.number().int().positive(),
  value: z.number().finite(),
});
const responseSchema = z.object({
  contractVersion: z.literal(3),
  calculationVersion: z.literal(2),
  offerVersion: z.literal(offer.version),
  marketId: z.literal("pl"),
  skipTax: z.boolean(),
  series: z.array(
    z.object({
      instrumentId: z.string(),
      currency: z.literal("PLN"),
      points: z.array(point),
    }),
  ),
  benchmark: z.array(point),
});

export function adaptBondComparison(
  payload: unknown,
  request: TreasuryBondsRequest,
): TreasuryBondsResult {
  const data = responseSchema.parse(payload);
  const activeBondTypes = availablePolishBonds(request);
  if (
    data.skipTax !== effectiveSkipTax(request) ||
    data.series.length !== activeBondTypes.length ||
    data.series.some((series, i) => series.instrumentId !== activeBondTypes[i])
  ) {
    throw new Error("Incompatible bond scenarios");
  }
  for (const points of [
    data.benchmark,
    ...data.series.map((series) => series.points),
  ]) {
    if (
      points.length !== request.month ||
      points.some((point, i) => point.month !== i + 1)
    ) {
      throw new Error("Incomplete bond timeline");
    }
  }
  return {
    ...request,
    offerVersion: data.offerVersion,
    calculationVersion: data.calculationVersion,
    skipTax: data.skipTax,
    activeBondTypes,
    values: data.benchmark.map(
      (benchmark, i) =>
        ({
          month: benchmark.month,
          futureValue: benchmark.value,
          ...Object.fromEntries(
            data.series.map((series) => [
              series.instrumentId,
              series.points[i].value,
            ]),
          ),
        }) as TreasuryBondsRecord,
    ), // All five required types were validated above.
  };
}
