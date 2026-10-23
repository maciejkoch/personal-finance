import {
  Component,
  inject,
  input,
  ChangeDetectionStrategy,
  computed,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import pages from "@core/seo/pages.json";
import { ArticleStore } from "./store/article.store";

@Component({
  selector: "pf-article",
  imports: [RouterLink],
  templateUrl: "./article.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ArticleStore],
})
export class ArticleComponent {
  #store = inject(ArticleStore);

  slug = input.required<string>();
  page = computed(() => pages.find((page) => page.path === `/${this.slug()}`));

  content = this.#store.data;

  constructor() {
    this.#store.fetch(this.slug);
  }
}
