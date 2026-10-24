import { inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { EMPTY, pipe, switchMap } from "rxjs";
import { calculationError } from "../../shared/calculation-error";
import { RegularContributionDataService } from "../data/regular-contribution-data.service";
import {
  RegularContributionData,
  RegularContributionRequest,
} from "../model/regular-contribution.model";

export const RegularContributionStore = signalStore(
  withState({
    request: null as RegularContributionRequest | null,
    result: null as RegularContributionData | null,
    isLoading: false,
    isStale: false,
    error: null as string | null,
  }),
  withMethods((store, service = inject(RegularContributionDataService)) => {
    const run = rxMethod<{
      request: RegularContributionRequest | null;
      fetch: boolean;
    }>(
      pipe(
        switchMap(({ request, fetch }) => {
          if (!request) {
            patchState(store, {
              result: null,
              request: null,
              isLoading: false,
              isStale: false,
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
      prepare: (request: RegularContributionRequest | null) =>
        run({ request, fetch: false }),
      calculate: (request: RegularContributionRequest | null) =>
        run({ request, fetch: true }),
      retry: () => {
        const request = store.request();
        if (request) run({ request, fetch: true });
      },
    };
  }),
);
