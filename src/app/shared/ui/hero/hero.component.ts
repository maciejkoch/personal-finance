import { HeroStateService } from "./hero-state.service";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from "@angular/core";

@Component({
  selector: "pfui-hero",
  imports: [],
  templateUrl: "./hero.component.html",
  host: { "[class.hero-interactive]": "interactive()" },
  styles: `
    :host(:not(.hero-interactive)) .expandable,
    :host(:not(.hero-interactive)) .swap > * {
      transition: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  ANIMATION_DURATION = 300;

  title = input<string>();
  text = input<string>();
  buttonLabel = input<string>();
  expandable = input(true);

  clicked = output<void>();

  private readonly sharedState = inject(HeroStateService, { optional: true });
  readonly expanded = this.sharedState?.expanded ?? signal(true);
  readonly interactive = signal(false);
  private scrollTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.scrollTimer));
  }

  toggle(value?: boolean) {
    if (!this.expandable()) {
      return;
    }

    clearTimeout(this.scrollTimer);
    this.interactive.set(true);
    this.expanded.update((expanded) => value ?? !expanded);
  }

  handleClick() {
    this.toggle(false);
    this.scrollTimer = setTimeout(
      () => this.clicked.emit(),
      this.ANIMATION_DURATION,
    );
  }
}
