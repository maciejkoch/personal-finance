import type { Request } from "firebase-functions/v2/https";
import { HttpResponse, validationError } from "../http/query-validation";

import { validateSavings } from "./savings.dto";
import { calculate } from "./savings.service";
import { effectiveSkipTax } from "../markets/pl/polish-calculator-options";

export function execute(request: Request, response: HttpResponse): void {
  const savings = validateSavings(request.query);

  if (savings.success) {
    try {
      const { amount, duration, inflation, rate } = savings.data;
      const result = calculate(
        amount,
        duration,
        inflation,
        rate,
        effectiveSkipTax(savings.data),
      );
      response.status(200);
      response.send({ data: result });
    } catch (error) {
      response.status(500);
      response.send(error);
    }
  } else {
    response.status(400);
    response.send(validationError(savings.error));
  }
}
