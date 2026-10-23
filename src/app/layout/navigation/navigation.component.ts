import {
  Component,
  input,
  output,
  signal,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs";
import {
  CALCULATOR_LINKS,
  GUIDE_LINKS,
  SectionLink,
} from "@core/navigation/section-links";

@Component({
  selector: "pf-navigation",
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./navigation.component.html",
})
export class NavigationComponent {
  desktop = input(false);

  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly items = [
    {
      link: "/kalkulatory",
      label: "Kalkulatory",
      open: signal(false),
      itemHeight: 52,
      items: CALCULATOR_LINKS,
    },
    {
      link: GUIDE_LINKS[0].link,
      label: "Poradniki",
      open: signal(false),
      itemHeight: 52,
      items: GUIDE_LINKS,
    },
    { link: "/o-nas", label: "O nas" },
  ];

  isActive(item: { link: string; items?: readonly SectionLink[] }): boolean {
    const path = this.currentUrl().split(/[?#]/)[0].replace(/\/$/, "") || "/";
    return (item.items ?? [item]).some((link) => link.link === path);
  }

  navigated = output();
}
