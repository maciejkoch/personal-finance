import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FooterComponent } from "@layout/footer/footer.component";
import { HeaderComponent } from "@layout/header/header.component";
import { LayoutComponent } from "@layout/layout/layout.component";
import { CookieConsentComponent } from "@layout/cookie-consent/cookie-consent.component";

@Component({
  imports: [
    RouterModule,
    LayoutComponent,
    HeaderComponent,
    FooterComponent,
    CookieConsentComponent,
  ],
  selector: "pf-root",
  templateUrl: "./app.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = "personal-finance";
}
