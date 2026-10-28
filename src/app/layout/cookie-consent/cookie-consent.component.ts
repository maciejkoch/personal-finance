import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  inject,
  viewChild,
} from "@angular/core";
import { CookieConsentService } from "@core/privacy/cookie-consent.service";

@Component({
  selector: "pf-cookie-consent",
  templateUrl: "./cookie-consent.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieConsentComponent {
  protected readonly consent = inject(CookieConsentService);
  private readonly heading = viewChild<ElementRef<HTMLElement>>("heading");

  constructor() {
    // Browser-only initialization keeps prerendered HTML and hydration consistent.
    afterNextRender(() => this.consent.initialize());
    afterRenderEffect(() => {
      if (this.consent.settingsOpen()) this.heading()?.nativeElement.focus();
    });
  }
}
