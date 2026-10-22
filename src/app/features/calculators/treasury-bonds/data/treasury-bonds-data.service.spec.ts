import { vi } from "vitest";
import { provideHttpClient } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import { TreasuryBondsDataService } from "./treasury-bonds-data.service";

describe("Bond HTTP client", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_ENDPOINTS, useValue: { treasuryBonds: "/bonds" } },
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it("serializes assumptions and rejects a backend with stale offer data", () => {
    const error = vi.fn();
    TestBed.inject(TreasuryBondsDataService)
      .calculate({
        numberOfBonds: 1,
        month: 12,
        inflation: [0.035],
        referenceRate: [0.04],
        savingsRate: [0],
        wibor6m: [0],
        skipTax: true,
      })
      .subscribe({ error });
    const req = TestBed.inject(HttpTestingController).expectOne(
      (r) => r.url === "/bonds",
    );
    expect(req.request.params.get("skipTax")).toBe("true");
    expect(req.request.params.get("inflation")).toBe("[0.035]");
    req.flush({
      data: { values: [], offerVersion: "old", calculationVersion: 2 },
    });
    expect(error).toHaveBeenCalled();
  });
});
