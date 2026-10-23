import { inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { EMPTY, pipe, switchMap } from "rxjs";
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
    error: null as string | null,
  }),
  withMethods((store, service = inject(RegularContributionDataService)) => ({
    calculate: rxMethod<RegularContributionRequest | null>(
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
