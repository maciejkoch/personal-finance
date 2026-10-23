import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: "pf-navigation",
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./navigation.component.html",
})
export class NavigationComponent {
  desktop = input(false);

  items = [
    {
      link: "/calculators",
      directMatch: false,
      label: "Kalkulatory",
      open: signal(false),
      itemHeight: 52,
      items: [
        {
          link: "/calculators/treasury-bonds",
          label: "Obligacje skarbowe",
        },
        {
          link: "/calculators/long-term-savings",
          label: "Cel długoterminowy",
        },
        {
          link: "/calculators/regular-contribution",
          label: "Regularne oszczędzanie",
        },
      ],
    },
    {
      link: "/kalkulator-obligacji-skarbowych",
      label: "Poradnik obligacji",
    },
    {
      link: "/oszczedzaj-regularnie",
      label: "Poradnik oszczędzania",
    },
    { link: "/about-us", label: "O nas" },
  ];

  navigated = output();
}
