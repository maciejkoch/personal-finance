import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AccordionComponent } from "@shared/ui/accordion/accordion.component";
import { AccordionItemComponent } from "@shared/ui/accordion/accordion-item/accordion-item.component";

@Component({
    selector: 'pf-treasury-bonds-how-to',
    imports: [AccordionComponent, AccordionItemComponent],
    templateUrl: './treasury-bonds-how-to.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreasuryBondsHowToComponent {}
