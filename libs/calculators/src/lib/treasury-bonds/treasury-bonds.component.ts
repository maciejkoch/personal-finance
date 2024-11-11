import { AsyncPipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TreasuryBondsDataService } from './data/treasury-bonds-data.service';

@Component({
  selector: 'pf-treasury-bonds',
  standalone: true,
  imports: [AsyncPipe, JsonPipe],
  templateUrl: './treasury-bonds.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsComponent {
  #dataService = inject(TreasuryBondsDataService);

  data = this.#dataService.calculate({
    numberOfBonds: 100,
    month: 144,
    inflation: [0.049],
    wibor6m: [0.0584],
    referenceRate: [0.0575],
    savingsRate: [0.06],
  });
}
