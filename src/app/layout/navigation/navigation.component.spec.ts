import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
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

  it("uses four desktop links and highlights the section for every child page", async () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    fixture.componentRef.setInput("desktop", true);
    const navigated = vi.fn();
    fixture.componentInstance.navigated.subscribe(navigated);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const links = root.querySelectorAll("a");
    expect(Array.from(links, (link) => link.textContent!.trim())).toEqual([
      "Kalkulatory",
      "Poradniki",
      "Inflacja",
      "O nas",
    ]);
    expect(Array.from(links, (link) => link.getAttribute("href"))).toEqual([
      "/kalkulatory",
      "/kalkulator-obligacji-skarbowych",
      "/inflacja",
      "/o-nas",
    ]);
    expect(root.querySelector("details, summary, button")).toBeNull();
    await TestBed.inject(Router).navigateByUrl(
      "/oszczedzaj-regularnie?zrodlo=menu#opis",
    );
    await fixture.whenStable();
    expect(links[1].classList.contains("text-secondary")).toBe(true);
    expect(links[0].hasAttribute("aria-current")).toBe(false);
    await TestBed.inject(Router).navigateByUrl(
      "/kalkulatory/regularne-oszczedzanie",
    );
    await fixture.whenStable();
    expect(links[0].classList.contains("text-secondary")).toBe(true);
    expect(links[1].hasAttribute("aria-current")).toBe(false);
    links[1].click();
    await fixture.whenStable();
    expect(navigated).toHaveBeenCalledTimes(1);
    expect(links[1].getAttribute("aria-current")).toBe("true");
  });

  it("opens the same guide links in the mobile submenu and reports navigation to the header", async () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    const navigated = vi.fn();
    fixture.componentInstance.navigated.subscribe(navigated);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector("ul")!.children).toHaveLength(4);
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
