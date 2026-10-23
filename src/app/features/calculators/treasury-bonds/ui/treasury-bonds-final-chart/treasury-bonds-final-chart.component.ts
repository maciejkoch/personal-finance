import { CurrencyPipe } from "@angular/common";
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from "@angular/core";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { visibleBonds, bondValue } from "../../model/bond-presentation";
import { TreasuryBondsResult } from "../../model/treasury-bonds.model";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

const currency = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
});

@Component({
  selector: "pf-treasury-bonds-final-chart",
  imports: [CurrencyPipe],
  templateUrl: "./treasury-bonds-final-chart.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsFinalChartComponent {
  data = input.required<TreasuryBondsResult>();
  canvas = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
  finalValue = computed(() =>
    this.data().values.find((value) => value.month === this.data().month),
  );

  #chart: Chart<"bar" | "line", number[], string> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#chart?.destroy());
    afterRenderEffect(() => {
      const canvas = this.canvas()?.nativeElement;
      const value = this.finalValue();
      if (!canvas || !value) return;

      const bonds = visibleBonds(this.data());
      const data = {
        labels: bonds.map((bond) => bond.key.toUpperCase()),
        datasets: [
          {
            type: "line" as const,
            label: "Kapitał powiększony o inflację",
            data: bonds.map(() => value.futureValue),
            borderColor: "#e11d48",
            borderDash: [6, 6],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 0,
            xAxisID: "inflation",
            order: 0,
          },
          {
            type: "bar" as const,
            label: this.data().skipTax
              ? "Wartość bez podatku, po opłatach"
              : "Wartość po podatku i opłatach",
            data: bonds.map((bond) => bondValue(value, bond.key)),
            backgroundColor: bonds.map((bond) => bond.color),
            borderRadius: 4,
            maxBarThickness: 80,
            order: 1,
          },
        ],
      };

      if (this.#chart) {
        this.#chart.data = data;
        this.#chart.update();
        return;
      }

      const textColor = getComputedStyle(canvas).color;
      this.#chart = new Chart<"bar" | "line", number[], string>(canvas, {
        type: "bar",
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: { mode: "nearest", intersect: true },
          scales: {
            x: {
              grid: { display: false },
              ticks: { autoSkip: false, color: textColor },
            },
            // Extend the reference line to both edges of the plot.
            inflation: {
              axis: "x",
              type: "category",
              display: false,
              offset: false,
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: "Wartość (zł)", color: textColor },
              ticks: {
                color: textColor,
                callback: (value) => Number(value).toLocaleString("pl-PL"),
              },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `${context.dataset.label}: ${currency.format(context.parsed.y ?? 0)}`,
              },
            },
          },
        },
      });
    });
  }
}
