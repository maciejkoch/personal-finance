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

  it("keeps calculators reachable through navigation", async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    for (const path of [
      "obligacje-skarbowe",
      "regularne-oszczedzanie",
      "oszczedzanie-na-cel",
    ]) {
      expect(
        compiled.querySelector(`a[href="/kalkulatory/${path}"]`),
      ).not.toBeNull();
    }
    for (const path of [
      "/kalkulator-obligacji-skarbowych",
      "/oszczedzaj-regularnie",
    ]) {
      for (const navigation of ["pf-header", "pf-footer"]) {
        expect(
          compiled.querySelector(`${navigation} a[href="${path}"]`),
        ).not.toBeNull();
      }
    }
    expect(compiled.querySelector("router-outlet")).not.toBeNull();
  });
});
