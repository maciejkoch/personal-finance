import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { useConditionallyEnable, useLocalStorage } from '@pf/shared';
import { AccordionComponent, AccordionItemComponent } from '@pf/ui';
import { debounceTime, startWith } from 'rxjs';
import { z } from 'zod';
import { TreasuryBondsRequest } from '../../model/treasury-bonds.model';

const formSchema = z.object({
  numberOfBonds: z.number(),
  duration: z.number(),
  inflation: z.number(),
  wibor6m: z.number(),
  referenceRate: z.number(),
  rate: z.number(),
  skipTax: z.boolean(),
});

type FormType = z.infer<typeof formSchema>;

@Component({
  selector: 'pf-treasury-bonds-form',
  standalone: true,
  imports: [ReactiveFormsModule, AccordionComponent, AccordionItemComponent],
  templateUrl: './treasury-bonds-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsFormComponent {
  #fb = inject(FormBuilder);

  formLocalStorage = useLocalStorage('treasury-bonds-form', formSchema);

  changed = output<TreasuryBondsRequest>();

  form = this.buildForm();

  conditionallyEnable = useConditionallyEnable(this.form);

  constructor() {
    this.form.valueChanges
      .pipe(startWith(this.form.value), debounceTime(300), takeUntilDestroyed())
      .subscribe(() => {
        if (this.form.valid) {
          const request = this.form.getRawValue();
          this.formLocalStorage.save(request);

          const treasuryBondsRequest = this.toRequest(request);
          this.changed.emit(treasuryBondsRequest);
        }
      });
  }

  private buildForm() {
    const defaultValues = {
      numberOfBonds: 100,
      duration: 12,
      inflation: 3.5,
      wibor6m: 5.84,
      referenceRate: 5.75,
      rate: 10,
      skipTax: false,
    };

    const {
      numberOfBonds,
      duration,
      inflation,
      wibor6m,
      referenceRate,
      rate,
      skipTax,
    } = this.formLocalStorage.load() || defaultValues;

    return this.#fb.nonNullable.group({
      numberOfBonds: [numberOfBonds, [Validators.required, Validators.min(1)]],
      duration: [
        duration,
        [Validators.required, Validators.min(1), Validators.max(144)],
      ],
      inflation: [
        inflation,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      wibor6m: [
        wibor6m,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      referenceRate: [
        referenceRate,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      rate: [
        rate,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      skipTax: [skipTax],
    });
  }

  private toRequest(value: FormType): TreasuryBondsRequest {
    return {
      numberOfBonds: value.numberOfBonds,
      month: value.duration * 12,
      inflation: [value.inflation / 100],
      wibor6m: [value.wibor6m / 100],
      referenceRate: [value.referenceRate / 100],
      savingsRate: [value.rate / 100],
    };
  }
}
