import {
  Component,
  inject,
  input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { ArticleStore } from "./store/article.store";

@Component({
  selector: "pf-article",
  imports: [],
  templateUrl: "./article.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ArticleStore],
})
export class ArticleComponent {
  #store = inject(ArticleStore);

  slug = input.required<string>();

  content = this.#store.data;

  constructor() {
    this.#store.fetch(this.slug);
  }
}
