import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import { ArticleDataService } from "@features/articles/article/data/article-data.service";
import { LongTermSavingsDataService } from "@features/calculators/long-term-savings/data/long-term-savings-data.service";
import { RegularContributionDataService } from "@features/calculators/regular-contribution/data/regular-contribution-data.service";
import { TreasuryBondsDataService } from "@features/calculators/treasury-bonds/data/treasury-bonds-data.service";
import { environment } from "../environments/environment.local";

describe("Local API routing", () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_ENDPOINTS, useValue: environment.apiEndpoints },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it("routes bonds to the emulator and retains array serialization", () => {
    TestBed.inject(TreasuryBondsDataService)
      .calculate({
        numberOfBonds: 100,
        skipTax: false,
        month: 24,
        inflation: [0.035],
        referenceRate: [0.0575],
        wibor6m: [0.0584],
        savingsRate: [0.1],
      })
      .subscribe({ error: () => undefined });
    const request = http.expectOne(
      (r) => r.url === environment.apiEndpoints.treasuryBonds,
    );
    expect(request.request.params.get("inflation")).toBe("[0.035]");
    expect(request.request.params.get("month")).toBe("24");
    request.flush({
      data: { values: [], offerVersion: "2026-10-v1", calculationVersion: 2 },
    });
  });

  it("routes savings locally while retaining percentage conversion", () => {
    TestBed.inject(LongTermSavingsDataService)
      .calculate({
        amount: 1000,
        duration: 12,
        inflation: 3,
        rate: 5,
        skipInflation: false,
        skipRate: false,
        skipTax: false,
      })
      .subscribe({ error: () => undefined });
    const request = http.expectOne(
      (r) => r.url === environment.apiEndpoints.savings,
    );
    expect(request.request.params.get("rate")).toBe("0.05");
    request.flush({ data: {} });
  });

  it("routes contributions locally and retains the skip-rate option", () => {
    TestBed.inject(RegularContributionDataService)
      .calculate({
        contribution: 500,
        duration: 12,
        rate: 5,
        skipRate: true,
        skipTax: false,
      })
      .subscribe({ error: () => undefined });
    const request = http.expectOne(
      (r) => r.url === environment.apiEndpoints.regularContribution,
    );
    expect(request.request.params.get("rate")).toBe("0");
    request.flush({ data: {} });
  });

  it("loads articles from the selected backend", () => {
    TestBed.inject(ArticleDataService)
      .fetch("kalkulator-obligacji-skarbowych")
      .subscribe({ error: () => undefined });
    const request = http.expectOne(
      `${environment.apiEndpoints.article}?slug=kalkulator-obligacji-skarbowych`,
    );
    request.flush({ html: "<h1>Test article</h1>" });
  });
});
