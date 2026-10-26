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
const money = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
});

@Component({
  selector: "pf-savings-growth-chart",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <p class="text-sm mb-3">
      Każdy słupek pokazuje kapitał początkowy, późniejsze wpłaty i zysk brutto.
      „Start” to środki wniesione na początku. Odsetki od kapitału początkowego
      należą do zysku. Wynik netto podano w podsumowaniu.
    </p>
    <div class="relative w-full h-[320px] sm:h-[360px]">
      <canvas
        #canvas
        role="img"
        aria-label="Skumulowane słupki kapitału początkowego, późniejszych wpłat i zysku brutto: od startu do końca oszczędzania. Dokładne wartości dostępne są w odczycie pod wykresem."
      ></canvas>
    </div>
    <fieldset class="fieldset calculator-fieldset mt-4">
      <legend class="fieldset-legend">Odczyt wykresu</legend>
      <label class="calculator-field"
        >Rok oszczędzania
        <select
          class="select w-full calculator-select"
          (change)="selectedYear.set(+$any($event.target).value)"
        >
          @for (point of points(); track point.year) {
            <option
              [value]="point.year"
              [selected]="point.year === selectedPoint().year"
            >
              {{ point.year === 0 ? "Start" : point.year }}
            </option>
          }
        </select>
      </label>
      @let point = selectedPoint();
      <dl class="calculator-metrics" aria-live="polite">
        <div>
          <dt>Kapitał początkowy</dt>
          <dd>{{ data().initialCapital | number: "1.2-2" }} zł</dd>
        </div>
        <div>
          <dt>Późniejsze wpłaty</dt>
          <dd>{{ point.totalContribution | number: "1.2-2" }} zł</dd>
        </div>
        <div>
          <dt>Zysk brutto</dt>
          <dd>{{ point.interest | number: "1.2-2" }} zł</dd>
        </div>
        <div>
          <dt>Wartość brutto</dt>
          <dd>{{ point.compoundedInteres | number: "1.2-2" }} zł</dd>
        </div>
      </dl>
    </fieldset>
  `,
})
export class SavingsGrowthChartComponent {
  readonly data = input.required<PortfolioResult>();
  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
  readonly selectedYear = signal<number | null>(null);
  readonly points = computed(() => {
    const result = this.data();
    return [
      {
        year: 0,
        compoundedInteres: result.initialCapital,
        totalContribution: 0,
      },
      ...result.valueYearPerYear,
    ].map((point) => ({
      ...point,
      interest: Math.max(
        0,
        point.compoundedInteres -
          result.initialCapital -
          point.totalContribution,
      ),
    }));
  });
  readonly selectedPoint = computed(() => {
    const points = this.points();
    return (
      points.find((point) => point.year === this.selectedYear()) ??
      points[points.length - 1]
    );
  });
  #chart: Chart<"bar", number[], string> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#chart?.destroy());
    afterRenderEffect(() => {
      const canvas = this.canvas()?.nativeElement;
      if (!canvas) return;
      const points = this.points();
      const result = this.data();
      const data = {
        labels: points.map((point) =>
          point.year === 0 ? "Start" : String(point.year),
        ),
        datasets: [
          {
            label: "Kapitał początkowy",
            data: points.map(() => result.initialCapital),
            backgroundColor: "#818cf8",
            maxBarThickness: 48,
          },
          {
            label: "Późniejsze wpłaty",
            data: points.map((point) => point.totalContribution),
            backgroundColor: "#e9a259",
            maxBarThickness: 48,
          },
          {
            label: "Zysk brutto",
            data: points.map((point) => point.interest),
            backgroundColor: "#62b9de",
            maxBarThickness: 48,
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
        type: "bar",
        data,
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              ticks: { color: textColor, maxTicksLimit: 6 },
              title: { text: "Lata", display: true, color: textColor },
            },
            y: {
              stacked: true,
              beginAtZero: true,
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
                title: (items) =>
                  items[0]?.label === "Start"
                    ? "Start oszczędzania"
                    : `Rok ${items[0]?.label}`,
                label: (context) =>
                  `${context.dataset.label}: ${money.format(context.parsed.y ?? 0)}`,
                footer: (items) => {
                  const point = this.points()[items[0]?.dataIndex];
                  return point
                    ? `Wartość brutto: ${money.format(point.compoundedInteres)}`
                    : "";
                },
              },
            },
          },
        },
      });
    });
  }
}
