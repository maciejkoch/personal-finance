import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { HeroComponent } from "@shared/ui/hero/hero.component";

@Component({
    selector: 'pf-treasury-bonds-hero',
    imports: [HeroComponent],
    templateUrl: './treasury-bonds-hero.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreasuryBondsHeroComponent {
  clicked = output();
}
