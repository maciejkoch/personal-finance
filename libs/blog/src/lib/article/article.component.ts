import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { ArticleStore } from './store/article.store';

@Component({
    selector: 'pf-article',
    imports: [CommonModule],
    templateUrl: './article.component.html',
    providers: [ArticleStore]
})
export class ArticleComponent {
  #store = inject(ArticleStore);

  slug = input.required<string>();

  content = this.#store.data;

  constructor() {
    this.#store.fetch(this.slug);
  }
}
