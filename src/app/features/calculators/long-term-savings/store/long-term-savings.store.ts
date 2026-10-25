import { inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { EMPTY, pipe, switchMap } from "rxjs";
import { calculationError } from "../../shared/calculation-error";
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
    isStale: false,
    error: null as string | null,
  }),
  withMethods((store, service = inject(LongTermSavingsDataService)) => {
    const run = rxMethod<{
      request: LongTermSavingsRequest | null;
      fetch: boolean;
    }>(
      pipe(
        switchMap(({ request, fetch }) => {
          if (!request) {
            patchState(store, {
              request: null,
              isLoading: false,
              isStale: !!store.result(),
              error: null,
            });
            return EMPTY;
          }
          patchState(store, {
            request,
            isLoading: true,
            isStale: !!store.result(),
            error: null,
          });
          // A form edit cancels the previous request immediately, including debounce.
          if (!fetch) return EMPTY;
          return service.calculate(request).pipe(
            tapResponse({
              next: (result) => patchState(store, { result, isStale: false }),
              error: (error) =>
                patchState(store, { error: calculationError(error) }),
              finalize: () => patchState(store, { isLoading: false }),
            }),
          );
        }),
      ),
    );
    return {
      prepare: (request: LongTermSavingsRequest | null) =>
        run({ request, fetch: false }),
      calculate: (request: LongTermSavingsRequest | null) =>
        run({ request, fetch: true }),
      retry: () => {
        const request = store.request();
        if (request) run({ request, fetch: true });
      },
    };
  }),
);
