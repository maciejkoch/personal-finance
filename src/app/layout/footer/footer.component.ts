import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CookieConsentService } from "@core/privacy/cookie-consent.service";
import { RouterLink } from "@angular/router";

@Component({
  selector: "pf-footer",
  imports: [RouterLink],
  templateUrl: "./footer.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  protected readonly consent = inject(CookieConsentService);
}
