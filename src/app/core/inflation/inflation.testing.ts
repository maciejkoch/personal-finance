import { signal } from "@angular/core";
import { InflationService } from "./inflation.service";
import { INFLATION_SOURCE, type CurrentInflation } from "@contracts/inflation";
export function inflationTestData(ratePercent = 3.5): CurrentInflation {
  return {
    schemaVersion: 1,
    series: "PL_CPI_ALL_YOY",
    datasetId: "a".repeat(64),
    readingId: "2026-09-test",
    point: {
      period: "2026-09",
      indexValue: 100 + ratePercent,
      ratePercent,
      flag: "",
    },
    sourcePageUrl: INFLATION_SOURCE,
    checkedAt: "2026-10-28T08:00:00.000Z",
    dataStale: false,
    syncStale: false,
  };
}
export function provideTestInflation() {
  return {
    provide: InflationService,
    useValue: {
      current: signal(inflationTestData()),
      loading: signal(false),
      error: signal(false),
      load: async () => {},
    },
  };
}
