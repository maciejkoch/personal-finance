import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { useConditionallyEnable, useLocalStorage } from '@pf/shared';
import { debounceTime, startWith, tap } from 'rxjs';
import { z } from 'zod';
import { RegularContributionRequest } from '../../model/regular-contribution.model';

const formSchema = z.object({
  contribution: z.number(),
  duration: z.number(),
  rate: z.number(),
  skipRate: z.boolean(),
  skipTax: z.boolean(),
});

@Component({
    selector: 'pf-regular-contribution-form',
    imports: [ReactiveFormsModule],
    templateUrl: './regular-contribution-form.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegularContributionFormComponent {
  #fb = inject(FormBuilder);

  formLocalStorage = useLocalStorage('regular-contribution-form', formSchema);

  changed = output<RegularContributionRequest>();

  form = this.buildForm();

  conditionallyEnable = useConditionallyEnable(this.form);

  constructor() {
    this.form.valueChanges
      .pipe(
        startWith(this.form.value),
        tap((value) => {
          this.conditionallyEnable(!value.skipRate, 'rate', 'skipTax');
        }),
        debounceTime(300),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        if (this.form.valid) {
          const request = this.form.getRawValue();
          this.formLocalStorage.save(request);
          this.changed.emit(request);
        }
      });
  }

  private buildForm() {
    const defaultValues = {
      contribution: 1000,
      duration: 15,
      rate: 10,
      skipRate: false,
      skipTax: false,
    };

    const { contribution, duration, rate, skipRate, skipTax } =
      this.formLocalStorage.load() || defaultValues;

    return this.#fb.nonNullable.group({
      contribution: [contribution, [Validators.required, Validators.min(1)]],
      duration: [
        duration,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      rate: [
        rate,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      skipRate: [skipRate],
      skipTax: [skipTax],
    });
  }
}
