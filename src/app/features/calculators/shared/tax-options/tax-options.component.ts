import { Router } from "@angular/router";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core";
import { FieldTree, FormField } from "@angular/forms/signals";

@Component({
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "pf-tax-options",
  templateUrl: "./tax-options.component.html",
})
export class TaxOptionsComponent {
  private readonly router = inject(Router, { optional: true });
  helpHref() {
    return (this.router?.url ?? "").split("#")[0] + "#ike-explanation";
  }
  readonly bonds = input(false);
  readonly skipTax = input.required<FieldTree<boolean>>();
}
