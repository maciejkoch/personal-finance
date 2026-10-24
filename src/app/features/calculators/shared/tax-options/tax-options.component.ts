import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { FieldTree, FormField } from "@angular/forms/signals";

@Component({
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "pf-tax-options",
  templateUrl: "./tax-options.component.html",
})
export class TaxOptionsComponent {
  readonly bonds = input(false);
  readonly skipTax = input.required<FieldTree<boolean>>();
}
