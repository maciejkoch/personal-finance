import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_ENDPOINTS } from "@pf/shared";
import { ArticleDataService } from "../../../../libs/blog/src/lib/article/data/article-data.service";
import { LongTermSavingsDataService } from "../../../../libs/calculators/src/lib/long-term-savings/data/long-term-savings-data.service";
import { RegularContributionDataService } from "../../../../libs/calculators/src/lib/regular-contribution/data/regular-contribution-data.service";
import { TreasuryBondsDataService } from "../../../../libs/calculators/src/lib/treasury-bonds/data/treasury-bonds-data.service";
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
      .subscribe();
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
      .subscribe();
    const request = http.expectOne((r) =>
      r.url.startsWith(`${environment.apiEndpoints.savings}?`),
    );
    expect(new URL(request.request.url).searchParams.get("rate")).toBe("0.05");
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
      .subscribe();
    const request = http.expectOne((r) =>
      r.url.startsWith(`${environment.apiEndpoints.regularContribution}?`),
    );
    expect(new URL(request.request.url).searchParams.get("rate")).toBe("0");
    request.flush({ data: {} });
  });

  it("loads articles from the selected backend", () => {
    TestBed.inject(ArticleDataService)
      .fetch("kalkulator-obligacji-skarbowych")
      .subscribe();
    const request = http.expectOne(
      `${environment.apiEndpoints.article}?slug=kalkulator-obligacji-skarbowych`,
    );
    request.flush({ html: "<h1>Test article</h1>" });
  });
});
