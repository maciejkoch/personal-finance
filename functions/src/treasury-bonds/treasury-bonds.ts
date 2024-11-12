import * as express from 'express';
import { Request } from 'firebase-functions/v2/https';
import { calculateFutureValueForMonths } from '../calculations/inflation.service';
import { calculate as calculateDOR } from './services/dor.service';
import { calculate as calculateROR } from './services/ror.service';
import { calculate as calculateTOS } from './services/tos.service';
import { TreasuryBondsSchemaDTO, validate } from './treasury-bonds.dto';

export function execute(request: Request, response: express.Response): void {
  const treasuryBonds = validate(request.query);

  if (treasuryBonds.success) {
    try {
      const result = calculate(treasuryBonds.data);

      response.status(200);
      response.send({ data: result });
    } catch (error) {
      response.status(500);
      response.send(error);
    }
  } else {
    response.status(400);
    response.send(treasuryBonds.error);
  }
}

function calculate(dto: TreasuryBondsSchemaDTO) {
  const {
    numberOfBonds,
    month,
    inflation,
    referenceRate,
    savingsRate,
    wibor6m,
  } = dto;

  const amount = numberOfBonds * 100;

  const params = { inflation, referenceRate, savingsRate, wibor6m };

  const results = {
    futureValue: calculateFutureValueForMonths(amount, month, inflation),
    ror: calculateROR(numberOfBonds, month, params),
    dor: calculateDOR(numberOfBonds, month, params),
    tos: calculateTOS(numberOfBonds, month, params),
    // TODO
    // 1. add coi, edo, ros, rod
    // 2. unify services by type of indexation (ror + dor, tos, coi + edo + ros + rod)
  };

  const months = [...Array(month).keys()].map((i) => i + 1);
  const values = months.map((currentMonth) => ({
    month: currentMonth,
    ror: results.ror[currentMonth],
    dor: results.dor[currentMonth],
    // tos: results.TOS[currentMonth],
    // coi: results.COI[currentMonth],
    // edo: results.EDO[currentMonth],
    // ros: results.ROS[currentMonth],
    // rod: results.ROD[currentMonth],
    futureValue: results.futureValue[currentMonth],
  }));

  return { values };
}
