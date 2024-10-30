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
import { LongTermSavingsRequest } from '../../model/long-term-savings.model';

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
  selector: 'pf-long-term-savings-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './long-term-savings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsFormComponent {
  #fb = inject(FormBuilder);

  formLocalStorage = useLocalStorage('long-term-savings-form', formSchema);

  changed = output<LongTermSavingsRequest>();

  form = this.buildForm();

  conditionallyEnable = useConditionallyEnable(this.form);

  constructor() {
    this.form.valueChanges
      .pipe(
        startWith(this.form.value),
        tap((value) => {
          this.conditionallyEnable(!value.skipInflation, 'inflation');
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
      amount: 150000,
      duration: 15,
      inflation: 3.5,
      skipInflation: false,
      rate: 10,
      skipRate: false,
      skipTax: false,
    };

    const {
      amount,
      duration,
      inflation,
      skipInflation,
      rate,
      skipRate,
      skipTax,
    } = this.formLocalStorage.load() || defaultValues;

    return this.#fb.nonNullable.group({
      amount: [amount, [Validators.required, Validators.min(1)]],
      duration: [
        duration,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      inflation: [
        inflation,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      skipInflation: [skipInflation],
      rate: [
        rate,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      skipRate: [skipRate],
      skipTax: [skipTax],
    });
  }
}
