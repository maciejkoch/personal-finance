import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NavigationComponent } from '@pf/navigation';

@Component({
  selector: 'pf-header',
  standalone: true,
  imports: [NgClass, NavigationComponent],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  showMenu = signal(false);

  toggleMenu() {
    this.showMenu.update((state) => !state);
  }
}
