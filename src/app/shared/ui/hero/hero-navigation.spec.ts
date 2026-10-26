import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { CalculatorsShellComponent } from "../../../features/calculators/shell/calculators-shell.component";
import { HeroComponent } from "./hero.component";

@Component({
  imports: [HeroComponent],
  template: '<pfui-hero title="Cel" buttonLabel="Rozpocznij" />',
})
class GoalPage {}
@Component({
  imports: [HeroComponent],
  template: '<pfui-hero title="Regularne" buttonLabel="Rozpocznij" />',
})
class RegularPage {}
@Component({
  imports: [HeroComponent],
  template: '<pfui-hero title="Obligacje" buttonLabel="Rozpocznij" />',
})
class BondsPage {}

describe("Hero while switching calculators", () => {
  it("keeps a shared explicit choice instead of expanding a freshly created hero on every route", async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: "kalkulatory",
            component: CalculatorsShellComponent,
            children: [
              { path: "oszczedzanie-na-cel", component: GoalPage },
              { path: "regularne-oszczedzanie", component: RegularPage },
              { path: "obligacje-skarbowe", component: BondsPage },
            ],
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create(
      "/kalkulatory/oszczedzanie-na-cel",
    );
    const hero = () =>
      harness.routeDebugElement!.query(By.directive(HeroComponent))
        .componentInstance as HeroComponent;
    expect(hero().expanded()).toBe(true);
    const first = hero();
    first.toggle(false);
    await harness.navigateByUrl("/kalkulatory/regularne-oszczedzanie");
    expect(hero()).not.toBe(first);
    expect(hero().expanded()).toBe(false);
    await harness.navigateByUrl("/kalkulatory/obligacje-skarbowe");
    expect(hero().expanded()).toBe(false);
    hero().toggle(true);
    await harness.navigateByUrl("/kalkulatory/oszczedzanie-na-cel");
    expect(hero().expanded()).toBe(true);
  });
});
