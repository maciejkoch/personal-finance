import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'pfui-accordion-item',
    imports: [ReactiveFormsModule],
    templateUrl: './accordion-item.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccordionItemComponent {
  hasBorder = input(true);
  opened = input(false);
}
