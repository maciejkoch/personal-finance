import * as express from 'express';
import { Request } from 'firebase-functions/v2/https';

import { validateSavings } from './savings.dto';
import { calculate } from './savings.service';

export function execute(request: Request, response: express.Response): void {
  const savings = validateSavings(request.query);

  if (savings.success) {
    try {
      const { amount, duration, inflation, rate, skipTax } = savings.data;
      const result = calculate(amount, duration, inflation, rate, skipTax);
      response.status(200);
      response.send({ data: result });
    } catch (error) {
      response.status(500);
      response.send(error);
    }
  } else {
    response.status(400);
    response.send(savings.error);
  }
}
