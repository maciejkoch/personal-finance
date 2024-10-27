import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, startWith, tap } from 'rxjs';
import { LongTermSavingsRequest } from '../../data/long-term-savings.model';

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
    amount: [10000, [Validators.required, Validators.min(1)]],
    duration: [
      10,
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

  constructor() {
    this.form.valueChanges
      .pipe(
        startWith(this.form.value),
        tap((value) => {
          const inflation = this.form.get('inflation');
          const action = value.skipInflation
            ? inflation?.disable
            : inflation?.enable;
          action?.call(inflation, { emitEvent: false });
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
