import { DecimalPipe } from "@angular/common";
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
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
  LineController,
  LineElement,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";
import type { PortfolioResult } from "@contracts/savings";

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
  selector: "pf-savings-growth-chart",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <p class="text-sm mb-3">
      Wartość brutto — przed podatkiem, w porównaniu z wniesionymi środkami.
      Wynik netto podano w podsumowaniu.
    </p>
    <div class="relative w-full h-[320px] sm:h-[360px]">
      <canvas
        #canvas
        role="img"
        aria-label="Wykres wartości brutto i wniesionych środków w kolejnych latach. Dokładne wartości dostępne są w odczycie pod wykresem."
      ></canvas>
    </div>
    <fieldset class="fieldset calculator-fieldset mt-4">
      <legend class="fieldset-legend">Odczyt wykresu</legend>
      <label class="calculator-field"
        >Rok oszczędzania
        <select
          class="select w-full calculator-select"
          [value]="selectedPoint()?.year"
          (change)="selectedYear.set(+$any($event.target).value)"
        >
          @for (point of data().valueYearPerYear; track point.year) {
            <option [value]="point.year">{{ point.year }}</option>
          }
        </select>
      </label>
      @if (selectedPoint(); as point) {
        <dl class="calculator-metrics" aria-live="polite">
          <div>
            <dt>Wartość brutto</dt>
            <dd>{{ point.compoundedInteres | number: "1.2-2" }} zł</dd>
          </div>
          <div>
            <dt>Wniesione środki</dt>
            <dd>
              {{
                data().initialCapital + point.totalContribution
                  | number: "1.2-2"
              }}
              zł
            </dd>
          </div>
        </dl>
      }
    </fieldset>
  `,
})
export class SavingsGrowthChartComponent {
  readonly data = input.required<PortfolioResult>();
  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
  readonly selectedYear = signal<number | null>(null);
  readonly selectedPoint = computed(() => {
    const points = this.data().valueYearPerYear;
    return (
      points.find((point) => point.year === this.selectedYear()) ??
      points.at(-1)
    );
  });
  #chart: Chart<"line", number[], number> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#chart?.destroy());
    afterRenderEffect(() => {
      const canvas = this.canvas()?.nativeElement;
      if (!canvas) return;
      const result = this.data();
      const data = {
        labels: [0, ...result.valueYearPerYear.map((p) => p.year)],
        datasets: [
          {
            label: "Wartość brutto",
            data: [
              result.initialCapital,
              ...result.valueYearPerYear.map(
                (point) => point.compoundedInteres,
              ),
            ],
            borderColor: "#e9a259",
            backgroundColor: "#e9a259",
            pointRadius: 0,
          },
          {
            label: "Wniesione środki",
            data: [
              result.initialCapital,
              ...result.valueYearPerYear.map(
                (point) => result.initialCapital + point.totalContribution,
              ),
            ],
            borderColor: "#62b9de",
            backgroundColor: "#62b9de",
            borderDash: [6, 4],
            pointRadius: 0,
          },
        ],
      };
      if (this.#chart) {
        this.#chart.data = data;
        this.#chart.update();
        return;
      }
      const textColor = getComputedStyle(canvas).color;
      this.#chart = new Chart(canvas, {
        type: "line",
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: textColor, maxTicksLimit: 6 },
              title: { text: "Lata", display: true, color: textColor },
            },
            y: {
              ticks: {
                color: textColor,
                maxTicksLimit: 5,
                callback: (value) =>
                  new Intl.NumberFormat("pl-PL", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(Number(value)),
              },
              title: {
                text: "Wartość brutto (zł)",
                display: true,
                color: textColor,
              },
            },
          },
          interaction: { intersect: false, mode: "index" },
          plugins: {
            legend: { labels: { color: textColor, boxWidth: 14, padding: 12 } },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `${context.dataset.label}: ${(context.parsed.y ?? 0).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`,
              },
            },
          },
        },
      });
    });
  }
}
