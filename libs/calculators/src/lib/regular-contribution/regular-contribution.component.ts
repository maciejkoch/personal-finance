import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pf-regular-contribution',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './regular-contribution.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegularContributionComponent {}
