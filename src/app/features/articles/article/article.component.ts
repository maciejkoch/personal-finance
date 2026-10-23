import {
  Component,
  inject,
  input,
  ChangeDetectionStrategy,
  computed,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import pages from "@core/seo/pages.json";
import { GUIDE_LINKS } from "@core/navigation/section-links";
import { SectionLayoutComponent } from "@shared/ui/section-layout/section-layout.component";
import { ArticleStore } from "./store/article.store";

@Component({
  selector: "pf-article",
  imports: [RouterLink, SectionLayoutComponent],
  templateUrl: "./article.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ArticleStore],
})
export class ArticleComponent {
  #store = inject(ArticleStore);

  readonly links = GUIDE_LINKS;
  slug = input.required<string>();
  page = computed(() => pages.find((page) => page.path === `/${this.slug()}`));

  content = this.#store.data;

  constructor() {
    this.#store.fetch(this.slug);
  }
}
