import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { InflationService } from "./inflation.service";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import { inflationTestData } from "./inflation.testing";

describe("Inflation HTTP", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_ENDPOINTS, useValue: { inflation: "/inflation" } },
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it("validates the current response and preserves the last reading after a failed refresh", async () => {
    const service = TestBed.inject(InflationService),
      http = TestBed.inject(HttpTestingController);
    const first = service.load();
    http.expectOne("/inflation").flush({ data: inflationTestData(4.1) });
    await first;
    expect(service.current()?.point.ratePercent).toBe(4.1);
    const retry = service.load();
    http
      .expectOne("/inflation")
      .flush({}, { status: 503, statusText: "Unavailable" });
    await retry;
    expect(service.error()).toBe(true);
    expect(service.current()?.point.ratePercent).toBe(4.1);
  });
  it("pins history pages to one generation and rejects a mismatched response", async () => {
    const service = TestBed.inject(InflationService),
      http = TestBed.inject(HttpTestingController);
    const id = "a".repeat(64),
      point = inflationTestData().point;
    const history = service.history(id);
    http
      .expectOne(
        (r) => r.params.get("datasetId") === id && !r.params.has("cursor"),
      )
      .flush({
        data: {
          schemaVersion: 1,
          datasetId: id,
          points: [point],
          nextCursor: point.period,
        },
      });
    await Promise.resolve();
    await Promise.resolve();
    http
      .expectOne((r) => r.params.get("cursor") === point.period)
      .flush({
        data: {
          schemaVersion: 1,
          datasetId: "b".repeat(64),
          points: [],
          nextCursor: null,
        },
      });
    await expect(history).rejects.toThrow("Inconsistent history");
  });
});
