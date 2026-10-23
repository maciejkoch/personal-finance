import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { RegularContributionFormComponent } from "./regular-contribution/ui/regular-contribution-form/regular-contribution-form.component";
import { LongTermSavingsFormComponent } from "./long-term-savings/ui/long-term-savings-form/long-term-savings-form.component";

const settle = () => new Promise((resolve) => setTimeout(resolve, 350));

describe("Calculator Signal Forms", () => {
  beforeEach(() => localStorage.clear());

  for (const component of [
    RegularContributionFormComponent,
    LongTermSavingsFormComponent,
  ]) {
    it(`blocks fractional and oversized periods in ${component.name}`, async () => {
      const fixture = TestBed.createComponent<
        RegularContributionFormComponent | LongTermSavingsFormComponent
      >(component);
      await fixture.whenStable();
      for (const duration of [1.5, 101]) {
        fixture.componentInstance.form.duration().value.set(duration);
        await fixture.whenStable();
        expect(fixture.componentInstance.form().invalid()).toBe(true);
      }
      fixture.componentInstance.form.duration().value.set(100);
      await fixture.whenStable();
      expect(fixture.componentInstance.form().valid()).toBe(true);
    });
  }

  it("restores regular contributions, emits the existing contract and preserves disabled values", async () => {
    const saved = {
      contribution: 500,
      duration: 2,
      rate: 5,
      skipRate: false,
      skipTax: true,
    };
    localStorage.setItem("regular-contribution-form", JSON.stringify(saved));
    const fixture = TestBed.createComponent(RegularContributionFormComponent);
    const component = fixture.componentInstance;
    const received = vi.fn();
    component.changed.subscribe(received);
    await fixture.whenStable();
    await settle();
    expect(component.model()).toEqual(saved);
    expect(received).toHaveBeenLastCalledWith(saved);
    component.model.update((value) => ({ ...value, skipRate: true }));
    await fixture.whenStable();
    await settle();
    expect(component.form.rate().disabled()).toBe(true);
    expect(component.form.skipTax().disabled()).toBe(true);
    expect(
      fixture.nativeElement.querySelector(
        'input[type="number"][placeholder="10"]',
      ).disabled,
    ).toBe(false);
    expect(received).toHaveBeenLastCalledWith({
      ...saved,
      skipRate: true,
    });
    component.model.update((value) => ({ ...value, skipRate: false }));
    await fixture.whenStable();
    expect(component.form.rate().disabled()).toBe(false);
    expect(component.model().rate).toBe(5);
    expect(component.model().skipTax).toBe(true);
  });

  it("blocks invalid regular contributions and only persists the final debounced request", async () => {
    const fixture = TestBed.createComponent(RegularContributionFormComponent);
    const component = fixture.componentInstance;
    const received = vi.fn();
    component.changed.subscribe(received);
    component.model.update((value) => ({ ...value, contribution: 0 }));
    await fixture.whenStable();
    await settle();
    expect(component.form().invalid()).toBe(true);
    expect(received).not.toHaveBeenCalled();
    component.model.update((value) => ({ ...value, contribution: 500 }));
    await fixture.whenStable();
    component.model.update((value) => ({ ...value, contribution: 600 }));
    await fixture.whenStable();
    await settle();
    expect(received).toHaveBeenCalledTimes(1);
    expect(received).toHaveBeenLastCalledWith(
      expect.objectContaining({ contribution: 600 }),
    );
    expect(
      JSON.parse(localStorage.getItem("regular-contribution-form")!)
        .contribution,
    ).toBe(600);
  });

  it("restores the savings goal and reacts to skip flags without losing assumptions", async () => {
    const saved = {
      amount: 10000,
      duration: 2,
      inflation: 3,
      rate: 5,
      skipInflation: false,
      skipRate: false,
      skipTax: false,
    };
    localStorage.setItem("long-term-savings-form", JSON.stringify(saved));
    const fixture = TestBed.createComponent(LongTermSavingsFormComponent);
    const component = fixture.componentInstance;
    const received = vi.fn();
    component.changed.subscribe(received);
    await fixture.whenStable();
    await settle();
    expect(component.model()).toEqual(saved);
    expect(received).toHaveBeenLastCalledWith(saved);
    component.model.update((value) => ({
      ...value,
      skipInflation: true,
      skipRate: true,
    }));
    await fixture.whenStable();
    await settle();
    expect(component.form.inflation().disabled()).toBe(true);
    expect(component.form.rate().disabled()).toBe(true);
    expect(component.form.skipTax().disabled()).toBe(true);
    expect(received).toHaveBeenLastCalledWith({
      ...saved,
      skipInflation: true,
      skipRate: true,
    });
    component.model.update((value) => ({
      ...value,
      skipInflation: false,
      skipRate: false,
    }));
    await fixture.whenStable();
    expect(component.form.inflation().disabled()).toBe(false);
    expect(component.form.rate().disabled()).toBe(false);
    expect(component.model().inflation).toBe(3);
    expect(component.model().rate).toBe(5);
  });

  it("blocks an empty goal input and does not overwrite saved settings", async () => {
    const fixture = TestBed.createComponent(LongTermSavingsFormComponent);
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
    expect(localStorage.getItem("long-term-savings-form")).toBeNull();
  });
});
