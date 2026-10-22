import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { LongTermSavingsDataService } from '../data/long-term-savings-data.service';
import {
  LongTermSavingsData,
  LongTermSavingsRequest,
} from '../model/long-term-savings.model';

type State = {
  result: LongTermSavingsData | null;
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
