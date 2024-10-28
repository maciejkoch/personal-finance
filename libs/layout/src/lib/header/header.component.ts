import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'pf-header',
  standalone: true,
  imports: [NgTemplateOutlet, NgClass],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  showMenu = signal(false);

  toggleMenu() {
    this.showMenu.update((state) => !state);
  }
}
