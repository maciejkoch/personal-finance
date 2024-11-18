import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AccordionComponent, AccordionItemComponent } from '@pf/ui';

@Component({
  selector: 'pf-treasury-bonds-how-to',
  standalone: true,
  imports: [AccordionComponent, AccordionItemComponent],
  templateUrl: './treasury-bonds-how-to.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsHowToComponent {}
