import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { tapResponse } from "@ngrx/operators";
import { pipe, switchMap, map, throwError } from "rxjs";
import { OfferCatalog, PublishedOffer } from "@contracts/bond-offer";
import { TreasuryBondsDataService } from "../data/treasury-bonds-data.service";

export const BondOfferStore = signalStore(
  withState({
    offer: null as PublishedOffer | null,
    catalog: null as OfferCatalog | null,
    loading: false,
    error: null as string | null,
  }),
  withMethods((store, data = inject(TreasuryBondsDataService)) => ({
    load: rxMethod<string | null>(
      pipe(
        switchMap((id) => {
          patchState(store, { loading: true, error: null });
          return data.catalog().pipe(
            switchMap((catalog) => {
              patchState(store, { catalog });
              const selected = id ?? catalog.currentOfferId;
              return selected
                ? data.offer(selected)
                : throwError(() => new Error("No current offer"));
            }),
            tapResponse({
              next: (offer) => patchState(store, { offer, loading: false }),
              error: () =>
                patchState(store, {
                  offer: null,
                  loading: false,
                  error:
                    "Nie udało się pobrać wybranej oferty. Spróbuj ponownie lub wybierz inny miesiąc.",
                }),
            }),
          );
        }),
      ),
    ),
    more: rxMethod<void>(
      pipe(
        switchMap(() => {
          const catalog = store.catalog();
          return data.catalog(catalog?.nextCursor ?? undefined).pipe(
            map((page) => ({
              ...page,
              entries: [...(catalog?.entries ?? []), ...page.entries].filter(
                (entry, i, all) =>
                  all.findIndex((e) => e.offerId === entry.offerId) === i,
              ),
            })),
            tapResponse({
              next: (catalog) => patchState(store, { catalog }),
              error: () =>
                patchState(store, {
                  error: "Nie udało się pobrać starszych miesięcy.",
                }),
            }),
          );
        }),
      ),
    ),
  })),
);
