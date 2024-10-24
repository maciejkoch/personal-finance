import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'pf-long-term-savings',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './long-term-savings.component.html',
  styleUrl: './long-term-savings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsComponent {
  #fb = inject(FormBuilder);

  form = this.#fb.group({
    amount: ['1000', [Validators.required, Validators.min(1)]],
    duration: [
      '10',
      [Validators.required, Validators.min(1), Validators.max(100)],
    ],
    inflation: [
      '3.5',
      [Validators.required, Validators.min(0), Validators.max(100)],
    ],
    skipInflation: [false],
    rate: ['10', [Validators.required, Validators.min(0), Validators.max(100)]],
    skipRate: [false],
    skipTax: [false],
  });
}
