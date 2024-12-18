import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DelayedLoaderComponent } from '@pf/ui';
import { TreasuryBondsResult } from '../../model/treasury-bonds.model';
@Component({
    selector: 'pf-treasury-bonds-results-description',
    imports: [DecimalPipe, CurrencyPipe, DelayedLoaderComponent],
    templateUrl: './treasury-bonds-results-description.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
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
    const highestBond = Object.entries(last).reduce(
      (acc, [key, value]) => {
        if (key === 'month' || key === 'futureValue') {
          return acc;
        }

        return value > acc.value ? { key, value } : acc;
      },
      { key: '', value: 0 }
    );

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
