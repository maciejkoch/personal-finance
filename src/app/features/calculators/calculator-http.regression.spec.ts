import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import { LongTermSavingsDataService } from "./long-term-savings/data/long-term-savings-data.service";
import { RegularContributionDataService } from "./regular-contribution/data/regular-contribution-data.service";
import { TreasuryBondsDataService } from "./treasury-bonds/data/treasury-bonds-data.service";
import * as offer from "@data/bond-offer";

describe("Calculator HTTP assumption regressions", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: API_ENDPOINTS,
          useValue: {
            savings: "/savings",
            regularContribution: "/contributions",
            treasuryBonds: "/bonds",
          },
        },
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  for (const skipTax of [false, true]) {
    for (const skipRate of [false, true]) {
      it(`contributions sends effective rate and preserves tax preference: skipRate=${skipRate}, skipTax=${skipTax}`, () => {
        const request = {
          contribution: 500.01,
          duration: 2,
          rate: 6.25,
          skipRate,
          skipTax,
        };
        const received = vi.fn();
        TestBed.inject(RegularContributionDataService)
          .calculate(request)
          .subscribe(received);
        const pending = TestBed.inject(HttpTestingController).expectOne(
          (r) => r.url.split("?")[0] === "/contributions",
        );
        const query = new URL(
          pending.request.urlWithParams,
          "https://test.invalid",
        ).searchParams;
        expect(Object.fromEntries(query)).toEqual({
          contribution: "500.01",
          duration: "2",
          rate: skipRate ? "0" : "0.0625",
          skipTax: String(skipTax),
        });
        pending.flush({
          data: { finalValue: 12345.67, tax: skipTax ? 0 : 12.34 },
        });
        expect(received).toHaveBeenCalledExactlyOnceWith({
          ...request,
          finalValue: 12345.67,
          tax: skipTax ? 0 : 12.34,
        });
      });
      for (const skipInflation of [false, true]) {
        it(`goal sends effective inflation and rate without losing preferences: ${JSON.stringify({ skipInflation, skipRate, skipTax })}`, () => {
          const request = {
            amount: 150000.01,
            duration: 15,
            inflation: 3.5,
            rate: 6.25,
            skipInflation,
            skipRate,
            skipTax,
          };
          const received = vi.fn();
          TestBed.inject(LongTermSavingsDataService)
            .calculate(request)
            .subscribe(received);
          const pending = TestBed.inject(HttpTestingController).expectOne(
            (r) => r.url.split("?")[0] === "/savings",
          );
          const query = new URL(
            pending.request.urlWithParams,
            "https://test.invalid",
          ).searchParams;
          expect(Object.fromEntries(query)).toEqual({
            amount: "150000.01",
            duration: "15",
            inflation: skipInflation ? "0" : "0.035",
            rate: skipRate ? "0" : "0.0625",
            skipTax: String(skipTax),
          });
          pending.flush({
            data: { monthlyContribution: 1000.23, tax: skipTax ? 0 : 12.34 },
          });
          expect(received).toHaveBeenCalledExactlyOnceWith({
            ...request,
            monthlyContribution: 1000.23,
            tax: skipTax ? 0 : 12.34,
          });
        });
      }
    }
    it(`bonds serializes every scenario array and accepts matching API versions: skipTax=${skipTax}`, () => {
      const request = {
        numberOfBonds: 13,
        month: 24,
        inflation: [0, -0.02],
        referenceRate: [0.04, 0],
        savingsRate: [0.02, 0],
        wibor6m: [0],
        skipTax,
      };
      const received = vi.fn();
      TestBed.inject(TreasuryBondsDataService)
        .calculate(request)
        .subscribe(received);
      const pending = TestBed.inject(HttpTestingController).expectOne(
        (r) => r.url === "/bonds",
      );
      expect(
        Object.fromEntries(
          pending.request.params
            .keys()
            .map((key) => [key, pending.request.params.get(key)]),
        ),
      ).toEqual({
        numberOfBonds: "13",
        month: "24",
        inflation: "[0,-0.02]",
        referenceRate: "[0.04,0]",
        savingsRate: "[0.02,0]",
        wibor6m: "[0]",
        skipTax: String(skipTax),
      });
      const payload = {
        values: [{ month: 24, ror: 1234.56 }],
        offerVersion: offer.version,
        calculationVersion: 2,
      };
      pending.flush({ data: payload });
      expect(received).toHaveBeenCalledExactlyOnceWith({
        ...payload,
        ...request,
      });
    });
  }

  it("requests the new bond contract for IKE and accepts only the matching tax-free series", () => {
    const next = vi.fn();
    const request = {
      numberOfBonds: 1,
      month: 12,
      inflation: [0],
      referenceRate: [0],
      savingsRate: [0],
      wibor6m: [0],
      skipTax: false,
      ike: true,
      familyEligible: true,
    };
    TestBed.inject(TreasuryBondsDataService).calculate(request).subscribe(next);
    const pending = TestBed.inject(HttpTestingController).expectOne(
      (r) => r.url === "/bonds",
    );
    expect(pending.request.params.get("contractVersion")).toBe("3");
    expect(pending.request.params.get("ike")).toBe("true");
    const points = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      value: 100,
    }));
    pending.flush({
      data: {
        contractVersion: 3,
        calculationVersion: 2,
        offerVersion: offer.version,
        marketId: "pl",
        skipTax: true,
        benchmark: points,
        series: ["ror", "dor", "tos", "coi", "edo"].map((instrumentId) => ({
          instrumentId,
          currency: "PLN",
          points,
        })),
      },
    });
    expect(next).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        skipTax: true,
        activeBondTypes: ["ror", "dor", "tos", "coi", "edo"],
      }),
    );
  });

  it("rejects incompatible calculation versions even when the offer version matches", () => {
    const next = vi.fn(),
      error = vi.fn();
    TestBed.inject(TreasuryBondsDataService)
      .calculate({
        numberOfBonds: 1,
        month: 12,
        inflation: [0],
        referenceRate: [0],
        savingsRate: [0],
        wibor6m: [0],
        skipTax: false,
      })
      .subscribe({ next, error });
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url === "/bonds")
      .flush({
        data: {
          values: [],
          offerVersion: offer.version,
          calculationVersion: 999,
        },
      });
    expect(next).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledOnce();
  });
});
