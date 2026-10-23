import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { vi } from "vitest";
import { NavigationComponent } from "./navigation.component";

@Component({ template: "" })
class TestPageComponent {}

describe("Navigation submenus", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: "**", component: TestPageComponent }]),
      ],
    }),
  );

  it("should create", async () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("closes the desktop submenu on Escape or link selection and returns keyboard focus", async () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    fixture.componentRef.setInput("desktop", true);
    const navigated = vi.fn();
    fixture.componentInstance.navigated.subscribe(navigated);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const groups = root.querySelectorAll("details");
    expect(
      Array.from(groups, (group) =>
        group.querySelector("summary")!.textContent!.trim(),
      ),
    ).toEqual(["Kalkulatory", "Poradniki"]);
    expect(root.querySelector("ul")!.children).toHaveLength(3);
    const guides = groups[1];
    const summary = guides.querySelector("summary")!;
    summary.click();
    await fixture.whenStable();
    expect(guides.open).toBe(true);
    summary.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await fixture.whenStable();
    expect(guides.open).toBe(false);
    expect(document.activeElement).toBe(summary);
    summary.click();
    guides.querySelector("a")!.click();
    await fixture.whenStable();
    expect(guides.open).toBe(false);
    expect(navigated).toHaveBeenCalledTimes(1);
  });

  it("opens the same guide links in the mobile submenu and reports navigation to the header", async () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    const navigated = vi.fn();
    fixture.componentInstance.navigated.subscribe(navigated);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector("ul")!.children).toHaveLength(3);
    const button = Array.from(root.querySelectorAll("button")).find(
      (button) => button.textContent!.trim() === "Poradniki",
    )!;
    expect(button.getAttribute("aria-expanded")).toBe("false");
    button.click();
    await fixture.whenStable();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const submenu = button.nextElementSibling!;
    expect(submenu.hasAttribute("inert")).toBe(false);
    expect(
      Array.from(submenu.querySelectorAll("a"), (link) =>
        link.getAttribute("href"),
      ),
    ).toEqual(["/kalkulator-obligacji-skarbowych", "/oszczedzaj-regularnie"]);
    submenu.querySelector("a")!.click();
    await fixture.whenStable();
    expect(navigated).toHaveBeenCalledTimes(1);
  });
});
