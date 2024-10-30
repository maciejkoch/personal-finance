import { ChangeDetectionStrategy, Component } from '@angular/core';
import { scrollToElement } from '@pf/shared';
import { HeroComponent } from '@pf/ui';

@Component({
  selector: 'pf-regular-contribution',
  standalone: true,
  imports: [HeroComponent],
  templateUrl: './regular-contribution.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegularContributionComponent {
  scrollToElement = scrollToElement;
}
