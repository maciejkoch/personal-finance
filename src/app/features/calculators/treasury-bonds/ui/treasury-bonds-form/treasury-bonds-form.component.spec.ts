import { provideRouter } from "@angular/router";
import { provideTestInflation } from "@core/inflation/inflation.testing";
import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { TreasuryBondsFormComponent } from "./treasury-bonds-form.component";
import {
  bondFormDefaults,
  BOND_STORAGE_KEY,
} from "../../model/treasury-bonds-form-state";

const settle = () => new Promise((resolve) => setTimeout(resolve, 350));

describe("Bond Signal Form API contract", () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTestInflation()],
    });
  });

  it("converts years to months and sends skipTax, without a WIBOR assumption", async () => {
    const fixture = TestBed.createComponent(TreasuryBondsFormComponent);
    const received = vi.fn();
    fixture.componentInstance.changed.subscribe(received);
    fixture.componentInstance.model.update((value) => ({
      ...value,
      duration: 12,
      skipTax: true,
    }));
    await fixture.whenStable();
    await settle();
    expect(received).toHaveBeenLastCalledWith(
      expect.objectContaining({ month: 144, skipTax: true, wibor6m: [0] }),
    );
    expect(JSON.parse(localStorage.getItem(BOND_STORAGE_KEY)!)).toMatchObject({
      schemaVersion: 4,
    });
  });

  it("blocks fractions and out-of-range years, and reset emits current defaults", async () => {
    const fixture = TestBed.createComponent(TreasuryBondsFormComponent);
    const component = fixture.componentInstance;
    const received = vi.fn();
    component.changed.subscribe(received);
    for (const duration of [0, 13, 144, 1.5]) {
      component.model.update((value) => ({ ...value, duration }));
      await fixture.whenStable();
      await settle();
      expect(component.form().invalid()).toBe(true);
    }
    component.model.update((value) => ({
      ...value,
      numberOfBonds: 1.5,
      duration: 1,
    }));
    await fixture.whenStable();
    await settle();
    expect(received).not.toHaveBeenCalled();
    component.resetToCurrentDefaults();
    await fixture.whenStable();
    await settle();
    expect(component.model()).toEqual(bondFormDefaults);
    expect(received).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending valid calculation when a field is cleared", async () => {
    const fixture = TestBed.createComponent(TreasuryBondsFormComponent);
    const received = vi.fn();
    fixture.componentInstance.changed.subscribe(received);
    await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[type="number"]',
    );
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await fixture.whenStable();
    await settle();
    expect(fixture.componentInstance.form().invalid()).toBe(true);
    expect(received).not.toHaveBeenCalled();
    expect(localStorage.getItem(BOND_STORAGE_KEY)).toBeNull();
  });
});
