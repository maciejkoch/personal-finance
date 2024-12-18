import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationComponent } from '@pf/navigation';

@Component({
    selector: 'pf-header',
    imports: [RouterLink, NavigationComponent],
    templateUrl: './header.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  showMenu = signal(false);

  toggleMenu() {
    this.showMenu.update((state) => !state);
  }
}
