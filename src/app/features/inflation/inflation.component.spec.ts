import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { vi } from "vitest";
import { InflationComponent, inflationRange } from "./inflation.component";
import { InflationService } from "@core/inflation/inflation.service";
import { inflationTestData } from "@core/inflation/inflation.testing";
vi.mock("chart.js", () => ({
  Chart: class {
    static register() {}
    destroy() {}
  },
  CategoryScale: {},
  LinearScale: {},
  LineController: {},
  LineElement: {},
  PointElement: {},
  Tooltip: {},
}));
const points = Array.from({ length: 140 }, (_, i) => {
  const date = new Date(Date.UTC(2015, i, 1));
  return {
    period: date.toISOString().slice(0, 7),
    indexValue: 100,
    ratePercent: 0,
    flag: "" as const,
  };
});
describe("Inflation history page", () => {
  it("uses calendar ranges rather than point counts", () => {
    expect(inflationRange(points, "1y")).toHaveLength(12);
    expect(inflationRange(points, "5y")).toHaveLength(60);
    expect(inflationRange(points, "10y")).toHaveLength(120);
    expect(inflationRange(points, "all")).toHaveLength(140);
    expect(
      inflationRange(
        points.filter((_, i) => i !== 138),
        "1y",
      ),
    ).toHaveLength(11);
  });
  it("shows the source, chart range, an accessible paginated table and data errors", async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: InflationService,
          useValue: {
            current: signal(inflationTestData()),
            error: signal(false),
            loading: signal(false),
            history: vi.fn().mockResolvedValue(points),
          },
        },
      ],
    });
    const f = TestBed.createComponent(InflationComponent);
    await f.whenStable();
    expect(f.nativeElement.querySelector("h1").textContent).toContain(
      "Inflacja w Polsce",
    );
    expect(f.componentInstance.visible()).toHaveLength(60);
    expect(f.nativeElement.querySelectorAll("tbody tr")).toHaveLength(24);
    expect(f.nativeElement.querySelector('canvas[role="img"]')).not.toBeNull();
    expect(
      f.nativeElement.querySelector('a[href*="stat.gov.pl"]'),
    ).not.toBeNull();
    TestBed.inject(InflationService).history = vi
      .fn()
      .mockRejectedValue(new Error("failure"));
    await f.componentInstance.loadHistory();
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role="alert"]').textContent,
    ).toContain("Nie udało się pobrać historii");
  });
});
