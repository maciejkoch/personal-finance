import { TestBed } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { provideRouter } from "@angular/router";

describe("AppComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it("keeps calculators reachable through navigation", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    for (const path of [
      "treasury-bonds",
      "regular-contribution",
      "long-term-savings",
    ]) {
      expect(
        compiled.querySelector(`a[href="/calculators/${path}"]`),
      ).not.toBeNull();
    }
    expect(compiled.querySelector("router-outlet")).not.toBeNull();
  });
});
