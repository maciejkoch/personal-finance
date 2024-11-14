import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TreasuryBondsRequest } from './model/treasury-bonds.model';
import { TreasuryBondsStore } from './store/treasury-bonds.store';
import { TreasuryBondsFormComponent } from './ui/treasury-bonds-form/treasury-bonds-form.component';
import { TreasuryBondsResultsComponent } from './ui/treasury-bonds-results/treasury-bonds-results.component';

@Component({
  selector: 'pf-treasury-bonds',
  standalone: true,
  imports: [TreasuryBondsFormComponent, TreasuryBondsResultsComponent],
  templateUrl: './treasury-bonds.component.html',
  providers: [TreasuryBondsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsComponent {
  #store = inject(TreasuryBondsStore);

  result = this.#store.result;

  calculate(request: TreasuryBondsRequest) {
    this.#store.calculate(request);
  }
}
