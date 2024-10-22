import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pf-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  showMenu = signal(false);

  toggleMenu() {
    this.showMenu.update((state) => !state);
  }
}
