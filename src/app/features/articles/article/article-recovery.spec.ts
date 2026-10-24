import { provideRouter } from "@angular/router";
import { TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
import { vi } from "vitest";
import { ArticleComponent } from "./article.component";
import { ArticleDataService } from "./data/article-data.service";

describe("Article recovery", () => {
  it("shows load errors, retries, and clears the previous article on a slug change", async () => {
    const responses: Subject<{ html: string }>[] = [];
    const fetch = vi.fn(() => {
      const response = new Subject<{ html: string }>();
      responses.push(response);
      return response;
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ArticleDataService, useValue: { fetch } },
      ],
    });
    const fixture = TestBed.createComponent(ArticleComponent);
    fixture.componentRef.setInput("slug", "oszczedzaj-regularnie");
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain("Ładowanie poradnika");
    responses[0].error(new Error("offline"));
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]'),
    ).not.toBeNull();
    fixture.nativeElement.querySelector("button").click();
    await fixture.whenStable();
    responses[1].next({ html: "<h1>Wczytany poradnik</h1>" });
    responses[1].complete();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain("Wczytany poradnik");
    fixture.componentRef.setInput("slug", "kalkulator-obligacji-skarbowych");
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain(
      "Wczytany poradnik",
    );
    responses[2].next({ html: "<h1>Drugi poradnik</h1>" });
    responses[2].complete();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain("Drugi poradnik");
  });
});
