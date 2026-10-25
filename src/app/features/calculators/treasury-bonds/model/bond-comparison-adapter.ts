import { z } from "zod";
import * as offer from "@data/bond-offer";
import { availablePolishBonds } from "@markets/pl/polish-calculator-options";
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
  contractVersion: z.union([z.literal(3), z.literal(4)]),
  offerId: z.string().optional(),
  calculationVersion: z.literal(2),
  offerVersion: z.string(),
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
  if (
    request.offerId
      ? data.contractVersion !== 4 ||
        data.offerId !== request.offerId ||
        data.offerVersion !== request.offerId
      : data.contractVersion !== 3 || data.offerVersion !== offer.version
  ) {
    throw new Error("Incompatible bond offer version");
  }
  const activeBondTypes = availablePolishBonds(request);
  if (
    data.skipTax !== request.skipTax ||
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
