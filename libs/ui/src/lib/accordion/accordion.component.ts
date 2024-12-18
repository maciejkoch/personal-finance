import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'pfui-accordion',
    imports: [ReactiveFormsModule],
    templateUrl: './accordion.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccordionComponent {}
