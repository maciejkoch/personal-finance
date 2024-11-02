import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { RegularContributionDataService } from '../data/regular-contribution-data.service';
import {
  RegularContributionData,
  RegularContributionRequest,
} from '../model/regular-contribution.model';

type State = {
  result: RegularContributionData | null;
  isLoading: boolean;
};

const initialState: State = {
  result: null,
  isLoading: false,
};

export const RegularContributionStore = signalStore(
  withState(initialState),
  withMethods(
    (store, dataSservice = inject(RegularContributionDataService)) => ({
      calculate: rxMethod<RegularContributionRequest>(
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
    })
  )
);
