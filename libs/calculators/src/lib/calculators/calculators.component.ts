import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LongTermSavingsComponent } from '../long-term-savings/long-term-savings.component';

@Component({
  selector: 'pf-calculators',
  standalone: true,
  imports: [LongTermSavingsComponent],
  templateUrl: './calculators.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorsComponent {}
