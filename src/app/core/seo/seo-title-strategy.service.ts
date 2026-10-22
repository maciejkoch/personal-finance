import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { inject, Injectable, InjectionToken, PLATFORM_ID } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";
import pages from "./pages.json";

export const SEO_INDEXABLE = new InjectionToken<boolean>("SEO_INDEXABLE", {
  factory: () => true,
});
const ORIGIN = "https://oszczedzify.org";

@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly platform = inject(PLATFORM_ID);
  private readonly indexable = inject(SEO_INDEXABLE);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const path = snapshot.url.split(/[?#]/)[0].replace(/\/$/, "") || "/";
    const page = pages.find((page) => page.path === path);
    const title = page?.title ?? "Nie znaleziono strony (404) | Oszczędzify";
    const description =
      page?.description ??
      "Ten adres nie istnieje. Wybierz kalkulator lub artykuł na stronie głównej Oszczędzify.";
    const preview =
      isPlatformBrowser(this.platform) &&
      this.document.location.hostname !== "oszczedzify.org";
    this.title.setTitle(title);
    this.meta.updateTag({ name: "description", content: description });
    this.meta.updateTag({
      name: "robots",
      content:
        page && this.indexable && !preview
          ? "index, follow"
          : "noindex, follow",
    });
    this.meta.updateTag({ property: "og:title", content: title });
    this.meta.updateTag({ property: "og:description", content: description });
    this.meta.updateTag({
      property: "og:type",
      content: page?.type === "Article" ? "article" : "website",
    });
    this.meta.updateTag({ property: "og:locale", content: "pl_PL" });
    this.meta.updateTag({ property: "og:site_name", content: "Oszczędzify" });
    this.meta.updateTag({ name: "twitter:card", content: "summary" });
    this.meta.updateTag({ name: "twitter:title", content: title });
    this.meta.updateTag({ name: "twitter:description", content: description });
    let canonical = this.document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    this.document.getElementById("page-structured-data")?.remove();
    if (!page) {
      canonical?.remove();
      this.meta.removeTag('property="og:url"');
      return;
    }
    const url = ORIGIN + page.path;
    if (!canonical) {
      canonical = this.document.createElement("link");
      canonical.rel = "canonical";
      this.document.head.appendChild(canonical);
    }
    canonical.href = url;
    this.meta.updateTag({ property: "og:url", content: url });
    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": page.type,
      name: page.name,
      url,
      description,
      inLanguage: "pl-PL",
    };
    if (page.type === "WebApplication") {
      schema["applicationCategory"] = "FinanceApplication";
      schema["operatingSystem"] = "Any";
      schema["browserRequirements"] = "Requires JavaScript";
    }
    if (page.type === "Article") {
      schema["headline"] = page.name;
      schema["publisher"] = {
        "@type": "Organization",
        name: "Oszczędzify",
        url: ORIGIN + "/",
      };
      schema["mainEntityOfPage"] = url;
    }
    const script = this.document.createElement("script");
    script.id = "page-structured-data";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
    this.document.head.appendChild(script);
  }
}
