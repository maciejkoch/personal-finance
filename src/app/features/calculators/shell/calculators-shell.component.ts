import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'pf-calculators-shell',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './calculators-shell.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'w-full' }
})
export class CalculatorsShellComponent {
  links = [
    {
      label: 'Obligacje skarbowe',
      link: 'treasury-bonds',
    },
    {
      label: 'Cel długoterminowy',
      link: 'long-term-savings',
    },
    {
      label: 'Regularne oszczędzanie',
      link: 'regular-contribution',
    },
  ];
}
