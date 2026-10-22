import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { TreasuryBondsResult } from "../model/treasury-bonds.model";
import { TreasuryBondsResultsComponent } from "./treasury-bonds-results/treasury-bonds-results.component";
import { TreasuryBondsResultsDescriptionComponent } from "./treasury-bonds-results-description/treasury-bonds-results-description.component";

const result: TreasuryBondsResult = {
  numberOfBonds: 100,
  month: 12,
  inflation: [0.035],
  referenceRate: [0.04],
  savingsRate: [0],
  wibor6m: [0],
  skipTax: false,
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

describe("Stable results during slow recalculation", () => {
  it("keeps the same table mounted beyond the delayed-loader threshold", fakeAsync(() => {
    const fixture = TestBed.createComponent(TreasuryBondsResultsComponent);
    fixture.componentRef.setInput("results", result);
    fixture.componentRef.setInput("loading", false);
    fixture.autoDetectChanges();
    tick(1001);
    const table = fixture.nativeElement.querySelector("table");
    expect(table).not.toBeNull();
    fixture.componentRef.setInput("loading", true);
    tick(600);
    expect(fixture.nativeElement.querySelector("table")).toBe(table);
    expect(fixture.nativeElement.querySelector(".skeleton")).toBeNull();
    fixture.destroy();
  }));

  it("keeps the summary mounted instead of replacing it with a shorter skeleton", fakeAsync(() => {
    const fixture = TestBed.createComponent(
      TreasuryBondsResultsDescriptionComponent,
    );
    fixture.componentRef.setInput("data", result);
    fixture.componentRef.setInput("loading", false);
    fixture.autoDetectChanges();
    tick(1001);
    const summary = fixture.nativeElement.querySelector("p");
    expect(summary).not.toBeNull();
    fixture.componentRef.setInput("loading", true);
    tick(600);
    expect(fixture.nativeElement.querySelector("p")).toBe(summary);
    expect(fixture.nativeElement.querySelector(".skeleton")).toBeNull();
    fixture.destroy();
  }));
});
