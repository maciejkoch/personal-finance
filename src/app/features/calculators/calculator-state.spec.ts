import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { Subject } from "rxjs";
import { vi } from "vitest";
import { LongTermSavingsComponent } from "./long-term-savings/long-term-savings.component";
import { LongTermSavingsDataService } from "./long-term-savings/data/long-term-savings-data.service";
import { LongTermSavingsData } from "./long-term-savings/model/long-term-savings.model";
import { RegularContributionComponent } from "./regular-contribution/regular-contribution.component";
import { RegularContributionDataService } from "./regular-contribution/data/regular-contribution-data.service";
import { RegularContributionData } from "./regular-contribution/model/regular-contribution.model";
import { CalculationStatusComponent } from "./shared/calculation-status.component";

const portfolio = {
  initialCapital: 1000,
  totalContribution: 12000,
  totalDeposited: 13000,
  finalValue: 14000,
  tax: 190,
  totalInterest: 1000,
  netValue: 13810,
  valueYearPerYear: [
    { year: 1, compoundedInteres: 14000, totalContribution: 12000 },
  ],
};
const request = {
  initialCapital: 1000,
  contribution: 1000,
  amount: 10000,
  duration: 1,
  rate: 5,
  inflation: 0,
  skipInflation: false,
  skipRate: false,
  skipTax: false,
};
const result = {
  ...request,
  ...portfolio,
  futureValue: 10000,
  monthlyContribution: 500,
  goalCoveredByInitialCapital: false,
};

describe("Visible recalculation and recovery", () => {
  for (const [component, service] of [
    [LongTermSavingsComponent, LongTermSavingsDataService],
    [RegularContributionComponent, RegularContributionDataService],
  ] as const) {
    it(`${component.name}: marks stale data immediately, cancels old requests, retries and clears invalid input`, async () => {
      const responses: Subject<
        LongTermSavingsData | RegularContributionData
      >[] = [];
      const calculate = vi.fn(() => {
        const response = new Subject<
          LongTermSavingsData | RegularContributionData
        >();
        responses.push(response);
        return response;
      });
      TestBed.configureTestingModule({
        providers: [{ provide: service, useValue: { calculate } }],
      });
      TestBed.overrideComponent(component, {
        set: {
          imports: [CalculationStatusComponent],
          template:
            '<pf-calculation-status [loading]="isLoading()" [stale]="isStale()" [error]="error()" (retried)="retry()" />',
        },
      });
      await TestBed.compileComponents();
      const fixture = TestBed.createComponent(
        component as typeof LongTermSavingsComponent,
      ) as ComponentFixture<
        LongTermSavingsComponent | RegularContributionComponent
      >;
      fixture.componentInstance.calculate(request);
      responses[0].next(result);
      responses[0].complete();
      await fixture.whenStable();
      const next = { ...request, contribution: 2000, amount: 20000 };
      fixture.componentInstance.invalidate(next);
      await fixture.whenStable();
      expect(fixture.componentInstance.data()).toEqual(result);
      expect(fixture.nativeElement.textContent).toContain("Przeliczanie…");
      expect(fixture.nativeElement.textContent).toContain(
        "Wynik dla poprzednich ustawień",
      );
      fixture.componentInstance.calculate(next);
      fixture.componentInstance.invalidate({ ...next, rate: 6 });
      responses[1].next({ ...result, netValue: 99999 });
      expect(fixture.componentInstance.data()?.netValue).toBe(13810);
      fixture.componentInstance.calculate(next);
      responses[2].error(new HttpErrorResponse({ status: 500 }));
      await fixture.whenStable();
      expect(fixture.componentInstance.isLoading()).toBe(false);
      expect(
        fixture.nativeElement.querySelector('[role="alert"]'),
      ).not.toBeNull();
      fixture.nativeElement.querySelector("button").click();
      await fixture.whenStable();
      responses[3].next({ ...result, ...next });
      responses[3].complete();
      await fixture.whenStable();
      expect(fixture.componentInstance.error()).toBeNull();
      expect(fixture.componentInstance.isStale()).toBe(false);
      fixture.componentInstance.invalidate(null);
      await fixture.whenStable();
      expect(fixture.componentInstance.data()).toBeNull();
    });
  }
});
