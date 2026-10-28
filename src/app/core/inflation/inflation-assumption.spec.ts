import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { InflationService } from "./inflation.service";
import { inflationTestData } from "./inflation.testing";
import { type CurrentInflation } from "@contracts/inflation";
import { TreasuryBondsFormComponent } from "@features/calculators/treasury-bonds/ui/treasury-bonds-form/treasury-bonds-form.component";
import { LongTermSavingsFormComponent } from "@features/calculators/long-term-savings/ui/long-term-savings-form/long-term-savings-form.component";
import { FireComponent } from "@features/calculators/fire/fire.component";
import {
  bondFormDefaults,
  serializeBondForm,
} from "@features/calculators/treasury-bonds/model/treasury-bonds-form-state";
import { vi } from "vitest";

describe("Current inflation and custom assumptions", () => {
  let current: ReturnType<typeof signal<CurrentInflation | null>>;
  beforeEach(() => {
    localStorage.clear();
    current = signal<CurrentInflation | null>(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: InflationService,
          useValue: {
            current,
            loading: signal(false),
            error: signal(false),
            load: vi.fn(),
          },
        },
      ],
    });
  });
  it("waits for the source and never calculates with the former default", async () => {
    const f = TestBed.createComponent(TreasuryBondsFormComponent);
    const changed = vi.fn();
    f.componentInstance.changed.subscribe(changed);
    await f.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(changed).not.toHaveBeenCalled();
    current.set(inflationTestData(4.1));
    await f.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(changed.mock.lastCall?.[0].inflation[0]).toBeCloseTo(0.041, 10);
  });
  it("does not let a delayed response overwrite an edit, including editing the same number", async () => {
    const f = TestBed.createComponent(TreasuryBondsFormComponent);
    await f.whenStable();
    const input: HTMLInputElement = f.nativeElement.querySelector(
      "#treasury-bonds-inflation",
    );
    input.value = "3.5";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    current.set(inflationTestData(4.1));
    await f.whenStable();
    expect(f.componentInstance.model().inflation).toBe(3.5);
    expect(f.componentInstance.inflation.mode()).toBe("custom");
    f.nativeElement.querySelector("pf-inflation-reference button").click();
    await f.whenStable();
    expect(f.componentInstance.model().inflation).toBe(4.1);
    expect(f.componentInstance.inflation.mode()).toBe("current");
    input.value = "4.1";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    current.set(inflationTestData(4.2));
    await f.whenStable();
    expect(f.componentInstance.model().inflation).toBe(4.1);
  });
  it("preserves legacy custom values and other fields, then reset returns to current GUS", async () => {
    localStorage.setItem(
      "treasury-bonds-form",
      serializeBondForm({ ...bondFormDefaults, inflation: 7, duration: 3 }),
    );
    current.set(inflationTestData(-0.5));
    const f = TestBed.createComponent(TreasuryBondsFormComponent);
    await f.whenStable();
    expect(f.componentInstance.model().inflation).toBe(7);
    expect(f.componentInstance.model().duration).toBe(3);
    f.componentInstance.resetToCurrentDefaults();
    await f.whenStable();
    expect(f.componentInstance.model().inflation).toBe(-0.5);
  });
  it("restores current mode after refresh and restores a custom edit independently", async () => {
    current.set(inflationTestData(4.1));
    const first = TestBed.createComponent(TreasuryBondsFormComponent);
    await first.whenStable();
    first.destroy();
    current.set(inflationTestData(4.2));
    const second = TestBed.createComponent(TreasuryBondsFormComponent);
    await second.whenStable();
    expect(second.componentInstance.model().inflation).toBe(4.2);
    const input: HTMLInputElement = second.nativeElement.querySelector(
      "#treasury-bonds-inflation",
    );
    input.value = "6";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await second.whenStable();
    second.destroy();
    current.set(inflationTestData(4.3));
    const third = TestBed.createComponent(TreasuryBondsFormComponent);
    await third.whenStable();
    expect(third.componentInstance.model().inflation).toBe(6);
  });
  it("does not replace other changes while a default is loading", async () => {
    const f = TestBed.createComponent(LongTermSavingsFormComponent);
    await f.whenStable();
    f.componentInstance.model.update((v) => ({
      ...v,
      duration: 30,
      initialCapital: 12000,
    }));
    current.set(inflationTestData(-0.5));
    await f.whenStable();
    expect(f.componentInstance.model()).toMatchObject({
      inflation: -0.5,
      duration: 30,
      initialCapital: 12000,
    });
    expect(f.componentInstance.form().valid()).toBe(true);
    f.componentInstance.model.update((v) => ({ ...v, skipInflation: true }));
    await f.whenStable();
    expect(
      f.nativeElement.querySelector("pf-inflation-reference button"),
    ).toBeNull();
    expect(f.componentInstance.model().inflation).toBe(-0.5);
  });
  it("FIRE starts after a source response and accepts deflation", async () => {
    const f = TestBed.createComponent(FireComponent);
    await f.whenStable();
    expect(f.componentInstance.result()).toBeNull();
    current.set(inflationTestData(-0.5));
    await f.whenStable();
    expect(f.componentInstance.result()).not.toBeNull();
    expect(f.componentInstance.model().inflation).toBe(-0.5);
  });
});
