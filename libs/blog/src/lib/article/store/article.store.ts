import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { ArticleDataService } from '../data/article-data.service';
import { ArticleData, ArticleRequest } from '../model/article.model';

type State = {
  data: ArticleData | null;
  isLoading: boolean;
};

const initialState: State = {
  data: null,
  isLoading: false,
};

export const ArticleStore = signalStore(
  withState(initialState),
  withMethods((store, dataService = inject(ArticleDataService)) => ({
    fetch: rxMethod<ArticleRequest>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((request) => {
          return dataService.fetch(request).pipe(
            tapResponse({
              next: (data) => patchState(store, { data }),
              error: console.error,
              finalize: () => patchState(store, { isLoading: false }),
            })
          );
        })
      )
    ),
  }))
);
