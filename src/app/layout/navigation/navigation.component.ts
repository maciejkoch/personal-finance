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
      label: "Kalkulatory",
      open: signal(false),
      itemHeight: 52,
      items: [
        {
          link: "/kalkulatory/obligacje-skarbowe",
          label: "Obligacje skarbowe",
        },
        {
          link: "/kalkulatory/oszczedzanie-na-cel",
          label: "Cel długoterminowy",
        },
        {
          link: "/kalkulatory/regularne-oszczedzanie",
          label: "Regularne oszczędzanie",
        },
      ],
    },
    {
      label: "Poradniki",
      open: signal(false),
      itemHeight: 52,
      items: [
        {
          link: "/kalkulator-obligacji-skarbowych",
          label: "Poradnik obligacji",
        },
        {
          link: "/oszczedzaj-regularnie",
          label: "Poradnik oszczędzania",
        },
      ],
    },
    { link: "/o-nas", label: "O nas" },
  ];

  navigated = output();

  closeOnFocusLeave(event: FocusEvent, submenu: HTMLDetailsElement) {
    if (!submenu.contains(event.relatedTarget as Node | null)) {
      submenu.open = false;
    }
  }
}
