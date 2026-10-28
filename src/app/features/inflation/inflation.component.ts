import { DatePipe, DecimalPipe, Location } from "@angular/common";
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { InflationService } from "@core/inflation/inflation.service";
import { type InflationPoint } from "@contracts/inflation";
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);
export const INFLATION_RANGES = ["1y", "5y", "10y", "all"] as const;
type Range = (typeof INFLATION_RANGES)[number];
export function inflationRange(
  points: InflationPoint[],
  range: string,
): InflationPoint[] {
  const last = points.at(-1);
  if (!last || range === "all") return points;
  const months = range === "1y" ? 12 : range === "10y" ? 120 : 60;
  const number = (p: string) => Number(p.slice(0, 4)) * 12 + Number(p.slice(5));
  return points.filter((p) => number(p.period) > number(last.period) - months);
}
@Component({
  selector: "pf-inflation",
  imports: [DecimalPipe, DatePipe, RouterLink],
  templateUrl: "./inflation.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InflationComponent {
  readonly data = inject(InflationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  readonly range = signal<Range>(
    this.readRange(this.route.snapshot.queryParamMap.get("range")),
  );
  readonly points = signal<InflationPoint[]>([]);
  readonly historyError = signal(false);
  readonly historyLoading = signal(false);
  readonly visible = computed(() =>
    inflationRange(this.points(), this.range()),
  );
  readonly page = signal(0);
  readonly table = computed(() =>
    [...this.visible()]
      .reverse()
      .slice(this.page() * 24, (this.page() + 1) * 24),
  );
  readonly pageCount = computed(() => Math.ceil(this.visible().length / 24));
  readonly change = computed(() => {
    const p = this.points();
    const last = p.at(-1),
      previous = p.at(-2);
    if (!last || !previous) return null;
    const date = new Date(`${last.period}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() - 1);
    return date.toISOString().slice(0, 7) === previous.period
      ? last.ratePercent - previous.ratePercent
      : null;
  });
  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
  private chart?: Chart<"line", (number | null)[], string>;
  private request = 0;
  constructor() {
    const subscription = this.route.queryParamMap.subscribe((params) => {
      this.range.set(this.readRange(params.get("range")));
      this.page.set(0);
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.chart?.destroy();
      this.request++;
    });
    effect(() => {
      const current = this.data.current();
      if (current) void this.loadHistory(current.datasetId);
    });
    afterRenderEffect(() => {
      const canvas = this.canvas()?.nativeElement;
      const points = this.visible();
      this.chart?.destroy();
      this.chart = undefined;
      if (!canvas || !points.length) return;
      // Insert explicit nulls for absent months; never bridge missing observations.
      const byMonth = new Map(points.map((p) => [p.period, p.ratePercent]));
      const labels: string[] = [];
      const date = new Date(`${points[0].period}-01T00:00:00Z`);
      while (
        date.toISOString().slice(0, 7) <= points[points.length - 1].period
      ) {
        labels.push(date.toISOString().slice(0, 7));
        date.setUTCMonth(date.getUTCMonth() + 1);
      }
      const color = getComputedStyle(canvas).color;
      this.chart = new Chart(canvas, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Inflacja r/r (%)",
              data: labels.map((p) => byMonth.get(p) ?? null),
              borderColor: "#818cf8",
              backgroundColor: "#818cf8",
              pointRadius: points.length < 25 ? 3 : 0,
              pointHitRadius: 12,
              borderWidth: 2,
              spanGaps: false,
            },
          ],
        },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          scales: {
            x: {
              ticks: { color, maxTicksLimit: 8 },
              title: { display: true, text: "Miesiąc", color },
            },
            y: {
              beginAtZero: true,
              ticks: { color, callback: (value) => `${value}%` },
              title: { display: true, text: "Inflacja r/r (%)", color },
              grid: {
                color: (context) =>
                  context.tick.value === 0 ? color : "rgba(128,128,128,0.15)",
                lineWidth: (context) => (context.tick.value === 0 ? 2 : 1),
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                title: (items) => this.period(items[0]?.label || ""),
                label: (item) =>
                  `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(item.parsed.y ?? 0)}% r/r`,
              },
            },
          },
        },
      });
    });
  }
  private readRange(value: string | null): Range {
    return INFLATION_RANGES.includes(value as Range) ? (value as Range) : "5y";
  }
  setRange(value: string) {
    this.range.set(this.readRange(value));
    this.page.set(0);
    const url = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: { range: this.range() },
      queryParamsHandling: "merge",
      preserveFragment: true,
    });
    // Changing a chart filter must not trigger the router's scroll restoration.
    this.location.replaceState(
      this.router.serializeUrl(url),
      "",
      this.location.getState(),
    );
  }
  async loadHistory(id = this.data.current()?.datasetId) {
    if (!id) return;
    const request = ++this.request;
    this.historyLoading.set(true);
    this.historyError.set(false);
    this.points.set([]);
    this.page.set(0);
    try {
      const points = await this.data.history(id);
      if (request === this.request) this.points.set(points);
    } catch {
      if (request === this.request) this.historyError.set(true);
    } finally {
      if (request === this.request) this.historyLoading.set(false);
    }
  }
  period(value: string) {
    return value
      ? new Intl.DateTimeFormat("pl-PL", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(`${value}-01T00:00:00Z`))
      : "";
  }
}
