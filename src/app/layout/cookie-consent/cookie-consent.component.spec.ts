import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { CookieConsentService } from "@core/privacy/cookie-consent.service";
import { FooterComponent } from "@layout/footer/footer.component";
import { CookieConsentComponent } from "./cookie-consent.component";

// Exercise the real service without making third-party requests in the test DOM.
describe("Cookie consent controls", () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  afterEach(() => localStorage.clear());

  it("rejects analytics, reopens from the footer and restores keyboard focus", async () => {
    const banner = TestBed.createComponent(CookieConsentComponent);
    const footer = TestBed.createComponent(FooterComponent);
    await banner.whenStable();
    await footer.whenStable();
    const root: HTMLElement = banner.nativeElement;
    const button = root.querySelector<HTMLButtonElement>("button")!;
    expect(button.textContent).toContain("Tylko niezbędne");
    button.click();
    await banner.whenStable();
    expect(root.querySelector("section")).toBeNull();

    const settings = (
      footer.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>("button")!;
    const focus = vi.spyOn(settings, "focus");
    settings.click();
    await banner.whenStable();
    expect(root.querySelector("section")?.getAttribute("aria-labelledby")).toBe(
      "cookie-consent-title",
    );
    root.querySelector<HTMLButtonElement>("button")!.click();
    await banner.whenStable();
    expect(focus).toHaveBeenCalled();
    expect(root.querySelector("section")).toBeNull();
  });

  it("wires the analytics acceptance action", async () => {
    const consent = TestBed.inject(CookieConsentService);
    const choose = vi
      .spyOn(consent, "choose")
      .mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(CookieConsentComponent);
    await fixture.whenStable();
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("button");
    buttons[1].click();
    expect(choose).toHaveBeenCalledWith(true);
  });
});
