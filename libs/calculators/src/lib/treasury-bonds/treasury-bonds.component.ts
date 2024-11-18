import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { scrollToElement } from '@pf/shared';
import { TreasuryBondsRequest } from './model/treasury-bonds.model';
import { TreasuryBondsStore } from './store/treasury-bonds.store';
import { TreasuryBondsChartComponent } from './ui/treasury-bonds-chart/treasury-bonds-chart.component';
import { TreasuryBondsFormComponent } from './ui/treasury-bonds-form/treasury-bonds-form.component';
import { TreasuryBondsHeroComponent } from './ui/treasury-bonds-hero/treasury-bonds-hero.component';
import { TreasuryBondsHowToComponent } from './ui/treasury-bonds-how-to/treasury-bonds-how-to.component';
import { TreasuryBondsResultsDescriptionComponent } from './ui/treasury-bonds-results-description/treasury-bonds-results-description.component';
import { TreasuryBondsResultsComponent } from './ui/treasury-bonds-results/treasury-bonds-results.component';

@Component({
  selector: 'pf-treasury-bonds',
  standalone: true,
  imports: [
    TreasuryBondsHeroComponent,
    TreasuryBondsHowToComponent,
    TreasuryBondsFormComponent,
    TreasuryBondsResultsDescriptionComponent,
    TreasuryBondsResultsComponent,
    TreasuryBondsChartComponent,
  ],
  templateUrl: './treasury-bonds.component.html',
  providers: [TreasuryBondsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative ' },
})
export class TreasuryBondsComponent {
  #store = inject(TreasuryBondsStore);

  scrollToContainer = viewChild<ElementRef>('scrollToContainer');

  result = this.#store.result;
  loading = this.#store.loading;

  calculate(request: TreasuryBondsRequest) {
    this.#store.calculate(request);
  }

  scrollToForm() {
    const target = this.scrollToContainer();
    if (target) {
      scrollToElement(target.nativeElement);
    }
  }
}
