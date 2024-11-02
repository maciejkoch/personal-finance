import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { scrollToElement } from '@pf/shared';
import { HeroComponent } from '@pf/ui';
import { RegularContributionRequest } from './model/regular-contribution.model';
import { RegularContributionStore } from './store/regular-contribution.store';
import { RegularContributionChartComponent } from './ui/regular-contribution-chart/regular-contribution-chart.component';
import { RegularContributionDescriptionComponent } from './ui/regular-contribution-description/regular-contribution-description.component';
import { RegularContributionFormComponent } from './ui/regular-contribution-form/regular-contribution-form.component';

@Component({
  selector: 'pf-regular-contribution',
  standalone: true,
  imports: [
    HeroComponent,
    RegularContributionFormComponent,
    RegularContributionDescriptionComponent,
    RegularContributionChartComponent,
  ],
  providers: [RegularContributionStore],
  templateUrl: './regular-contribution.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegularContributionComponent {
  #store = inject(RegularContributionStore);

  formContainer = viewChild<ElementRef>('formContainer');

  data = this.#store.result;
  isLoading = this.#store.isLoading;

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
