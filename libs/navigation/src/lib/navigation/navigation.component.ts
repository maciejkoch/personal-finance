import { Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'pf-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation.component.html',
})
export class NavigationComponent {
  desktop = input(false);

  items = [
    { link: '', label: 'Blog', directMatch: true },
    {
      link: '/calculators',
      label: 'Kalkulatory',
      open: signal(false),
      items: [
        {
          link: '/calculators/long-term-savings',
          label: 'Cel długoterminowy',
        },
        {
          link: '/calculators/regular-contribution',
          label: 'Regularne oszczędzanie',
        },
      ],
    },
    { link: '/about-us', label: 'O nas' },
  ];

  navigated = output();
}
