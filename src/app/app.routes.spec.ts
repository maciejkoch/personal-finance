import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { legacyPageRedirects } from "./app.routes";

@Component({ template: "" })
class DestinationComponent {}

const migrations = [
  ["/calculators", "/kalkulatory/obligacje-skarbowe"],
  ["/calculators/treasury-bonds", "/kalkulatory/obligacje-skarbowe"],
  ["/calculators/regular-contribution", "/kalkulatory/regularne-oszczedzanie"],
  ["/calculators/long-term-savings", "/kalkulatory/oszczedzanie-na-cel"],
  ["/about-us", "/o-nas"],
];

describe("Polish public URL migration", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          ...legacyPageRedirects,
          ...Array.from(new Set(migrations.map(([, target]) => target))).map(
            (path) => ({
              path: path.slice(1),
              component: DestinationComponent,
            }),
          ),
          { path: "**", component: DestinationComponent },
        ]),
      ],
    });
  });

  for (const [source, destination] of migrations) {
    it(`redirects ${source} and preserves query parameters and fragment`, async () => {
      const harness = await RouterTestingHarness.create();
      for (const suffix of ["", "/"]) {
        await harness.navigateByUrl(
          `${source}${suffix}?utm_source=poradnik&kwota=100#formularz`,
        );
        expect(TestBed.inject(Router).url).toBe(
          `${destination}?utm_source=poradnik&kwota=100#formularz`,
        );
      }
    });
  }

  it("does not turn an unknown legacy page into an unrelated calculator", async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl("/calculators/nieistniejacy");
    expect(TestBed.inject(Router).url).toBe("/calculators/nieistniejacy");
  });
});
