import { inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { EMPTY, pipe, switchMap } from "rxjs";
import { TreasuryBondsDataService } from "../data/treasury-bonds-data.service";
import {
  TreasuryBondsRequest,
  TreasuryBondsResult,
} from "../model/treasury-bonds.model";

type State = {
  result: TreasuryBondsResult | null;
  loading: boolean;
  error: string | null;
  request: TreasuryBondsRequest | null;
};

const initialState: State = {
  result: null,
  loading: false,
  error: null,
  request: null,
};

export const TreasuryBondsStore = signalStore(
  withState(initialState),
  withMethods((store, dataSservice = inject(TreasuryBondsDataService)) => ({
    calculate: rxMethod<TreasuryBondsRequest | null>(
      pipe(
        switchMap((request) => {
          if (!request) {
            patchState(store, {
              result: null,
              loading: false,
              error: null,
              request: null,
            });
            return EMPTY;
          }
          patchState(store, { loading: true, error: null, request });
          return dataSservice.calculate(request).pipe(
            tapResponse({
              next: (result) => patchState(store, { result }),
              error: () =>
                patchState(store, {
                  error: store.result()
                    ? "Nie udało się zaktualizować wyników. Wyświetlamy poprzednie obliczenia. Spróbuj ponownie."
                    : "Nie udało się pobrać zgodnych wyników. Odśwież stronę i spróbuj ponownie.",
                }),
              finalize: () => patchState(store, { loading: false }),
            }),
          );
        }),
      ),
    ),
  })),
);
