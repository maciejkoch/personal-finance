import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "pf-not-found",
  imports: [RouterLink],
  templateUrl: "./not-found.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
