import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, startWith } from 'rxjs';
import { LongTermSavingsStore } from './store/long-term-savings.store';
import { LongTermSavingsChartComponent } from './ui/long-term-savings-chart.component';

@Component({
  selector: 'pf-long-term-savings',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, LongTermSavingsChartComponent],
  providers: [LongTermSavingsStore],
  templateUrl: './long-term-savings.component.html',
  styleUrl: './long-term-savings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsComponent {
  #fb = inject(FormBuilder);
  #store = inject(LongTermSavingsStore);

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

  data = this.#store.result;

  constructor() {
    this.form.valueChanges
      .pipe(startWith(this.form.value), debounceTime(300), takeUntilDestroyed())
      .subscribe(() => {
        if (this.form.valid) {
          const request = this.form.getRawValue();
          this.#store.calculate(request);
        }
      });
  }
}
