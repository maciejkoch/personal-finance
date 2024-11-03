import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'pfui-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  ANIMATION_DURATION = 300;

  title = input<string>();
  text = input<string>();
  buttonLabel = input<string>();
  expandable = input(true);

  clicked = output<void>();

  expanded = signal(true);

  toggle(value?: boolean) {
    if (!this.expandable()) {
      return;
    }

    this.expanded.update((expanded) => value || !expanded);
  }

  handleClick() {
    this.toggle(false);
    setTimeout(() => this.clicked.emit(), this.ANIMATION_DURATION);
  }
}
