import { visibleBonds, bondValue } from "../../model/bond-presentation";
import { CurrencyPipe, DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { DelayedLoaderComponent } from "@shared/ui/delayed-loader/delayed-loader.component";
import { TreasuryBondsResult } from "../../model/treasury-bonds.model";
@Component({
  selector: "pf-treasury-bonds-results-description",
  imports: [DecimalPipe, CurrencyPipe, DelayedLoaderComponent],
  templateUrl: "./treasury-bonds-results-description.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsResultsDescriptionComponent {
  data = input<TreasuryBondsResult | null>();
  loading = input<boolean>();

  highestBond = computed(() => {
    const results = this.data();
    if (!results) {
      return;
    }

    const last = results.values[results.values.length - 1];
    const highestBond = visibleBonds(results).reduce(
      (best, bond) => {
        const value = bondValue(last, bond.key);
        return value > best.value ? { key: bond.key, value } : best;
      },
      { key: "", value: -Infinity },
    );
    if (!highestBond.key) return;

    return {
      year: last.month / 12,
      bond: highestBond.key.toUpperCase(),
      value: highestBond.value,
      futureValue: last.futureValue,
      numberOfBonds: results.numberOfBonds,
      inflation: results.inflation,
    };
  });
}
