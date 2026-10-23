import { inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { EMPTY, pipe, switchMap } from "rxjs";
import { LongTermSavingsDataService } from "../data/long-term-savings-data.service";
import {
  LongTermSavingsData,
  LongTermSavingsRequest,
} from "../model/long-term-savings.model";

export const LongTermSavingsStore = signalStore(
  withState({
    request: null as LongTermSavingsRequest | null,
    result: null as LongTermSavingsData | null,
    isLoading: false,
    error: null as string | null,
  }),
  withMethods((store, service = inject(LongTermSavingsDataService)) => ({
    calculate: rxMethod<LongTermSavingsRequest | null>(
      pipe(
        switchMap((request) => {
          if (!request) {
            patchState(store, {
              result: null,
              isLoading: false,
              error: null,
              request: null,
            });
            return EMPTY;
          }
          patchState(store, { isLoading: true, error: null, request });
          return service.calculate(request).pipe(
            tapResponse({
              next: (result) => patchState(store, { result }),
              error: () =>
                patchState(store, {
                  error:
                    "Nie udało się obliczyć wyniku. Zmień ustawienia lub spróbuj ponownie.",
                }),
              finalize: () => patchState(store, { isLoading: false }),
            }),
          );
        }),
      ),
    ),
  })),
);
