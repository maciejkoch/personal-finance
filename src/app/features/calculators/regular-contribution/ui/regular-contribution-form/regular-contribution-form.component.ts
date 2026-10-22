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
import { RegularContributionRequest } from "../../model/regular-contribution.model";

const formSchema = z.object({
  contribution: z.number(),
  duration: z.number(),
  rate: z.number(),
  skipRate: z.boolean(),
  skipTax: z.boolean(),
});

@Component({
  selector: "pf-regular-contribution-form",
  imports: [FormField],
  templateUrl: "./regular-contribution-form.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegularContributionFormComponent {
  private readonly storage = useLocalStorage(
    "regular-contribution-form",
    formSchema,
  );
  readonly changed = output<RegularContributionRequest>();
  readonly model = signal<RegularContributionRequest>(
    this.storage.load() ?? {
      contribution: 1000,
      duration: 15,
      rate: 10,
      skipRate: false,
      skipTax: false,
    },
  );
  readonly form = form(this.model, (path) => {
    required(path.contribution);
    min(path.contribution, 1);
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
