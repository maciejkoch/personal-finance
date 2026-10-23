import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TransferState } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import {
  API_ENDPOINTS,
  PRODUCTION_API_ENDPOINTS,
} from "@core/http/api-endpoints";
import { ArticleDataService, articleStateKey } from "./article-data.service";

describe("Article hydration", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_ENDPOINTS, useValue: PRODUCTION_API_ENDPOINTS },
      ],
    }),
  );

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it("keeps the reviewed prerendered article without an initial API request", async () => {
    const article = { html: "<h1>Treść z bieżącego wydania</h1>" };
    TestBed.inject(TransferState).set(
      articleStateKey("oszczedzaj-regularnie"),
      article,
    );
    const result = await firstValueFrom(
      TestBed.inject(ArticleDataService).fetch("oszczedzaj-regularnie"),
    );
    expect(result).toEqual(article);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it("does not reuse another article's hydration data during navigation", async () => {
    TestBed.inject(TransferState).set(
      articleStateKey("oszczedzaj-regularnie"),
      { html: "Pierwszy artykuł" },
    );
    const result = firstValueFrom(
      TestBed.inject(ArticleDataService).fetch(
        "kalkulator-obligacji-skarbowych",
      ),
    );
    TestBed.inject(HttpTestingController)
      .expectOne(
        `${PRODUCTION_API_ENDPOINTS.article}?slug=kalkulator-obligacji-skarbowych`,
      )
      .flush({ html: "Drugi artykuł" });
    expect(await result).toEqual({ html: "Drugi artykuł" });
  });

  it("fetches fresh API content on a later visit after hydration", async () => {
    const service = TestBed.inject(ArticleDataService);
    TestBed.inject(TransferState).set(
      articleStateKey("oszczedzaj-regularnie"),
      { html: "Wydanie początkowe" },
    );
    await firstValueFrom(service.fetch("oszczedzaj-regularnie"));
    const result = firstValueFrom(service.fetch("oszczedzaj-regularnie"));
    TestBed.inject(HttpTestingController)
      .expectOne(
        `${PRODUCTION_API_ENDPOINTS.article}?slug=oszczedzaj-regularnie`,
      )
      .flush({ html: "Aktualizacja" });
    expect(await result).toEqual({ html: "Aktualizacja" });
  });
});
