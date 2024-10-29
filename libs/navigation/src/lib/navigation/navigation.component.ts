import { Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'pf-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation.component.html',
})
export class NavigationComponent {
  items = [
    { link: '/', label: 'Blog' },
    { link: '/calculators', label: 'Kalkulatory' },
    { link: '/about-us', label: 'O nas' },
  ];

  navigated = output();
}
