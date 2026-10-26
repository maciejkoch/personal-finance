import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { vi } from "vitest";
import { skipCalculatorTransition } from "./view-transitions";

@Component({ template: "" })
class Page {}

describe("Calculator view transitions", () => {
  it("skips transitions within calculators, including repeated navigation, and retains transitions to other sections", async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: "kalkulatory",
            children: [
              { path: "cel", component: Page },
              { path: "regularne", component: Page },
            ],
          },
          { path: "o-nas", component: Page },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create("/kalkulatory/cel");
    const router = TestBed.inject(Router);
    const goal = router.routerState.snapshot.root;
    await harness.navigateByUrl("/kalkulatory/regularne");
    const regular = router.routerState.snapshot.root;
    await harness.navigateByUrl("/o-nas");
    const about = router.routerState.snapshot.root;
    const skipTransition = vi.fn();
    const transition = { skipTransition } as unknown as ViewTransition;
    skipCalculatorTransition({ transition, from: goal, to: regular });
    skipCalculatorTransition({ transition, from: regular, to: regular });
    expect(skipTransition).toHaveBeenCalledTimes(2);
    skipTransition.mockClear();
    skipCalculatorTransition({ transition, from: regular, to: about });
    skipCalculatorTransition({ transition, from: about, to: goal });
    expect(skipTransition).not.toHaveBeenCalled();
  });
});
