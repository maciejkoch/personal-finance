import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { describe, expect, it } from "vitest";
import { FireComponent } from "./fire.component";

describe("FIRE form", () => {
  it("updates the result, hides it for invalid input, and resets the example", async () => {
    TestBed.configureTestingModule({
      imports: [FireComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(FireComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector(
      "#fire-expenses",
    ) as HTMLInputElement;
    input.value = "1000";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.result()?.target).toBeCloseTo(
      12000 / 0.035,
    );
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.result()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      "Popraw zaznaczone pola",
    );
    fixture.nativeElement.querySelector("form button").click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.model().expenses).toBe(5000);
    expect(fixture.componentInstance.result()).not.toBeNull();
  });
});
