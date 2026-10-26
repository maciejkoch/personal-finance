import { isPlatformBrowser } from "@angular/common";
import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import type { AppCheckConfiguration } from "./app-check.config";
import { API_ENDPOINTS } from "./api-endpoints";

@Injectable({ providedIn: "root" })
export class AppCheckService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly endpoints = inject(API_ENDPOINTS);
  private config?: Promise<AppCheckConfiguration>;
  private instance?: Promise<() => Promise<string>>;

  async token(): Promise<string | null> {
    // Prerender uses local article content. Emulators never contact attestation services.
    if (
      !this.browser ||
      Object.values(this.endpoints).every((endpoint) =>
        ["localhost", "127.0.0.1"].includes(new URL(endpoint).hostname),
      )
    )
      return null;
    const config = await (this.config ??= this.loadConfiguration());
    if (config.mode === "off") return null;
    try {
      const getAppToken = await (this.instance ??= this.initialize(
        config,
      ).catch((error) => {
        this.instance = undefined;
        throw error;
      }));
      return await getAppToken();
    } catch (error) {
      if (config.mode === "enforce") throw error;
      return null;
    }
  }

  private async loadConfiguration(): Promise<AppCheckConfiguration> {
    try {
      // Native fetch avoids recursively entering Angular's interceptor chain.
      const response = await fetch("/app-check.json", {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        throw new Error("Nie udało się załadować konfiguracji App Check.");
      const { appCheckConfiguration } = await import("./app-check.config");
      return appCheckConfiguration.parse(await response.json());
    } catch (error) {
      this.config = undefined;
      throw error;
    }
  }

  private async initialize(
    config: AppCheckConfiguration & { mode: "monitor" | "enforce" },
  ): Promise<() => Promise<string>> {
    const [
      { getApps, initializeApp },
      { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken },
    ] = await Promise.all([
      import("firebase/app"),
      import("firebase/app-check"),
    ]);
    const name = "oszczedzify-app-check";
    const existing = getApps().find((app) => app.name === name);
    // An initialized SDK instance is shared across concurrent requests.
    const appCheck = initializeAppCheck(
      existing ?? initializeApp(config.firebase, name),
      {
        provider: new ReCaptchaEnterpriseProvider(config.siteKey),
        isTokenAutoRefreshEnabled: true,
      },
    );
    return async () => (await getToken(appCheck)).token;
  }
}
