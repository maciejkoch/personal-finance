import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    { link: '/', label: 'O nas' },
  ];
}
