import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import baseline from "@data/bond-offer";
import { Subject, of } from "rxjs";
import { vi } from "vitest";
import { TreasuryBondsComponent } from "./treasury-bonds.component";
import { TreasuryBondsFormComponent } from "./ui/treasury-bonds-form/treasury-bonds-form.component";
import { TreasuryBondsDataService } from "./data/treasury-bonds-data.service";
import { TreasuryBondsResult } from "./model/treasury-bonds.model";

const settle = () => new Promise((resolve) => setTimeout(resolve, 330));
const result: TreasuryBondsResult = {
  numberOfBonds: 100,
  month: 144,
  inflation: [0.035],
  referenceRate: [0.04],
  savingsRate: [0],
  wibor6m: [0],
  skipTax: false,
  familyEligible: false,
  offerVersion: "2026-10-v1",
  calculationVersion: 2,
  values: [],
};

describe("Bond selection during asynchronous recalculation", () => {
  it("keeps results for an amount edit but cancels and clears them immediately for a different tax/eligibility selection", async () => {
    localStorage.clear();
    const responses: Subject<TreasuryBondsResult>[] = [];
    const calculate = vi.fn(() => {
      const response = new Subject<TreasuryBondsResult>();
      responses.push(response);
      return response;
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: TreasuryBondsDataService,
          useValue: {
            calculate,
            catalog: () =>
              of({
                entries: [],
                currentOfferId: "seed",
                stale: false,
                nextCursor: null,
              }),
            offer: () => of({ ...baseline, offerId: "seed" }),
          },
        },
      ],
    });
    TestBed.overrideComponent(TreasuryBondsComponent, {
      set: {
        imports: [TreasuryBondsFormComponent],
        template:
          '<pf-treasury-bonds-form (changed)="calculate($event)" (pending)="invalidate($event)" (optionsChanged)="options.set($event)" />',
      },
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(TreasuryBondsComponent);
    await fixture.whenStable();
    await settle();
    responses[0].next(result);
    responses[0].complete();
    const form = fixture.debugElement.query(
      By.directive(TreasuryBondsFormComponent),
    ).componentInstance as TreasuryBondsFormComponent;
    form.form.numberOfBonds().value.set(101);
    await fixture.whenStable();
    expect(fixture.componentInstance.result()).toBe(result);
    await settle();
    expect(calculate).toHaveBeenCalledTimes(2);
    form.form.skipTax().value.set(true);
    await fixture.whenStable();
    expect(fixture.componentInstance.result()).toBeNull();
    responses[1].next({ ...result, numberOfBonds: 101 });
    responses[1].complete();
    expect(fixture.componentInstance.result()).toBeNull();
    await settle();
    expect(calculate).toHaveBeenLastCalledWith(
      expect.objectContaining({ skipTax: true }),
    );
    responses[2].next({ ...result, skipTax: true });
    responses[2].complete();
    expect(fixture.componentInstance.result()?.skipTax).toBe(true);
    form.form.numberOfBonds().value.set(0);
    await fixture.whenStable();
    await settle();
    expect(fixture.componentInstance.result()).toBeNull();
    expect(calculate).toHaveBeenCalledTimes(3);
  });
});
