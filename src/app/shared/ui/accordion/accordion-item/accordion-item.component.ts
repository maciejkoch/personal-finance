import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "pfui-accordion-item",
  templateUrl: "./accordion-item.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionItemComponent {
  hasBorder = input(true);
  opened = input(false);
}
