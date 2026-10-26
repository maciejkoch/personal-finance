import { CalculatorPanelComponent } from "../../../shared/calculator-panel.component";
import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RegularContributionData } from "../../model/regular-contribution.model";
@Component({
  selector: "pf-regular-contribution-description",
  imports: [DecimalPipe, CalculatorPanelComponent],
  templateUrl: "./regular-contribution-description.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegularContributionDescriptionComponent {
  data = input<RegularContributionData>();
}
