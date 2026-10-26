import { TestBed } from "@angular/core/testing";
import { RegularContributionFormComponent } from "./regular-contribution/ui/regular-contribution-form/regular-contribution-form.component";
import { LongTermSavingsFormComponent } from "./long-term-savings/ui/long-term-savings-form/long-term-savings-form.component";
import { TreasuryBondsFormComponent } from "./treasury-bonds/ui/treasury-bonds-form/treasury-bonds-form.component";

describe("Single tax preference", () => {
  beforeEach(() => localStorage.clear());
  for (const component of [
    RegularContributionFormComponent,
    LongTermSavingsFormComponent,
    TreasuryBondsFormComponent,
  ]) {
    it(`${component.name} has a reversible tax option and a link to the methodology explanation`, async () => {
      const fixture = TestBed.createComponent(
        component as typeof RegularContributionFormComponent,
      );
      await fixture.whenStable();
      const controls = fixture.nativeElement.querySelectorAll(
        "pf-tax-options input",
      );
      expect(controls.length).toBe(1);
      expect(
        fixture.nativeElement.querySelector("pf-tax-options label").textContent,
      ).toContain("Pomiń podatek Belki");
      expect(
        fixture.nativeElement.querySelector(
          'pf-tax-options a[href$="#ike-explanation"]',
        ),
      ).not.toBeNull();
      controls[0].click();
      await fixture.whenStable();
      expect(fixture.componentInstance.form.skipTax().value()).toBe(true);
      controls[0].click();
      await fixture.whenStable();
      expect(fixture.componentInstance.form.skipTax().value()).toBe(false);
    });
  }
});
