import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pf-calculators',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calculators.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorsComponent {}
