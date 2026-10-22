import { Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'pf-navigation',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './navigation.component.html'
})
export class NavigationComponent {
  desktop = input(false);

  items = [
    // Blog has been disabled for now
    // { link: '', label: 'Blog', directMatch: true },
    {
      link: '/calculators',
      directMatch: false,
      label: 'Kalkulatory',
      open: signal(false),
      itemHeight: 52,
      items: [
        {
          link: '/calculators/treasury-bonds',
          label: 'Obligacje skarbowe',
        },
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
