import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CALCULATOR_LINKS } from "@core/navigation/section-links";
import { SectionLayoutComponent } from "@shared/ui/section-layout/section-layout.component";

@Component({
  selector: "pf-calculators-shell",
  imports: [RouterOutlet, SectionLayoutComponent],
  templateUrl: "./calculators-shell.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "w-full" },
})
export class CalculatorsShellComponent {
  readonly links = CALCULATOR_LINKS;
}
