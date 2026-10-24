import { inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap } from "rxjs";
import { ArticleDataService } from "../data/article-data.service";
import { ArticleData, ArticleRequest } from "../model/article.model";

export const ArticleStore = signalStore(
  withState({
    data: null as ArticleData | null,
    isLoading: false,
    error: null as string | null,
  }),
  withMethods((store, dataService = inject(ArticleDataService)) => ({
    fetch: rxMethod<ArticleRequest>(
      pipe(
        switchMap((request) => {
          patchState(store, { data: null, isLoading: true, error: null });
          return dataService.fetch(request).pipe(
            tapResponse({
              next: (data) => patchState(store, { data }),
              error: () =>
                patchState(store, {
                  error: "Nie udało się wczytać poradnika. Spróbuj ponownie.",
                }),
              finalize: () => patchState(store, { isLoading: false }),
            }),
          );
        }),
      ),
    ),
  })),
);
