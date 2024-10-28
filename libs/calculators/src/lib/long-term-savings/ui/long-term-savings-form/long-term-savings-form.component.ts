import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { useConditionallyEnable } from '@pf/shared';
import { debounceTime, startWith, tap } from 'rxjs';
import { LongTermSavingsRequest } from '../../model/long-term-savings.model';

@Component({
  selector: 'pf-long-term-savings-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './long-term-savings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsFormComponent {
  #fb = inject(FormBuilder);

  changed = output<LongTermSavingsRequest>();

  form = this.#fb.nonNullable.group({
    amount: [150000, [Validators.required, Validators.min(1)]],
    duration: [
      15,
      [Validators.required, Validators.min(1), Validators.max(100)],
    ],
    inflation: [
      3.5,
      [Validators.required, Validators.min(0), Validators.max(100)],
    ],
    skipInflation: [false],
    rate: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    skipRate: [false],
    skipTax: [false],
  });

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
          this.changed.emit(request);
        }
      });
  }
}
