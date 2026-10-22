import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { TreasuryBondsFormComponent } from "./treasury-bonds-form.component";
import {
  bondFormDefaults,
  BOND_STORAGE_KEY,
} from "../../model/treasury-bonds-form-state";

describe("Bond form API contract", () => {
  beforeEach(() => localStorage.clear());

  it("converts years to months and sends skipTax, without a WIBOR assumption", fakeAsync(() => {
    const fixture = TestBed.createComponent(TreasuryBondsFormComponent);
    const received = jest.fn();
    fixture.componentInstance.changed.subscribe(received);
    fixture.componentInstance.form.patchValue({ duration: 12, skipTax: true });
    tick(301);
    expect(received).toHaveBeenLastCalledWith(
      expect.objectContaining({ month: 144, skipTax: true, wibor6m: [0] }),
    );
    expect(JSON.parse(localStorage.getItem(BOND_STORAGE_KEY)!)).toMatchObject({
      schemaVersion: 2,
    });
    fixture.destroy();
  }));

  it("blocks fractions and out-of-range years, and reset emits current defaults", fakeAsync(() => {
    const fixture = TestBed.createComponent(TreasuryBondsFormComponent);
    const received = jest.fn();
    fixture.componentInstance.changed.subscribe(received);
    for (const duration of [0, 13, 144, 1.5]) {
      fixture.componentInstance.form.patchValue({ duration });
      tick(301);
      expect(fixture.componentInstance.form.invalid).toBe(true);
    }
    expect(received).not.toHaveBeenCalled();
    fixture.componentInstance.form.patchValue({
      numberOfBonds: 1.5,
      duration: 1,
    });
    tick(301);
    expect(received).not.toHaveBeenCalled();
    fixture.componentInstance.resetToCurrentDefaults();
    tick(301);
    expect(fixture.componentInstance.form.getRawValue()).toEqual(
      bondFormDefaults,
    );
    expect(received).toHaveBeenCalledTimes(1);
    fixture.destroy();
  }));
});
