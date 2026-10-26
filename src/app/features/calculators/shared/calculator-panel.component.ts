import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  linkedSignal,
} from "@angular/core";

/** Independent disclosure: all projected content stays in the SSR document. */
@Component({
  selector: "pf-calculator-panel",
  template: `
    <details
      class="collapse collapse-arrow calculator-panel"
      [open]="open()"
      (toggle)="remember($event)"
    >
      <summary class="collapse-title">
        <span class="font-medium">{{ label() }}</span>
        @if (summary()) {
          <span class="calculator-panel-summary">{{ summary() }}</span>
        }
      </summary>
      <div class="collapse-content"><ng-content /></div>
    </details>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block min-w-0" },
})
export class CalculatorPanelComponent {
  readonly label = input.required<string>();
  readonly summary = input("");
  readonly panelKey = input.required<string>();
  readonly initialOpen = input(false);
  readonly desktopOpen = input(false);
  readonly reveal = input(false);
  readonly open = linkedSignal(() => this.initialOpen());

  constructor() {
    effect(() => {
      if (this.reveal()) this.open.set(true);
    });
    afterNextRender(() => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(this.storageKey());
      } catch {
        /* Disclosure still works when storage is unavailable. */
      }
      const defaultOpen =
        this.initialOpen() ||
        (this.desktopOpen() &&
          window.matchMedia?.("(min-width: 1024px)").matches);
      this.open.set(
        this.reveal() ||
          (saved === "true" ? true : saved === "false" ? false : defaultOpen),
      );
    });
  }

  remember(event: Event) {
    const open = (event.target as HTMLDetailsElement).open;
    // Programmatic changes and initial hydration are not user preferences.
    if (open === this.open()) return;
    this.open.set(open);
    try {
      localStorage.setItem(this.storageKey(), String(open));
    } catch {
      /* The current view remains usable without persistence. */
    }
  }

  private storageKey() {
    return `calculator-panel:v1:${this.panelKey()}`;
  }
}
