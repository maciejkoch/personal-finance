import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LongTermSavingsComponent } from '../long-term-savings/long-term-savings.component';

@Component({
  selector: 'pf-calculators-shell',
  standalone: true,
  imports: [LongTermSavingsComponent],
  templateUrl: './calculators-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'w-full' },
})
export class CalculatorsShellComponent {}
