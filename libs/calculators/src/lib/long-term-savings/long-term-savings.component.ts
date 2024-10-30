import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { scrollToElement } from '@pf/shared';
import { HeroComponent } from '@pf/ui';
import { LongTermSavingsRequest } from './model/long-term-savings.model';
import { LongTermSavingsStore } from './store/long-term-savings.store';
import { LongTermSavingsChartComponent } from './ui/long-term-savings-chart/long-term-savings-chart.component';
import { LongTermSavingsDescriptionComponent } from './ui/long-term-savings-chart/long-term-savings-description/long-term-savings-description.component';
import { LongTermSavingsFormComponent } from './ui/long-term-savings-form/long-term-savings-form.component';

@Component({
  selector: 'pf-long-term-savings',
  standalone: true,
  imports: [
    HeroComponent,
    LongTermSavingsFormComponent,
    LongTermSavingsDescriptionComponent,
    LongTermSavingsChartComponent,
  ],
  providers: [LongTermSavingsStore],
  templateUrl: './long-term-savings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsComponent {
  #store = inject(LongTermSavingsStore);

  formContainer = viewChild<ElementRef>('formContainer');

  data = this.#store.result;
  isLoading = this.#store.isLoading;

  scrollToElement = scrollToElement;

  calculate(request: LongTermSavingsRequest) {
    this.#store.calculate(request);
  }
}
