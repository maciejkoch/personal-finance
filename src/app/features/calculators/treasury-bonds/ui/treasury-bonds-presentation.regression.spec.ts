import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import type { ChartConfiguration, ChartData } from "chart.js";
import { TreasuryBondsResult } from "../model/treasury-bonds.model";
import { TreasuryBondsResultsComponent } from "./treasury-bonds-results/treasury-bonds-results.component";
import { TreasuryBondsResultsDescriptionComponent } from "./treasury-bonds-results-description/treasury-bonds-results-description.component";
import { TreasuryBondsChartComponent } from "./treasury-bonds-chart/treasury-bonds-chart.component";
import { TreasuryBondsFinalChartComponent } from "./treasury-bonds-final-chart/treasury-bonds-final-chart.component";
import { availablePolishBonds } from "@markets/pl/polish-calculator-options";

interface CapturedChart {
  type: string;
  data: ChartData;
  update: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}
const charts = vi.hoisted(() => ({ instances: [] as CapturedChart[] }));

// Replace only the canvas renderer. Real components, templates, computed values,
// datasets and update effects still execute; no Chart.js internals are tested.
vi.mock("chart.js", async () => {
  const { vi: mocking } = await import("vitest");
  return {
    CategoryScale: class {},
    LinearScale: class {},
    LineController: class {},
    LineElement: class {},
    PointElement: class {},
    Legend: class {},
    Tooltip: class {},
    BarController: class {},
    BarElement: class {},
    Chart: class {
      static register = mocking.fn();
      type: string;
      data: ChartData;
      update = mocking.fn();
      destroy = mocking.fn();
      constructor(_canvas: unknown, configuration: ChartConfiguration) {
        this.type = configuration.type;
        this.data = configuration.data;
        charts.instances.push(this);
      }
    },
  };
});

const keys = ["ror", "dor", "tos", "coi", "edo", "ros", "rod"] as const;
const result: TreasuryBondsResult = {
  numberOfBonds: 100,
  month: 24,
  inflation: [0.035],
  referenceRate: [0.04],
  savingsRate: [0],
  wibor6m: [0],
  skipTax: false,
  offerVersion: "2026-10-v1",
  calculationVersion: 2,
  values: [
    {
      month: 1,
      ror: 999999,
      dor: 999998,
      tos: 999997,
      coi: 999996,
      edo: 999995,
      ros: 999994,
      rod: 999993,
      futureValue: 9999999,
    },
    {
      month: 12,
      ror: 40000,
      dor: 20000,
      tos: 21000,
      coi: 22000,
      edo: 23000,
      ros: 45000,
      rod: 24000,
      futureValue: 50000,
    },
    {
      month: 24,
      ror: 10101.11,
      dor: 10202.22,
      tos: 10303.33,
      coi: 10404.44,
      edo: 10505.55,
      ros: 10606.66,
      rod: 10707.77,
      futureValue: 60000,
    },
  ],
};

describe("Bond presentation numerical regressions", () => {
  beforeEach(() => {
    localStorage.clear();
    charts.instances.length = 0;
  });

  for (const skipTax of [false, true]) {
    it(`table, both charts and summary agree on all instruments and final year: skipTax=${skipTax}`, async () => {
      const input = structuredClone({ ...result, skipTax });
      const table = TestBed.createComponent(TreasuryBondsResultsComponent);
      const summary = TestBed.createComponent(
        TreasuryBondsResultsDescriptionComponent,
      );
      const line = TestBed.createComponent(TreasuryBondsChartComponent);
      const bar = TestBed.createComponent(TreasuryBondsFinalChartComponent);
      table.componentRef.setInput("results", input);
      summary.componentRef.setInput("data", input);
      line.componentRef.setInput("data", input);
      bar.componentRef.setInput("data", input);
      await Promise.all([
        table.whenStable(),
        summary.whenStable(),
        line.whenStable(),
        bar.whenStable(),
      ]);

      const rows: NodeListOf<HTMLTableRowElement> =
        table.nativeElement.querySelectorAll("tbody tr");
      expect(rows).toHaveLength(2);
      const headers: string[] = Array.from(
        table.nativeElement.querySelectorAll("thead th"),
        (th: Element) => th.textContent!.trim(),
      );
      const cells = rows[1].querySelectorAll("th,td");
      for (const key of keys) {
        const column = headers.findIndex((header) =>
          header.startsWith(key.toUpperCase()),
        );
        expect(column, key).toBeGreaterThan(0);
        // CurrencyPipe is configured for two decimals. Ignore grouping and
        // locale separators without treating an English comma as decimal.
        const value =
          Number(cells[column].textContent!.replace(/[^0-9-]/g, "")) / 100;
        expect(value, key).toBe(input.values[2][key]);
      }
      expect(headers.some((header) => /ROS.*6-/.test(header))).toBe(true);
      expect(headers.some((header) => /ROD.*12-/.test(header))).toBe(true);

      const lineData = charts.instances.find(
        (chart) => chart.type === "line",
      )!.data;
      expect(lineData.labels).toEqual([1, 2]);
      expect(lineData.datasets).toHaveLength(8); // seven instruments + benchmark
      for (const key of keys) {
        expect(
          lineData.datasets.find((dataset) =>
            dataset.label?.startsWith(key.toUpperCase()),
          )?.data,
        ).toEqual([input.values[1][key], input.values[2][key]]);
      }

      const barData = charts.instances.find(
        (chart) => chart.type === "bar",
      )!.data;
      expect(barData.labels).toHaveLength(7);
      const bars = barData.datasets.find((dataset) => dataset.type === "bar")!;
      const benchmark = barData.datasets.find(
        (dataset) => dataset.type === "line",
      )!;
      for (const key of keys) {
        const index = barData.labels!.indexOf(key.toUpperCase());
        expect(index).toBeGreaterThanOrEqual(0);
        expect(bars.data[index], key).toBe(input.values[2][key]);
        expect(benchmark.data[index]).toBe(60000);
      }
      expect(bars.label).toContain(skipTax ? "bez podatku" : "po podatku");
      expect(table.nativeElement.querySelector("h2").textContent).toContain(
        skipTax ? "bez podatku" : "po podatku",
      );
      // The enormous benchmark and earlier-year winner must not win the final ranking.
      expect(summary.componentInstance.highestBond()).toMatchObject({
        bond: "ROD",
        value: 10707.77,
        year: 2,
        futureValue: 60000,
      });
      expect(summary.nativeElement.textContent).toContain("niedobór");
      expect(input).toEqual({ ...result, skipTax }); // consumers must not mutate results
    });
  }

  for (const ike of [false, true])
    for (const familyEligible of [false, true]) {
      it(`uses identical eligible types in all views: ${JSON.stringify({ ike, familyEligible })}`, async () => {
        const input = structuredClone(result);
        input.activeBondTypes = availablePolishBonds({ ike, familyEligible });
        input.skipTax = ike;
        input.values[2].ros = 90000;
        input.values[2].rod = 80000;
        const table = TestBed.createComponent(TreasuryBondsResultsComponent);
        const summary = TestBed.createComponent(
          TreasuryBondsResultsDescriptionComponent,
        );
        const line = TestBed.createComponent(TreasuryBondsChartComponent);
        const bar = TestBed.createComponent(TreasuryBondsFinalChartComponent);
        table.componentRef.setInput("results", input);
        summary.componentRef.setInput("data", input);
        line.componentRef.setInput("data", input);
        bar.componentRef.setInput("data", input);
        await Promise.all([
          table.whenStable(),
          summary.whenStable(),
          line.whenStable(),
          bar.whenStable(),
        ]);
        const familyVisible = familyEligible && !ike;
        expect(table.nativeElement.querySelectorAll("thead th")).toHaveLength(
          familyVisible ? 9 : 7,
        );
        expect(
          charts.instances.find((chart) => chart.type === "line")!.data
            .datasets,
        ).toHaveLength(familyVisible ? 8 : 6);
        expect(
          charts.instances.find((chart) => chart.type === "bar")!.data.labels,
        ).toHaveLength(familyVisible ? 7 : 5);
        expect(summary.componentInstance.highestBond()?.bond).toBe(
          familyVisible ? "ROS" : "EDO",
        );
        for (const key of ["ROS", "ROD"]) {
          expect(
            table.nativeElement
              .querySelector("thead")
              .textContent.includes(key),
          ).toBe(familyVisible);
          expect(
            charts.instances
              .find((chart) => chart.type === "line")!
              .data.datasets.some((dataset) => dataset.label?.startsWith(key)),
          ).toBe(familyVisible);
          expect(
            charts.instances
              .find((chart) => chart.type === "bar")!
              .data.labels!.includes(key),
          ).toBe(familyVisible);
        }
      });
    }

  for (const key of keys) {
    it(`can select ${key.toUpperCase()} as winner without confusing it with the inflation benchmark`, async () => {
      const input = structuredClone(result);
      input.values[2][key] = 70000;
      const fixture = TestBed.createComponent(
        TreasuryBondsResultsDescriptionComponent,
      );
      fixture.componentRef.setInput("data", input);
      await fixture.whenStable();
      expect(fixture.componentInstance.highestBond()?.bond).toBe(
        key.toUpperCase(),
      );
      expect(fixture.nativeElement.textContent).toContain("nadwyżka");
    });
  }

  it("updates the existing charts after recalculation and destroys them with the view", async () => {
    const line = TestBed.createComponent(TreasuryBondsChartComponent);
    const bar = TestBed.createComponent(TreasuryBondsFinalChartComponent);
    line.componentRef.setInput("data", structuredClone(result));
    bar.componentRef.setInput("data", structuredClone(result));
    await Promise.all([line.whenStable(), bar.whenStable()]);
    const instances = [...charts.instances];
    expect(instances).toHaveLength(2);
    const updated = structuredClone(result);
    updated.skipTax = true;
    updated.values[2].ros = 12345.67;
    line.componentRef.setInput("data", updated);
    bar.componentRef.setInput("data", updated);
    await Promise.all([line.whenStable(), bar.whenStable()]);
    expect(charts.instances).toEqual(instances);
    const lineData = instances.find((chart) => chart.type === "line")!.data;
    expect(
      lineData.datasets
        .find((dataset) => dataset.label?.startsWith("ROS"))
        ?.data.at(-1),
    ).toBe(12345.67);
    const barData = instances.find((chart) => chart.type === "bar")!.data;
    expect(
      barData.datasets.find((dataset) => dataset.type === "bar")?.data[
        barData.labels!.indexOf("ROS")
      ],
    ).toBe(12345.67);
    for (const instance of instances)
      expect(instance.update).toHaveBeenCalled();
    line.destroy();
    bar.destroy();
    for (const instance of instances)
      expect(instance.destroy).toHaveBeenCalledOnce();
  });
});
