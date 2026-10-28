import { useInflationAssumption } from "@core/inflation/inflation-assumption";
import { InflationReferenceComponent } from "@core/inflation/inflation-reference.component";
import { CalculatorPanelComponent } from "../../../shared/calculator-panel.component";
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  output,
  signal,
} from "@angular/core";
import {
  disabled,
  form,
  FormField,
  max,
  min,
  required,
  validate,
} from "@angular/forms/signals";
import { useLocalStorage } from "@shared/local-storage/use-local-storage";
import { z } from "zod";
import { CALCULATOR_LIMITS } from "@contracts/savings";
import { TaxOptionsComponent } from "../../../shared/tax-options/tax-options.component";
import { LongTermSavingsRequest } from "../../model/long-term-savings.model";

const formSchema = z.object({
  initialCapital: z.number().min(0).max(CALCULATOR_LIMITS.capital),
  duration: z.number().int().min(1).max(100),
  rate: z.number().min(0).max(100),
  skipRate: z.boolean(),
  skipTax: z.boolean(),
  amount: z.number().min(0.01).max(CALCULATOR_LIMITS.capital),
  inflation: z.number().min(-99).max(100),
  skipInflation: z.boolean(),
});

@Component({
  selector: "pf-long-term-savings-form",
  imports: [
    InflationReferenceComponent,
    FormField,
    TaxOptionsComponent,
    CalculatorPanelComponent,
  ],
  templateUrl: "./long-term-savings-form.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsFormComponent {
  private readonly storage = useLocalStorage(
    "long-term-savings-form",
    formSchema,
    1,
  );
  readonly changed = output<LongTermSavingsRequest>();
  readonly pending = output<LongTermSavingsRequest | null>();
  readonly model = signal(
    this.storage.load() ?? {
      initialCapital: 0,
      amount: 150000,
      duration: 15,
      inflation: 3.5,
      skipInflation: false,
      rate: 10,
      skipRate: false,
      skipTax: false,
    },
  );
  readonly inflation = useInflationAssumption(
    this.model,
    "long-term-savings-form",
    this.storage.load() !== null,
  );
  readonly form = form(this.model, (path) => {
    required(path.initialCapital);
    min(path.initialCapital, 0);
    max(path.initialCapital, CALCULATOR_LIMITS.capital);
    required(path.amount);
    min(path.amount, 0.01);
    max(path.amount, CALCULATOR_LIMITS.capital);
    required(path.inflation);
    min(path.inflation, -99);
    max(path.inflation, 100);
    disabled(path.inflation, {
      when: ({ valueOf }) => valueOf(path.skipInflation),
    });
    required(path.duration);
    min(path.duration, 1);
    max(path.duration, 100);
    validate(path.duration, ({ value }) =>
      Number.isInteger(value())
        ? null
        : { kind: "integer", message: "Podaj pełną liczbę lat." },
    );
    required(path.rate);
    min(path.rate, 0);
    max(path.rate, 100);
    disabled(path.rate, { when: ({ valueOf }) => valueOf(path.skipRate) });
    disabled(path.skipTax, {
      when: ({ valueOf }) => valueOf(path.skipRate),
    });
  });

  constructor() {
    effect((onCleanup) => {
      const request = this.model();
      this.pending.emit(
        this.form().valid() && (request.skipInflation || this.inflation.ready())
          ? request
          : null,
      );
      if (
        !this.form().valid() ||
        (!request.skipInflation && !this.inflation.ready())
      )
        return;
      const timer = setTimeout(() => {
        this.storage.save({
          ...request,
          inflation: Number.isFinite(request.inflation) ? request.inflation : 0,
        });
        this.changed.emit(request);
      }, 300);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
