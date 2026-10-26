import { Injectable, signal } from "@angular/core";

/** One user choice for the calculator section; no hydration-time storage reset. */
@Injectable()
export class HeroStateService {
  readonly expanded = signal(true);
}
