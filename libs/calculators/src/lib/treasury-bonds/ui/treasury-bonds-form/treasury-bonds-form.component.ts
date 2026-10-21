import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AccordionComponent, AccordionItemComponent } from "@pf/ui";
import { debounceTime, startWith } from "rxjs";
import { TreasuryBondsRequest } from "../../model/treasury-bonds.model";
import {
  BOND_STORAGE_KEY,
  BondFormValue,
  bondFormDefaults,
  readBondForm,
  serializeBondForm,
} from "../../model/treasury-bonds-form-state";

@Component({
  selector: "pf-treasury-bonds-form",
  imports: [ReactiveFormsModule, AccordionComponent, AccordionItemComponent],
  templateUrl: "./treasury-bonds-form.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsFormComponent {
  #fb = inject(FormBuilder);
  changed = output<TreasuryBondsRequest>();
  form = this.buildForm();

  constructor() {
    this.form.valueChanges
      .pipe(startWith(this.form.value), debounceTime(300), takeUntilDestroyed())
      .subscribe(() => {
        if (this.form.valid) {
          const value = this.form.getRawValue();
          try {
            localStorage.setItem(BOND_STORAGE_KEY, serializeBondForm(value));
          } catch {
            /* Storage may be unavailable. */
          }
          this.changed.emit(this.toRequest(value));
        }
      });
  }

  resetToCurrentDefaults() {
    this.form.reset({ ...bondFormDefaults });
  }

  private buildForm() {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(BOND_STORAGE_KEY);
    } catch {
      /* SSR or denied storage. */
    }
    const value = readBondForm(saved);
    return this.#fb.nonNullable.group({
      numberOfBonds: [
        value.numberOfBonds,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(1000000),
          Validators.pattern(/^\d+$/),
        ],
      ],
      duration: [
        value.duration,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(12),
          Validators.pattern(/^\d+$/),
        ],
      ],
      inflation: [
        value.inflation,
        [Validators.required, Validators.min(-99), Validators.max(100)],
      ],
      referenceRate: [
        value.referenceRate,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      rate: [
        value.rate,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      skipTax: [value.skipTax],
    });
  }

  private toRequest(value: BondFormValue): TreasuryBondsRequest {
    return {
      numberOfBonds: value.numberOfBonds,
      month: value.duration * 12,
      inflation: [value.inflation / 100],
      wibor6m: [0],
      referenceRate: [value.referenceRate / 100],
      savingsRate: [value.rate / 100],
      skipTax: value.skipTax,
    };
  }
}
