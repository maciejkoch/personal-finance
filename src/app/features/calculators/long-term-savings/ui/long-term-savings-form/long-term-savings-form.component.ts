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
} from "@angular/forms/signals";
import { useLocalStorage } from "@shared/local-storage/use-local-storage";
import { z } from "zod";
import { LongTermSavingsRequest } from "../../model/long-term-savings.model";

const formSchema = z.object({
  amount: z.number(),
  duration: z.number(),
  inflation: z.number(),
  skipInflation: z.boolean(),
  rate: z.number(),
  skipRate: z.boolean(),
  skipTax: z.boolean(),
});

@Component({
  selector: "pf-long-term-savings-form",
  imports: [FormField],
  templateUrl: "./long-term-savings-form.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsFormComponent {
  private readonly storage = useLocalStorage(
    "long-term-savings-form",
    formSchema,
  );
  readonly changed = output<LongTermSavingsRequest>();
  readonly model = signal<LongTermSavingsRequest>(
    this.storage.load() ?? {
      amount: 150000,
      duration: 15,
      inflation: 3.5,
      skipInflation: false,
      rate: 10,
      skipRate: false,
      skipTax: false,
    },
  );
  readonly form = form(this.model, (path) => {
    required(path.amount);
    min(path.amount, 1);
    required(path.inflation);
    min(path.inflation, 0);
    max(path.inflation, 100);
    disabled(path.inflation, {
      when: ({ valueOf }) => valueOf(path.skipInflation),
    });
    required(path.duration);
    min(path.duration, 1);
    max(path.duration, 100);
    required(path.rate);
    min(path.rate, 0);
    max(path.rate, 100);
    disabled(path.rate, { when: ({ valueOf }) => valueOf(path.skipRate) });
    disabled(path.skipTax, { when: ({ valueOf }) => valueOf(path.skipRate) });
  });

  constructor() {
    effect((onCleanup) => {
      const request = this.model();
      if (!this.form().valid()) return;
      const timer = setTimeout(() => {
        this.storage.save(request);
        this.changed.emit(request);
      }, 300);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
