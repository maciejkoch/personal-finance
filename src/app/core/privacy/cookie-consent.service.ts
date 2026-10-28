import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { Injectable, PLATFORM_ID, inject, signal } from "@angular/core";

const STORAGE_KEY = "oszczedzify:cookie-consent:v1";
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
const MEASUREMENT_ID = "G-TQCS9KZ14L";
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  "ga-disable-G-TQCS9KZ14L"?: boolean;
};

@Injectable({ providedIn: "root" })
export class CookieConsentService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly visible = signal(false);
  private readonly settings = signal(false);
  private initialized = false;
  private analyticsLoaded = false;
  private opener?: HTMLElement;

  readonly bannerVisible = this.visible.asReadonly();
  readonly settingsOpen = this.settings.asReadonly();

  initialize(): void {
    if (!this.browser || this.initialized) return;
    this.initialized = true;
    const saved = this.readChoice();
    this.visible.set(saved === null);
    if (saved === true) this.enableAnalytics();
    else this.clearAnalyticsCookies();
  }

  openSettings(opener: HTMLElement): void {
    this.opener = opener;
    this.settings.set(true);
    this.visible.set(true);
  }

  choose(analytics: boolean): void {
    const window = this.document.defaultView as AnalyticsWindow | null;
    if (!this.browser || !window) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ analytics, savedAt: Date.now() }),
      );
    } catch {
      // The choice still applies to this page when storage is unavailable.
      if (!analytics) {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Keep analytics disabled in this page if old storage is read-only.
        }
      }
    }
    this.visible.set(false);
    this.settings.set(false);
    this.opener?.focus();
    this.opener = undefined;
    if (analytics) {
      this.enableAnalytics();
    } else {
      window["ga-disable-G-TQCS9KZ14L"] = true;
      this.clearAnalyticsCookies();
      // Reload tears down a previously loaded tag, including its SPA listeners.
      // Avoid restoring stale consent if browser storage became read-only.
      if (this.analyticsLoaded && this.readChoice() !== true)
        window.location.reload();
    }
  }

  private readChoice(): boolean | null {
    try {
      const value: unknown = JSON.parse(
        this.document.defaultView!.localStorage.getItem(STORAGE_KEY) ?? "null",
      );
      if (
        typeof value === "object" &&
        value !== null &&
        "analytics" in value &&
        typeof value.analytics === "boolean" &&
        "savedAt" in value &&
        typeof value.savedAt === "number" &&
        value.savedAt <= Date.now() &&
        Date.now() - value.savedAt < MAX_AGE
      )
        return value.analytics;
    } catch {
      // Missing, invalid or inaccessible storage requires a fresh choice.
    }
    return null;
  }

  private enableAnalytics(): void {
    const window = this.document.defaultView as AnalyticsWindow | null;
    if (!window || this.analyticsLoaded) return;
    this.analyticsLoaded = true;
    window["ga-disable-G-TQCS9KZ14L"] = false;
    window.dataLayer ??= [];
    // gtag consumes an arguments object, rather than a plain array.
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params -- Google's gtag queue expects IArguments.
      window.dataLayer!.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("config", MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const script = this.document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    this.document.head.appendChild(script);
  }

  private clearAnalyticsCookies(): void {
    // Clear both host-only and parent-domain GA cookies from earlier visits.
    const domains = this.document.location.hostname.split(".");
    const paths = this.document.location.pathname.split("/");
    for (const cookie of this.document.cookie.split(";")) {
      const name = cookie.split("=")[0].trim();
      if (name !== "_ga" && !name.startsWith("_ga_")) continue;
      for (let pathIndex = 1; pathIndex <= paths.length; pathIndex++) {
        const path = paths.slice(0, pathIndex).join("/") || "/";
        const expired = `${name}=; Max-Age=0; path=${path}`;
        this.document.cookie = expired;
        for (let index = 0; index < domains.length; index++) {
          this.document.cookie = `${expired}; domain=${domains.slice(index).join(".")}`;
        }
      }
    }
  }
}
