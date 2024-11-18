import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { TreasuryBondsDataService } from '../data/treasury-bonds-data.service';
import {
  TreasuryBondsRequest,
  TreasuryBondsResult,
} from '../model/treasury-bonds.model';

type State = {
  result: TreasuryBondsResult | null;
  loading: boolean;
};

const initialState: State = {
  result: null,
  loading: false,
};

export const TreasuryBondsStore = signalStore(
  withState(initialState),
  withMethods((store, dataSservice = inject(TreasuryBondsDataService)) => ({
    calculate: rxMethod<TreasuryBondsRequest>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((request) => {
          return dataSservice.calculate(request).pipe(
            tapResponse({
              next: (result) => patchState(store, { result }),
              error: console.error,
              finalize: () => patchState(store, { loading: false }),
            })
          );
        })
      )
    ),
  }))
);
