import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { scrollToElement } from "@shared/scroll/scroll-to-element";
import { HeroComponent } from "@shared/ui/hero/hero.component";
import { RegularContributionRequest } from "./model/regular-contribution.model";
import { RegularContributionStore } from "./store/regular-contribution.store";
import { RegularContributionChartComponent } from "./ui/regular-contribution-chart/regular-contribution-chart.component";
import { RegularContributionDescriptionComponent } from "./ui/regular-contribution-description/regular-contribution-description.component";
import { RegularContributionFormComponent } from "./ui/regular-contribution-form/regular-contribution-form.component";

@Component({
  selector: "pf-regular-contribution",
  imports: [
    RouterLink,
    HeroComponent,
    RegularContributionFormComponent,
    RegularContributionDescriptionComponent,
    RegularContributionChartComponent,
  ],
  providers: [RegularContributionStore],
  templateUrl: "./regular-contribution.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegularContributionComponent {
  #store = inject(RegularContributionStore);

  formContainer = viewChild<ElementRef>("formContainer");

  data = this.#store.result;
  isLoading = this.#store.isLoading;
  error = this.#store.error;
  invalidate(next: RegularContributionRequest | null) {
    const previous = this.#store.request();
    if (
      !next ||
      (previous &&
        (previous.ike !== next.ike || previous.skipTax !== next.skipTax))
    ) {
      this.#store.calculate(null);
    }
  }

  calculate(request: RegularContributionRequest) {
    this.#store.calculate(request);
  }

  scrollToForm() {
    const target = this.formContainer();
    if (target) {
      scrollToElement(target.nativeElement);
    }
  }
}
