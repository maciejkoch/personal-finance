import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from "@angular/core";
import { CalculationStatusComponent } from "../shared/calculation-status.component";
import { RouterLink } from "@angular/router";
import { scrollToElement } from "@shared/scroll/scroll-to-element";
import { HeroComponent } from "@shared/ui/hero/hero.component";
import { LongTermSavingsRequest } from "./model/long-term-savings.model";
import { LongTermSavingsStore } from "./store/long-term-savings.store";
import { LongTermSavingsChartComponent } from "./ui/long-term-savings-chart/long-term-savings-chart.component";
import { LongTermSavingsDescriptionComponent } from "./ui/long-term-savings-description/long-term-savings-description.component";
import { LongTermSavingsFormComponent } from "./ui/long-term-savings-form/long-term-savings-form.component";

@Component({
  selector: "pf-long-term-savings",
  imports: [
    RouterLink,
    CalculationStatusComponent,
    HeroComponent,
    LongTermSavingsFormComponent,
    LongTermSavingsDescriptionComponent,
    LongTermSavingsChartComponent,
  ],
  providers: [LongTermSavingsStore],
  templateUrl: "./long-term-savings.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsComponent {
  #store = inject(LongTermSavingsStore);

  formContainer = viewChild<ElementRef>("formContainer");

  data = this.#store.result;
  isLoading = this.#store.isLoading;
  error = this.#store.error;
  isStale = this.#store.isStale;
  retry() {
    this.#store.retry();
  }
  invalidate(next: LongTermSavingsRequest | null) {
    this.#store.prepare(next);
  }

  calculate(request: LongTermSavingsRequest) {
    this.#store.calculate(request);
  }

  scrollToForm() {
    const target = this.formContainer();
    if (target) {
      scrollToElement(target.nativeElement);
    }
  }
}
