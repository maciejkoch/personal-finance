import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  afterRenderEffect,
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

  readonly displayedBonds = computed(() =>
    visibleBonds(this.data() ?? { activeBondTypes: [] }),
  );
  readonly hiddenSeries = signal<string[]>([]);
  toggleSeries(key: string) {
    this.hiddenSeries.update((keys) =>
      keys.includes(key)
        ? keys.filter((value) => value !== key)
        : [...keys, key],
    );
  }

  #chart: Chart<"line", number[], number> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#chart?.destroy());
    afterRenderEffect(() => {
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
              hidden: this.hiddenSeries().includes("inflation"),
              data: data.map((point) => point.futureValue),
              borderColor: "#e11d48",
              borderDash: [5, 5],
              pointRadius: data.length === 1 ? 4 : 0,
            },
            ...visibleBonds(result).map((bond, index) => ({
              label: bond.label,
              hidden: this.hiddenSeries().includes(bond.key),
              data: data.map((point) => bondValue(point, bond.key)),
              borderColor: bond.color,
              backgroundColor: bond.color,
              borderDash: [
                [],
                [7, 3],
                [2, 3],
                [9, 3, 2, 3],
                [4, 3],
                [10, 4],
                [1, 3],
              ][index],
              pointRadius: data.length === 1 ? 4 : 0,
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
            mode: "index",
          },
          color: getComputedStyle(this.canvas()!.nativeElement).color,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              display: true,
              ticks: {
                color: getComputedStyle(this.canvas()!.nativeElement).color,
                maxTicksLimit: 6,
              },
              title: {
                display: true,
                text: "Lata",
                color: getComputedStyle(this.canvas()!.nativeElement).color,
              },
            },
            y: {
              display: true,
              ticks: {
                color: getComputedStyle(this.canvas()!.nativeElement).color,
                maxTicksLimit: 5,
                callback: (value) =>
                  new Intl.NumberFormat("pl-PL", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(Number(value)),
              },
              title: {
                display: true,
                text: "Wartość (zł)",
                color: getComputedStyle(this.canvas()!.nativeElement).color,
              },
            },
          },
        },
      },
    );
  }
}
