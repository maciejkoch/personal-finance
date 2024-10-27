import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LongTermSavingsResponse } from '../../../data/long-term-savings.model';
@Component({
  selector: 'pf-long-term-savings-description',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './long-term-savings-description.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsDescriptionComponent {
  data = input<LongTermSavingsResponse>();
}
