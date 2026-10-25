import {
  afterNextRender,
  effect,
  untracked,
  DestroyRef,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";
import { mapTo, of, switchMap, timer } from "rxjs";
import { BondOfferStore } from "./store/bond-offer.store";
import { DecimalPipe } from "@angular/common";
import { scrollToElement } from "@shared/scroll/scroll-to-element";
import { availablePolishBonds } from "@markets/pl/polish-calculator-options";
import { TreasuryBondsRequest } from "./model/treasury-bonds.model";
import { TreasuryBondsStore } from "./store/treasury-bonds.store";
import { TreasuryBondsChartComponent } from "./ui/treasury-bonds-chart/treasury-bonds-chart.component";
import { TreasuryBondsFinalChartComponent } from "./ui/treasury-bonds-final-chart/treasury-bonds-final-chart.component";
import { TreasuryBondsFormComponent } from "./ui/treasury-bonds-form/treasury-bonds-form.component";
import { TreasuryBondsHeroComponent } from "./ui/treasury-bonds-hero/treasury-bonds-hero.component";
import { TreasuryBondsHowToComponent } from "./ui/treasury-bonds-how-to/treasury-bonds-how-to.component";
import { TreasuryBondsResultsDescriptionComponent } from "./ui/treasury-bonds-results-description/treasury-bonds-results-description.component";
import { TreasuryBondsResultsComponent } from "./ui/treasury-bonds-results/treasury-bonds-results.component";

@Component({
  selector: "pf-treasury-bonds",
  imports: [
    RouterLink,
    DecimalPipe,
    TreasuryBondsHeroComponent,
    TreasuryBondsHowToComponent,
    TreasuryBondsFormComponent,
    TreasuryBondsResultsDescriptionComponent,
    TreasuryBondsResultsComponent,
    TreasuryBondsChartComponent,
    TreasuryBondsFinalChartComponent,
  ],
  templateUrl: "./treasury-bonds.component.html",
  providers: [TreasuryBondsStore, BondOfferStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "relative " },
})
export class TreasuryBondsComponent {
  #store = inject(TreasuryBondsStore);

  scrollToContainer = viewChild<ElementRef>("scrollToContainer");
  private readonly offerContent =
    viewChild<ElementRef<HTMLElement>>("offerContent");

  result = this.#store.result;
  loading = this.#store.loading;
  showUpdating = toSignal(
    toObservable(this.loading).pipe(
      switchMap((loading) =>
        loading ? timer(500).pipe(mapTo(true)) : of(false),
      ),
    ),
    { initialValue: false },
  );
  error = this.#store.error;
  offers = inject(BondOfferStore);
  offer = this.offers.offer;
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #destroyRef = inject(DestroyRef);
  #lastRequest = signal<TreasuryBondsRequest | null>(null);
  #reservedContentHeight = signal(0);
  #targetOfferId = signal<string | null>(null);
  contentMinHeight = computed(() => {
    const target = this.#targetOfferId() ?? this.offers.catalog()?.currentOfferId;
    if (!target || this.offers.error() || this.error()) return 0;
    const ready =
      !this.offers.loading() &&
      !this.loading() &&
      this.offer()?.offerId === target &&
      this.result()?.offerId === target;
    return ready ? 0 : this.#reservedContentHeight();
  });
  constructor() {
    effect(() => {
      const offer = this.offer();
      const request = this.#lastRequest();
      if (offer && request)
        untracked(() =>
          this.#store.calculate({ ...request, offerId: offer.offerId }),
        );
    });
    afterNextRender(() => {
      this.#route.queryParamMap
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe((params) => {
          this.#reservedContentHeight.set(
            this.offerContent()?.nativeElement.offsetHeight ?? 0,
          );
          this.#targetOfferId.set(params.get("offerId"));
          this.#store.calculate(null);
          this.offers.load(params.get("offerId"));
        });
    });
  }
  selectOffer(id: string) {
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: { offerId: id || null },
      queryParamsHandling: "merge",
    });
  }
  retryOffer() {
    this.offers.load(this.#route.snapshot.queryParamMap.get("offerId"));
  }
  entries = computed(() => {
    const entries = this.offers.catalog()?.entries ?? [];
    const offer = this.offer();
    return offer && !entries.some((entry) => entry.offerId === offer.offerId)
      ? [
          {
            offerId: offer.offerId,
            month: offer.month,
            label: offer.label + " (wybrana wersja)",
            saleFrom: offer.saleFrom,
            saleTo: offer.saleTo,
          },
          ...entries,
        ]
      : entries;
  });
  selectedId() {
    return this.#route.snapshot.queryParamMap.get("offerId") ?? "";
  }
  options = signal({ familyEligible: false });
  bonds = computed(() => {
    const available = availablePolishBonds(this.options());
    return Object.values(this.offer()?.bonds ?? {}).filter((bond) =>
      available.some((type) => type.toUpperCase() === bond.name),
    );
  });

  invalidate(next: TreasuryBondsRequest | null) {
    if (!next) this.#lastRequest.set(null);
    const previous = this.#store.request();
    if (
      !next ||
      (previous &&
        (previous.skipTax !== next.skipTax ||
          previous.familyEligible !== next.familyEligible))
    ) {
      this.#store.calculate(null);
    }
  }

  calculate(request: TreasuryBondsRequest) {
    this.#lastRequest.set(request);
  }

  scrollToForm() {
    const target = this.scrollToContainer();
    if (target) {
      scrollToElement(target.nativeElement);
    }
  }
}
