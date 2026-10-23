import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { SectionLink } from "@core/navigation/section-links";

@Component({
  selector: "pfui-section-layout",
  imports: [RouterLink, RouterLinkActive],
  templateUrl: "./section-layout.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block w-full" },
})
export class SectionLayoutComponent {
  readonly links = input.required<readonly SectionLink[]>();
  readonly label = input.required<string>();
}
