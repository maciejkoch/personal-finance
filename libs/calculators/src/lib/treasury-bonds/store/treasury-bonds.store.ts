import { inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap } from "rxjs";
import { TreasuryBondsDataService } from "../data/treasury-bonds-data.service";
import {
  TreasuryBondsRequest,
  TreasuryBondsResult,
} from "../model/treasury-bonds.model";

type State = {
  result: TreasuryBondsResult | null;
  loading: boolean;
  error: string | null;
};

const initialState: State = {
  result: null,
  loading: false,
  error: null,
};

export const TreasuryBondsStore = signalStore(
  withState(initialState),
  withMethods((store, dataSservice = inject(TreasuryBondsDataService)) => ({
    calculate: rxMethod<TreasuryBondsRequest>(
      pipe(
        switchMap((request) => {
          patchState(store, { loading: true, result: null, error: null });
          return dataSservice.calculate(request).pipe(
            tapResponse({
              next: (result) => patchState(store, { result }),
              error: () =>
                patchState(store, {
                  result: null,
                  error:
                    "Nie udało się pobrać zgodnych wyników. Odśwież stronę i spróbuj ponownie.",
                }),
              finalize: () => patchState(store, { loading: false }),
            }),
          );
        }),
      ),
    ),
  })),
);
