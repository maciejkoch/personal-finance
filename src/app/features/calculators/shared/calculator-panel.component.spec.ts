import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { CalculatorPanelComponent } from "./calculator-panel.component";
import { LongTermSavingsFormComponent } from "../long-term-savings/ui/long-term-savings-form/long-term-savings-form.component";

describe("Calculator disclosures", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  async function panel(key: string, desktop = false) {
    vi.stubGlobal("matchMedia", () => ({ matches: desktop }));
    const fixture = TestBed.createComponent(CalculatorPanelComponent);
    fixture.componentRef.setInput("label", "Podatek");
    fixture.componentRef.setInput("panelKey", key);
    fixture.componentRef.setInput("desktopOpen", true);
    await fixture.whenStable();
    return fixture;
  }

  it("uses responsive defaults and restores an explicit choice across views", async () => {
    const desktop = await panel("tax", true);
    const details: HTMLDetailsElement =
      desktop.nativeElement.querySelector("details");
    expect(details.open).toBe(true);
    expect(localStorage.getItem("calculator-panel:v1:tax")).toBeNull();
    details.open = false;
    details.dispatchEvent(new Event("toggle"));
    await desktop.whenStable();
    expect(localStorage.getItem("calculator-panel:v1:tax")).toBe("false");
    desktop.destroy();
    const restored = await panel("tax", true);
    expect(restored.nativeElement.querySelector("details").open).toBe(false);
    restored.destroy();
    const mobile = await panel("other-tax", false);
    expect(mobile.nativeElement.querySelector("details").open).toBe(false);
  });

  it("reveals invalid fields without overwriting a saved collapsed preference", async () => {
    localStorage.setItem("calculator-panel:v1:extra", "false");
    const fixture = await panel("extra");
    fixture.componentRef.setInput("reveal", true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector("details").open).toBe(true);
    expect(localStorage.getItem("calculator-panel:v1:extra")).toBe("false");
  });

  it("opens each panel independently", async () => {
    const first = await panel("first");
    const second = await panel("second");
    const details: HTMLDetailsElement =
      first.nativeElement.querySelector("details");
    details.open = true;
    details.dispatchEvent(new Event("toggle"));
    await first.whenStable();
    expect(details.open).toBe(true);
    expect(second.nativeElement.querySelector("details").open).toBe(false);
  });

  it("opens the actual form group with an error and keeps every scenario control grouped", async () => {
    const fixture = TestBed.createComponent(LongTermSavingsFormComponent);
    await fixture.whenStable();
    fixture.componentInstance.model.update((value) => ({
      ...value,
      rate: 101,
    }));
    await fixture.whenStable();
    const rate: HTMLInputElement = fixture.nativeElement.querySelector(
      "#long-term-savings-rate",
    );
    expect(rate.closest("details")?.open).toBe(true);
    expect(rate.getAttribute("aria-invalid")).toBe("true");
    expect(
      fixture.nativeElement.querySelector("#long-term-savings-rate-error")
        .textContent,
    ).toContain("100%");
    for (const input of fixture.nativeElement.querySelectorAll("input")) {
      expect(input.closest("fieldset")).not.toBeNull();
    }
    expect(
      fixture.nativeElement.querySelector("details").textContent,
    ).toContain("101%");
  });
});
