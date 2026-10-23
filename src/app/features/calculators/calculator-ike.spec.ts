import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { RegularContributionFormComponent } from "./regular-contribution/ui/regular-contribution-form/regular-contribution-form.component";
import { LongTermSavingsFormComponent } from "./long-term-savings/ui/long-term-savings-form/long-term-savings-form.component";
import { TreasuryBondsFormComponent } from "./treasury-bonds/ui/treasury-bonds-form/treasury-bonds-form.component";
import {
  BOND_STORAGE_KEY,
  readBondForm,
  serializeBondForm,
  bondFormDefaults,
} from "./treasury-bonds/model/treasury-bonds-form-state";

const settle = () => new Promise((resolve) => setTimeout(resolve, 330));

describe("Simplified IKE preferences", () => {
  beforeEach(() => localStorage.clear());

  for (const component of [TreasuryBondsFormComponent]) {
    for (const manual of [false, true]) {
      it(`${component.name}: forces a checked disabled tax control and restores manual=${manual}`, async () => {
        const fixture = TestBed.createComponent(component);
        const form = fixture.componentInstance.form;
        const changed = vi.fn();
        fixture.componentInstance.changed.subscribe(changed);
        form.skipTax().value.set(manual);
        form.ike().value.set(true);
        await fixture.whenStable();
        await settle();
        const label = Array.from(
          fixture.nativeElement.querySelectorAll(
            "pf-tax-options label",
          ) as NodeListOf<HTMLLabelElement>,
        ).find((label) => label.textContent?.includes("Pomiń podatek"))!;
        expect(label.querySelector("input")!.checked).toBe(true);
        expect(label.querySelector("input")!.disabled).toBe(true);
        expect(form.skipTax().value()).toBe(manual);
        expect(changed).toHaveBeenLastCalledWith(
          expect.objectContaining({ ike: true, skipTax: true }),
        );
        form.ike().value.set(false);
        await fixture.whenStable();
        await settle();
        expect(form.skipTax().value()).toBe(manual);
        expect(form.skipTax().disabled()).toBe(false);
        expect(changed).toHaveBeenLastCalledWith(
          expect.objectContaining({ ike: false, skipTax: manual }),
        );
      });
    }
  }

  for (const { component, storageKey, saved } of [
    {
      component: RegularContributionFormComponent,
      storageKey: "regular-contribution-form",
      saved: { contribution: 500, duration: 2, rate: 5, skipRate: false },
    },
    {
      component: LongTermSavingsFormComponent,
      storageKey: "long-term-savings-form",
      saved: {
        amount: 10000,
        duration: 2,
        rate: 5,
        skipRate: false,
        inflation: 3,
        skipInflation: false,
      },
    },
  ]) {
    it(`${component.name}: one tax/IKE checkbox controls tax and preserves its value when returns are disabled`, async () => {
      const fixture = TestBed.createComponent<
        RegularContributionFormComponent | LongTermSavingsFormComponent
      >(component);
      await fixture.whenStable();
      const changed = vi.fn();
      fixture.componentInstance.changed.subscribe(changed);
      const controls = fixture.nativeElement.querySelectorAll(
        "pf-tax-options input",
      ) as NodeListOf<HTMLInputElement>;
      expect(controls).toHaveLength(1);
      expect(
        fixture.nativeElement.querySelector("pf-tax-options").textContent,
      ).toContain("Pomiń podatek Belki / symuluj IKE");
      controls[0].click();
      await fixture.whenStable();
      await settle();
      expect(changed).toHaveBeenLastCalledWith(
        expect.objectContaining({ skipTax: true }),
      );
      expect(changed.mock.lastCall![0]).not.toHaveProperty("ike");
      fixture.componentInstance.form.skipRate().value.set(true);
      await fixture.whenStable();
      expect(controls[0].disabled).toBe(true);
      expect(controls[0].checked).toBe(true);
      fixture.componentInstance.form.skipRate().value.set(false);
      await fixture.whenStable();
      expect(controls[0].disabled).toBe(false);
      controls[0].click();
      await fixture.whenStable();
      await settle();
      expect(changed).toHaveBeenLastCalledWith(
        expect.objectContaining({ skipTax: false }),
      );
      expect(JSON.parse(localStorage.getItem(storageKey)!)).not.toHaveProperty(
        "ike",
      );
      const allCheckboxes = fixture.nativeElement.querySelectorAll(
        'input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      for (const checkbox of allCheckboxes) {
        expect(checkbox.classList.contains("checkbox")).toBe(true);
        expect(checkbox.classList.contains("toggle")).toBe(false);
      }
    });

    for (const ike of [false, true]) {
      for (const skipTax of [false, true]) {
        it(`${component.name}: migrates saved ike=${ike}, skipTax=${skipTax} into a single reversible preference`, async () => {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ ...saved, ike, skipTax }),
          );
          const fixture = TestBed.createComponent<
            RegularContributionFormComponent | LongTermSavingsFormComponent
          >(component);
          await fixture.whenStable();
          expect(fixture.componentInstance.model()).toEqual({
            ...saved,
            skipTax: ike || skipTax,
          });
          fixture.componentInstance.form.skipTax().value.set(false);
          await fixture.whenStable();
          await settle();
          fixture.destroy();
          const restored = TestBed.createComponent<
            RegularContributionFormComponent | LongTermSavingsFormComponent
          >(component);
          await restored.whenStable();
          expect(restored.componentInstance.form.skipTax().value()).toBe(false);
        });
      }
    }
  }

  it("remembers family eligibility while IKE disables it and survives a reload", async () => {
    const fixture = TestBed.createComponent(TreasuryBondsFormComponent);
    const component = fixture.componentInstance;
    component.form.familyEligible().value.set(true);
    component.form.ike().value.set(true);
    await fixture.whenStable();
    await settle();
    expect(component.form.familyEligible().disabled()).toBe(true);
    expect(readBondForm(localStorage.getItem(BOND_STORAGE_KEY))).toMatchObject({
      familyEligible: true,
      ike: true,
      skipTax: false,
    });
    fixture.destroy();
    const restored = TestBed.createComponent(TreasuryBondsFormComponent);
    await restored.whenStable();
    restored.componentInstance.form.ike().value.set(false);
    await restored.whenStable();
    expect(restored.componentInstance.form.familyEligible().value()).toBe(true);
    expect(restored.componentInstance.form.familyEligible().disabled()).toBe(
      false,
    );
  });

  it("preserves all new preferences in schema 3 and migrates a v2 manual tax setting", () => {
    const value = {
      ...bondFormDefaults,
      ike: true,
      familyEligible: true,
      skipTax: false,
    };
    expect(readBondForm(serializeBondForm(value))).toEqual(value);
    expect(
      readBondForm(
        JSON.stringify({
          schemaVersion: 2,
          values: { ...bondFormDefaults, skipTax: true },
        }),
      ),
    ).toEqual({ ...bondFormDefaults, skipTax: true });
  });
});
