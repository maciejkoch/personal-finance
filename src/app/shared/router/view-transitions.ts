import type { ViewTransitionInfo } from "@angular/router";

/** Calculator navigation replaces content without animating the shared intro. */
export function skipCalculatorTransition({
  transition,
  from,
  to,
}: ViewTransitionInfo): void {
  if (
    from.root.firstChild?.routeConfig?.path === "kalkulatory" &&
    to.root.firstChild?.routeConfig?.path === "kalkulatory"
  ) {
    transition.skipTransition();
  }
}
