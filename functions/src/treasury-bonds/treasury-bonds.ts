import * as express from 'express';
import { Request } from 'firebase-functions/v2/https';
import { calculateFutureValueForMonths } from '../calculations/inflation.service';
import { COI, DOR, EDO, ROD, ROR, ROS, TOZ } from './treasury-bonds.consts';
import { TreasuryBondsSchemaDTO, validate } from './treasury-bonds.dto';
import { TreasuryBondsSimpleResult } from './treasury-bonds.model';
import {
  calculate as calculateTreasryBonds,
  simplifyResult,
} from './treasury-bonds.service';

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

  const types = [ROR, DOR, TOZ, COI, EDO, ROS, ROD];
  const params = { inflation, referenceRate, savingsRate, wibor6m };

  const results = types.reduce<Record<string, TreasuryBondsSimpleResult>>(
    (acc, type) => ({
      ...acc,
      [type.name]: simplifyResult(
        calculateTreasryBonds(type, numberOfBonds, month, params)
      ),
    }),
    {
      futureValue: calculateFutureValueForMonths(amount, month, inflation),
    }
  );

  const months = [...Array(month).keys()].map((i) => i + 1);
  const values = months.map((currentMonth) => ({
    month: currentMonth,
    ror: results.ROR[currentMonth],
    dor: results.DOR[currentMonth],
    toz: results.TOZ[currentMonth],
    coi: results.COI[currentMonth],
    edo: results.EDO[currentMonth],
    ros: results.ROS[currentMonth],
    rod: results.ROD[currentMonth],
    futureValue: results.futureValue[currentMonth],
  }));

  return { values };
}
