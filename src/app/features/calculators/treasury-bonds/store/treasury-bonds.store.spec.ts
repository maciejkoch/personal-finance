import { vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
import { TreasuryBondsDataService } from "../data/treasury-bonds-data.service";
import {
  TreasuryBondsRequest,
  TreasuryBondsResult,
} from "../model/treasury-bonds.model";
import { TreasuryBondsStore } from "./treasury-bonds.store";

const request: TreasuryBondsRequest = {
  numberOfBonds: 100,
  month: 12,
  inflation: [0.035],
  referenceRate: [0.04],
  savingsRate: [0],
  wibor6m: [0],
  skipTax: false,
};
const result: TreasuryBondsResult = {
  ...request,
  offerVersion: "2026-10-v1",
  calculationVersion: 2,
  values: [
    {
      month: 12,
      ror: 10320,
      dor: 10270,
      tos: 10275,
      coi: 10184,
      edo: 10190,
      ros: 10243,
      rod: 10210,
      futureValue: 10350,
    },
  ],
};

describe("Bond recalculation", () => {
  let responses: Subject<TreasuryBondsResult>[];
  beforeEach(() => {
    responses = [];
    TestBed.configureTestingModule({
      providers: [
        TreasuryBondsStore,
        {
          provide: TreasuryBondsDataService,
          useValue: {
            calculate: vi.fn(() => {
              const response = new Subject<TreasuryBondsResult>();
              responses.push(response);
              return response;
            }),
          },
        },
      ],
    });
  });

  function showInitialResult() {
    const store = TestBed.inject(TreasuryBondsStore);
    store.calculate(request);
    responses[0].next(result);
    responses[0].complete();
    return store;
  }

  it("keeps the existing result while the next request is pending", () => {
    const store = showInitialResult();
    store.calculate({ ...request, numberOfBonds: 101 });
    expect(store.loading()).toBe(true);
    expect(store.result()).toBe(result);
    const updated = { ...result, numberOfBonds: 101 };
    responses[1].next(updated);
    responses[1].complete();
    expect(store.result()).toBe(updated);
    expect(store.loading()).toBe(false);
  });

  it("ignores cancelled responses while keeping results and the loading state", () => {
    const store = showInitialResult();
    store.calculate({ ...request, month: 24 });
    store.calculate({ ...request, month: 36 });
    responses[1].next({ ...result, month: 24 });
    responses[1].complete();
    expect(store.result()).toBe(result);
    expect(store.loading()).toBe(true);
    responses[2].next({ ...result, month: 36 });
    responses[2].complete();
    expect(store.result()?.month).toBe(36);
    expect(store.loading()).toBe(false);
  });

  it("keeps previous results on failure and labels them as previous calculations", () => {
    const store = showInitialResult();
    store.calculate(request);
    responses[1].error(new Error("offline"));
    expect(store.result()).toBe(result);
    expect(store.error()).toContain("poprzednie obliczenia");
    expect(store.loading()).toBe(false);
  });

  it("reports an initial failure without pretending to have results", () => {
    const store = TestBed.inject(TreasuryBondsStore);
    store.calculate(request);
    responses[0].error(new Error("offline"));
    expect(store.result()).toBeNull();
    expect(store.error()).toContain("Nie udało się pobrać");
    expect(store.loading()).toBe(false);
  });
});
