import {
  ChangeDetectionStrategy,
  Component,
  effect,
  output,
  signal,
} from "@angular/core";
import {
  form,
  FormField,
  max,
  min,
  required,
  validate,
} from "@angular/forms/signals";
import { AccordionComponent } from "@shared/ui/accordion/accordion.component";
import { AccordionItemComponent } from "@shared/ui/accordion/accordion-item/accordion-item.component";
import { TreasuryBondsRequest } from "../../model/treasury-bonds.model";
import { TaxOptionsComponent } from "../../../shared/tax-options/tax-options.component";
import {
  BOND_STORAGE_KEY,
  BondFormValue,
  bondFormDefaults,
  readBondForm,
  serializeBondForm,
} from "../../model/treasury-bonds-form-state";

@Component({
  selector: "pf-treasury-bonds-form",
  imports: [
    FormField,
    AccordionComponent,
    AccordionItemComponent,
    TaxOptionsComponent,
  ],
  templateUrl: "./treasury-bonds-form.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsFormComponent {
  readonly changed = output<TreasuryBondsRequest>();
  readonly pending = output<TreasuryBondsRequest | null>();
  readonly optionsChanged = output<{ familyEligible: boolean }>();
  readonly model = signal(this.load());
  readonly form = form(this.model, (path) => {
    required(path.numberOfBonds);
    min(path.numberOfBonds, 1);
    max(path.numberOfBonds, 1000000);
    validate(path.numberOfBonds, ({ value }) =>
      Number.isInteger(value())
        ? undefined
        : { kind: "integer", message: "Podaj pełną liczbę obligacji." },
    );
    required(path.duration);
    min(path.duration, 1);
    max(path.duration, 12);
    validate(path.duration, ({ value }) =>
      Number.isInteger(value())
        ? undefined
        : { kind: "integer", message: "Podaj pełną liczbę lat." },
    );
    required(path.inflation);
    min(path.inflation, -99);
    max(path.inflation, 100);
    required(path.referenceRate);
    min(path.referenceRate, 0);
    max(path.referenceRate, 100);
    required(path.rate);
    min(path.rate, 0);
    max(path.rate, 100);
  });

  constructor() {
    effect((onCleanup) => {
      const value = this.model();
      this.pending.emit(this.form().valid() ? this.toRequest(value) : null);
      this.optionsChanged.emit({
        familyEligible: value.familyEligible,
      });
      if (!this.form().valid()) return;
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(BOND_STORAGE_KEY, serializeBondForm(value));
        } catch {
          /* Storage may be unavailable. */
        }
        this.changed.emit(this.toRequest(value));
      }, 300);
      onCleanup(() => clearTimeout(timer));
    });
  }

  resetToCurrentDefaults() {
    this.form().reset({ ...bondFormDefaults });
  }

  private load(): BondFormValue {
    try {
      return readBondForm(localStorage.getItem(BOND_STORAGE_KEY));
    } catch {
      return { ...bondFormDefaults };
    }
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
      familyEligible: value.familyEligible,
    };
  }
}
