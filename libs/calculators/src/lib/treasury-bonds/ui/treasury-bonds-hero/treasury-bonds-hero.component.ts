import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { HeroComponent } from '@pf/ui';

@Component({
  selector: 'pf-treasury-bonds-hero',
  standalone: true,
  imports: [HeroComponent],
  templateUrl: './treasury-bonds-hero.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsHeroComponent {
  clicked = output();
}
