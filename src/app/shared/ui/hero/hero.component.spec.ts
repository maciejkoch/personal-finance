import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { HeroComponent } from "./hero.component";

describe("Calculator hero start action", () => {
  it("collapses the introduction before asking the page to scroll, and can be expanded again", async () => {
    const fixture = TestBed.createComponent(HeroComponent);
    fixture.componentRef.setInput("title", "Kalkulator");
    fixture.componentRef.setInput("text", "Opis kalkulatora");
    fixture.componentRef.setInput("buttonLabel", "Rozpocznij");
    const scroll = vi.fn();
    fixture.componentInstance.clicked.subscribe(scroll);
    await fixture.whenStable();
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("button");
    expect(fixture.componentInstance.expanded()).toBe(true);
    buttons[1].click();
    expect(fixture.componentInstance.expanded()).toBe(false);
    expect(scroll).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 350));
    await fixture.whenStable();
    expect(scroll).toHaveBeenCalledOnce();
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");
    buttons[0].click();
    await fixture.whenStable();
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
  });

  it("treats an explicit collapse as collapse even when the hero is already closed", async () => {
    const fixture = TestBed.createComponent(HeroComponent);
    await fixture.whenStable();
    fixture.componentInstance.toggle(false);
    fixture.componentInstance.toggle(false);
    expect(fixture.componentInstance.expanded()).toBe(false);
  });
  it("cancels a delayed scroll when leaving the page before the collapse ends", async () => {
    const fixture = TestBed.createComponent(HeroComponent);
    await fixture.whenStable();
    const emit = vi.spyOn(fixture.componentInstance.clicked, "emit");
    fixture.componentInstance.handleClick();
    fixture.destroy();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(emit).not.toHaveBeenCalled();
  });
});
