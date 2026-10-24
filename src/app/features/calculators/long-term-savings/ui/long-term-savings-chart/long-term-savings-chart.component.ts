import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { SavingsGrowthChartComponent } from "../../../shared/savings-growth-chart.component";
import { LongTermSavingsData } from "../../model/long-term-savings.model";

@Component({
  selector: "pf-long-term-savings-chart",
  imports: [SavingsGrowthChartComponent],
  templateUrl: "./long-term-savings-chart.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsChartComponent {
  readonly data = input.required<LongTermSavingsData>();
}
