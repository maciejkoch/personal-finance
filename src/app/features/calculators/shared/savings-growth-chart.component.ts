import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
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
} from "chart.js";
import type { PortfolioResult } from "@contracts/savings";

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Legend,
  Tooltip,
);

@Component({
  selector: "pf-savings-growth-chart",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-sm mb-3">
      Wartość brutto — przed podatkiem. Wykres rozdziela kapitał początkowy,
      późniejsze wpłaty i zysk.
    </p>
    <div class="relative w-full min-h-[400px]">
      <canvas
        #canvas
        role="img"
        aria-label="Wykres kapitału początkowego, późniejszych wpłat i zysku brutto w kolejnych latach. Wynik netto podano w podsumowaniu."
      ></canvas>
    </div>
  `,
})
export class SavingsGrowthChartComponent {
  readonly data = input.required<PortfolioResult>();
  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
  #chart: Chart<"bar", number[], number> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#chart?.destroy());
    afterRenderEffect(() => {
      const canvas = this.canvas()?.nativeElement;
      if (!canvas) return;
      const result = this.data();
      const data = {
        labels: result.valueYearPerYear.map((p) => p.year),
        datasets: [
          {
            label: "Kapitał początkowy",
            data: result.valueYearPerYear.map(() => result.initialCapital),
            backgroundColor: "#6366f1",
          },
          {
            label: "Późniejsze wpłaty",
            data: result.valueYearPerYear.map((p) => p.totalContribution),
            backgroundColor: "#d97706",
          },
          {
            label: "Zysk brutto",
            data: result.valueYearPerYear.map((p) =>
              Math.max(
                0,
                p.compoundedInteres -
                  p.totalContribution -
                  result.initialCapital,
              ),
            ),
            backgroundColor: "#0ea5e9",
          },
        ],
      };
      if (this.#chart) {
        this.#chart.data = data;
        this.#chart.update();
        return;
      }
      this.#chart = new Chart(canvas, {
        type: "bar",
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, title: { text: "Lata", display: true } },
            y: {
              stacked: true,
              title: { text: "Wartość brutto (zł)", display: true },
            },
          },
          interaction: { intersect: false, mode: "index" },
          plugins: {
            tooltip: {
              callbacks: {
                footer: (items) =>
                  `Suma brutto: ${items.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0).toLocaleString("pl-PL")} zł`,
              },
            },
          },
        },
      });
    });
  }
}
