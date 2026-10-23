import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  effect,
  ElementRef,
  input,
  viewChild,
} from "@angular/core";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Legend,
  Tooltip,
  type ChartItem,
} from "chart.js";

import { LongTermSavingsData } from "../../model/long-term-savings.model";

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Legend,
  Tooltip,
);

@Component({
  selector: "pf-long-term-savings-chart",
  imports: [],
  templateUrl: "./long-term-savings-chart.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermSavingsChartComponent {
  canvas = viewChild<ElementRef>("canvas");

  data = input<LongTermSavingsData>();

  #chart: Chart | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#chart?.destroy());
    effect(() => {
      const canvas = this.canvas()?.nativeElement as ChartItem;
      const data = this.data()?.valueYearPerYear;
      if (canvas && data) {
        if (!this.#chart) {
          this.#chart = this.#createChart();
        }

        const labels = data.map((value) => value.year);
        const totalContribution = data.map((value) => value.totalContribution);
        const interest = data.map(
          (value) => value.compoundedInteres - value.totalContribution,
        );

        const totalContributionDataset = {
          label: "wpłaty",
          data: totalContribution,
          backgroundColor: "#d97706",
        };
        const interestDataset = {
          label: "odsetki",
          data: interest,
          backgroundColor: "#0ea5e9",
        };

        const datasets = this.data()?.skipRate
          ? [totalContributionDataset]
          : [totalContributionDataset, interestDataset];

        this.#chart.data = {
          labels,
          datasets,
        };

        this.#chart.update();
      }
    });
  }

  #createChart() {
    return new Chart(this.canvas()?.nativeElement as ChartItem, {
      type: "bar",
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
        scales: {
          x: {
            stacked: true,
            title: {
              text: "Lata",
              display: true,
            },
          },
          y: {
            stacked: true,
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          tooltip: {
            callbacks: {
              footer: (tooltipItems) => {
                const sum = tooltipItems.reduce(
                  (acc, item) => acc + (item.parsed.y ?? 0),
                  0,
                );
                return `Suma: ${sum.toLocaleString()} zł`;
              },
            },
          },
        },
      },
    });
  }
}

// data: {
//   labels: data.map((row) => row.year),
//   datasets: [
//     {
//       label: 'Acquisitions by year',
//       data: data.map((row) => row.compoundedInteres),
//     },
//   ],
// },
