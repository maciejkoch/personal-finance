import * as express from 'express';
import { Request } from 'firebase-functions/v2/https';
import { calculateFutureValueForMonths } from '../calculations/inflation.service';
import { calculate as calculateCOI } from './services/coi.service';
import { calculate as calculateDOR } from './services/dor.service';
import { calculate as calculateEDO } from './services/edo.service';
import { calculate as calculateROD } from './services/rod.service';
import { calculate as calculateROR } from './services/ror.service';
import { calculate as calculateROS } from './services/ros.service';
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
    coi: calculateCOI(numberOfBonds, month, params),
    edo: calculateEDO(numberOfBonds, month, params),
    ros: calculateROS(numberOfBonds, month, params),
    rod: calculateROD(numberOfBonds, month, params),
    // TODO unify services by type of indexation (ror + dor, tos, coi + edo + ros + rod). They are identical.
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

  return { values };
}
