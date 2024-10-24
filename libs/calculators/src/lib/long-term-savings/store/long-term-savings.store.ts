import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import {
  LongTermSavingsRequest,
  LongTermSavingsResponse,
} from '../data/long-term-savings.model';
import { inject } from '@angular/core';
import { LongTermSavingsDataService } from '../data/long-term-savings-data.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

type State = {
  result: LongTermSavingsResponse | null;
  isLoading: boolean;
};

const initialState: State = {
  result: null,
  isLoading: false,
};

export const LongTermSavingsStore = signalStore(
  withState(initialState),
  withMethods((store, dataSservice = inject(LongTermSavingsDataService)) => ({
    calculate: rxMethod<LongTermSavingsRequest>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((request) => {
          return dataSservice.calculate(request).pipe(
            tapResponse({
              next: (result) => patchState(store, { result }),
              error: console.error,
              finalize: () => patchState(store, { isLoading: false }),
            })
          );
        })
      )
    ),
  }))
);
