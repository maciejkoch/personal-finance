import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  inject,
  DestroyRef,
  viewChild,
} from "@angular/core";
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Legend,
  Tooltip,
  type ChartItem,
} from "chart.js";

import { visibleBonds, bondValue } from "../../model/bond-presentation";
import { TreasuryBondsResult } from "../../model/treasury-bonds.model";

Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Legend,
  Tooltip,
);

@Component({
  selector: "pf-treasury-bonds-chart",
  imports: [],
  templateUrl: "./treasury-bonds-chart.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsChartComponent {
  canvas = viewChild<ElementRef>("canvas");

  data = input<TreasuryBondsResult>();

  #chart: Chart<"line", number[], number> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#chart?.destroy());
    effect(() => {
      const canvas = this.canvas()?.nativeElement as ChartItem;
      // TODO to check monthly data. This is a temporary solution
      const data = this.data()?.values.filter(
        (value) => value.month % 12 === 0,
      );
      if (canvas && data) {
        if (!this.#chart) {
          this.#chart = this.#createChart();
        }

        const result = this.data()!;
        this.#chart.data = {
          labels: data.map((point) => point.month / 12),
          datasets: [
            {
              label: "Wpłaty powiększone o INFLACJĘ",
              data: data.map((point) => point.futureValue),
              borderColor: "#e11d48",
              borderDash: [5, 5],
              pointRadius: 0,
            },
            ...visibleBonds(result).map((bond) => ({
              label: bond.label,
              data: data.map((point) => bondValue(point, bond.key)),
              borderColor: bond.color,
              backgroundColor: bond.color,
              pointRadius: 0,
            })),
          ],
        };

        this.#chart.update();
      }
    });
  }

  #createChart() {
    return new Chart<"line", number[], number>(
      this.canvas()?.nativeElement as ChartItem,
      {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text: "Wartość (zł)",
              },
            },
          },
        },
      },
    );
  }
}
