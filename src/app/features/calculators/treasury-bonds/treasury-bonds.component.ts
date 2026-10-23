import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import * as offer from "@data/bond-offer";
import { DecimalPipe } from "@angular/common";
import { scrollToElement } from "@shared/scroll/scroll-to-element";
import { availablePolishBonds } from "@markets/pl/polish-calculator-options";
import { TreasuryBondsRequest } from "./model/treasury-bonds.model";
import { TreasuryBondsStore } from "./store/treasury-bonds.store";
import { TreasuryBondsChartComponent } from "./ui/treasury-bonds-chart/treasury-bonds-chart.component";
import { TreasuryBondsFinalChartComponent } from "./ui/treasury-bonds-final-chart/treasury-bonds-final-chart.component";
import { TreasuryBondsFormComponent } from "./ui/treasury-bonds-form/treasury-bonds-form.component";
import { TreasuryBondsHeroComponent } from "./ui/treasury-bonds-hero/treasury-bonds-hero.component";
import { TreasuryBondsHowToComponent } from "./ui/treasury-bonds-how-to/treasury-bonds-how-to.component";
import { TreasuryBondsResultsDescriptionComponent } from "./ui/treasury-bonds-results-description/treasury-bonds-results-description.component";
import { TreasuryBondsResultsComponent } from "./ui/treasury-bonds-results/treasury-bonds-results.component";

@Component({
  selector: "pf-treasury-bonds",
  imports: [
    RouterLink,
    DecimalPipe,
    TreasuryBondsHeroComponent,
    TreasuryBondsHowToComponent,
    TreasuryBondsFormComponent,
    TreasuryBondsResultsDescriptionComponent,
    TreasuryBondsResultsComponent,
    TreasuryBondsChartComponent,
    TreasuryBondsFinalChartComponent,
  ],
  templateUrl: "./treasury-bonds.component.html",
  providers: [TreasuryBondsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "relative " },
})
export class TreasuryBondsComponent {
  #store = inject(TreasuryBondsStore);

  scrollToContainer = viewChild<ElementRef>("scrollToContainer");

  result = this.#store.result;
  loading = this.#store.loading;
  error = this.#store.error;
  offer = offer;
  options = signal({ ike: false, familyEligible: false });
  bonds = computed(() => {
    const available = availablePolishBonds(this.options());
    return Object.values(offer.bonds).filter((bond) =>
      available.some((type) => type.toUpperCase() === bond.name),
    );
  });

  invalidate(next: TreasuryBondsRequest | null) {
    const previous = this.#store.request();
    if (
      !next ||
      (previous &&
        (previous.ike !== next.ike ||
          previous.skipTax !== next.skipTax ||
          previous.familyEligible !== next.familyEligible))
    ) {
      this.#store.calculate(null);
    }
  }

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
