import type { Request } from "firebase-functions/v2/https";
import { HttpResponse, validationError } from "../http/query-validation";
import { calculateFutureValueForMonths } from "../calculations/inflation.service";
import { calculate as calculateCOI } from "./services/coi.service";
import { calculate as calculateDOR } from "./services/dor.service";
import { calculate as calculateEDO } from "./services/edo.service";
import { calculate as calculateROD } from "./services/rod.service";
import { calculate as calculateROR } from "./services/ror.service";
import { calculate as calculateROS } from "./services/ros.service";
import { calculate as calculateTOS } from "./services/tos.service";
import { TreasuryBondsSchemaDTO, validate } from "./treasury-bonds.dto";
import { TREASURY_BONDS_OFFER } from "./treasury-bonds.consts";
import { simplifyResult } from "./treasury-bonds.service";
import { BondComparisonResponse } from "../contracts/bond-comparison";
import {
  availablePolishBonds,
  PolishBondType,
} from "../markets/pl/polish-calculator-options";

const calculators = {
  ror: calculateROR,
  dor: calculateDOR,
  tos: calculateTOS,
  coi: calculateCOI,
  edo: calculateEDO,
  ros: calculateROS,
  rod: calculateROD,
};

export function calculateComparison(
  dto: TreasuryBondsSchemaDTO,
): BondComparisonResponse {
  const skipTax = dto.skipTax;
  const params = {
    inflation: dto.inflation,
    referenceRate: dto.referenceRate,
    savingsRate: dto.savingsRate,
    wibor6m: dto.wibor6m,
    skipTax,
  };
  const benchmark = calculateFutureValueForMonths(
    dto.numberOfBonds * 100,
    dto.month,
    dto.inflation,
  );
  return {
    contractVersion: 3,
    calculationVersion: 2,
    offerVersion: TREASURY_BONDS_OFFER.version,
    marketId: "pl",
    skipTax,
    series: availablePolishBonds(dto).map((type: PolishBondType) => {
      const values = simplifyResult(
        calculators[type](dto.numberOfBonds, dto.month, params),
      );
      return {
        instrumentId: type,
        currency: "PLN",
        points: Array.from({ length: dto.month }, (_, i) => ({
          month: i + 1,
          value: values[i + 1],
        })),
      };
    }),
    benchmark: Array.from({ length: dto.month }, (_, i) => ({
      month: i + 1,
      value: benchmark[i + 1],
    })),
  };
}

export function execute(request: Request, response: HttpResponse): void {
  const treasuryBonds = validate(request.query);

  if (treasuryBonds.success) {
    try {
      const result =
        treasuryBonds.data.contractVersion === 3
          ? calculateComparison(treasuryBonds.data)
          : calculate(treasuryBonds.data);

      response.status(200);
      response.send({ data: result });
    } catch (error) {
      response.status(500);
      response.send(error);
    }
  } else {
    response.status(400);
    response.send(validationError(treasuryBonds.error));
  }
}

export function calculate(dto: TreasuryBondsSchemaDTO) {
  const {
    numberOfBonds,
    month,
    inflation,
    referenceRate,
    savingsRate,
    wibor6m,
  } = dto;
  const skipTax = dto.skipTax;

  const amount = numberOfBonds * 100;

  const params = { inflation, referenceRate, savingsRate, wibor6m, skipTax };

  const results = {
    futureValue: calculateFutureValueForMonths(amount, month, inflation),
    ror: simplifyResult(calculateROR(numberOfBonds, month, params)),
    dor: simplifyResult(calculateDOR(numberOfBonds, month, params)),
    tos: simplifyResult(calculateTOS(numberOfBonds, month, params)),
    coi: simplifyResult(calculateCOI(numberOfBonds, month, params)),
    edo: simplifyResult(calculateEDO(numberOfBonds, month, params)),
    ros: simplifyResult(calculateROS(numberOfBonds, month, params)),
    rod: simplifyResult(calculateROD(numberOfBonds, month, params)),
  };

  const months = [...Array(month).keys()].map((i) => i + 1);
  const values = months.map((currentMonth) => ({
    month: currentMonth,
    ror: results.ror[currentMonth],
    dor: results.dor[currentMonth],
    tos: results.tos[currentMonth],
    coi: results.coi[currentMonth],
    edo: results.edo[currentMonth],
    ros: results.ros[currentMonth],
    rod: results.rod[currentMonth],
    futureValue: results.futureValue[currentMonth],
  }));

  return {
    values,
    offerVersion: TREASURY_BONDS_OFFER.version,
    calculationVersion: 2,
  };
}
