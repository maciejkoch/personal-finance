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
import { RegularContributionRequest } from "../../model/regular-contribution.model";

const formSchema = z.object({
  initialCapital: z.number().min(0).max(CALCULATOR_LIMITS.capital),
  duration: z.number().int().min(1).max(100),
  rate: z.number().min(0).max(100),
  skipRate: z.boolean(),
  skipTax: z.boolean(),
  contribution: z.number().min(0).max(CALCULATOR_LIMITS.contribution),
});

@Component({
  selector: "pf-regular-contribution-form",
  imports: [FormField, TaxOptionsComponent],
  templateUrl: "./regular-contribution-form.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegularContributionFormComponent {
  private readonly storage = useLocalStorage(
    "regular-contribution-form",
    formSchema,
    1,
  );
  readonly changed = output<RegularContributionRequest>();
  readonly pending = output<RegularContributionRequest | null>();
  readonly model = signal(
    this.storage.load() ?? {
      initialCapital: 0,
      contribution: 1000,
      duration: 15,
      rate: 10,
      skipRate: false,
      skipTax: false,
    },
  );
  readonly form = form(this.model, (path) => {
    required(path.initialCapital);
    min(path.initialCapital, 0);
    max(path.initialCapital, CALCULATOR_LIMITS.capital);
    required(path.contribution);
    min(path.contribution, 0);
    max(path.contribution, CALCULATOR_LIMITS.contribution);
    validate(path.contribution, ({ value, valueOf }) =>
      value() > 0 || valueOf(path.initialCapital) > 0
        ? undefined
        : {
            kind: "emptyPortfolio",
            message: "Podaj dodatnią wpłatę lub kapitał początkowy.",
          },
    );
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
      this.pending.emit(this.form().valid() ? request : null);
      if (!this.form().valid()) return;
      const timer = setTimeout(() => {
        this.storage.save(request);
        this.changed.emit(request);
      }, 300);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
