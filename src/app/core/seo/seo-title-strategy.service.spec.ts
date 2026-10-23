import { Component, PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, TitleStrategy } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { SEO_INDEXABLE, SeoTitleStrategy } from "./seo-title-strategy.service";

@Component({ template: "" })
class TestPageComponent {}

describe("SEO during navigation", () => {
  beforeEach(() => {
    document.head
      .querySelectorAll('meta, link[rel="canonical"], #page-structured-data')
      .forEach((node) => node.remove());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: "**", component: TestPageComponent }]),
        { provide: TitleStrategy, useClass: SeoTitleStrategy },
        { provide: PLATFORM_ID, useValue: "server" },
      ],
    });
  });

  it("updates metadata and schema between routes, excluding query and fragment from canonical", async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(
      "/kalkulatory/obligacje-skarbowe?count=100#form",
    );
    expect(
      document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content"),
    ).toBe(
      "https://oszczedzify.org/brand/social/kalkulatory-obligacje-skarbowe.png",
    );
    expect(
      document
        .querySelector('meta[name="twitter:card"]')
        ?.getAttribute("content"),
    ).toBe("summary_large_image");
    expect(document.title).toContain("Kalkulator obligacji skarbowych");
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://oszczedzify.org/kalkulatory/obligacje-skarbowe");
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("index, follow");
    expect(
      JSON.parse(document.getElementById("page-structured-data")!.textContent!)[
        "@type"
      ],
    ).toBe("WebApplication");
    await harness.navigateByUrl("/oszczedzaj-regularnie");
    expect(
      document
        .querySelector('meta[name="twitter:image"]')
        ?.getAttribute("content"),
    ).toBe("https://oszczedzify.org/brand/social/oszczedzaj-regularnie.png");
    expect(document.title).toContain("Regularne oszczędzanie – dlaczego");
    expect(
      document
        .querySelector('meta[property="og:type"]')
        ?.getAttribute("content"),
    ).toBe("article");
    expect(document.querySelectorAll("#page-structured-data")).toHaveLength(1);
    await harness.navigateByUrl("/");
    expect(
      document
        .querySelector('meta[property="og:url"]')
        ?.getAttribute("content"),
    ).toBe("https://oszczedzify.org/");
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });

  it("clears stale canonical and schema and marks unknown pages noindex", async () => {
    const harness = await RouterTestingHarness.create("/");
    await harness.navigateByUrl("/missing-article");
    expect(document.title).toContain("404");
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("noindex, follow");
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]')).toBeNull();
    expect(document.querySelector('meta[property="og:image"]')).toBeNull();
    expect(document.querySelector('meta[property="og:image:alt"]')).toBeNull();
    expect(document.querySelector('meta[name="twitter:image"]')).toBeNull();
    expect(document.querySelector('meta[name="twitter:image:alt"]')).toBeNull();
    expect(document.getElementById("page-structured-data")).toBeNull();
  });

  it("keeps staging builds noindex", async () => {
    TestBed.overrideProvider(SEO_INDEXABLE, { useValue: false });
    await RouterTestingHarness.create("/");
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("noindex, follow");
  });

  it("keeps noncanonical browser hosts noindex after client navigation", async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: "browser" });
    const harness = await RouterTestingHarness.create("/");
    await harness.navigateByUrl("/kalkulatory/regularne-oszczedzanie");
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("noindex, follow");
  });
});
