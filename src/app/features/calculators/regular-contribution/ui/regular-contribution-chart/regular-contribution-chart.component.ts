import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { SavingsGrowthChartComponent } from "../../../shared/savings-growth-chart.component";
import { RegularContributionData } from "../../model/regular-contribution.model";

@Component({
  selector: "pf-regular-contribution-chart",
  imports: [SavingsGrowthChartComponent],
  templateUrl: "./regular-contribution-chart.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegularContributionChartComponent {
  readonly data = input.required<RegularContributionData>();
}
