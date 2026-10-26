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
import { ActivatedRoute, Router, RouterLink, Scroll } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter, take } from "rxjs";
import { BondOfferStore } from "./store/bond-offer.store";
import { DecimalPipe, ViewportScroller } from "@angular/common";
import { CalculationStatusComponent } from "../shared/calculation-status.component";
import { scrollToElement } from "@shared/scroll/scroll-to-element";
import { availablePolishBonds } from "@markets/pl/polish-calculator-options";
import { TreasuryBondsRequest } from "./model/treasury-bonds.model";
import { TreasuryBondsStore } from "./store/treasury-bonds.store";
import { TreasuryBondsChartComponent } from "./ui/treasury-bonds-chart/treasury-bonds-chart.component";
import { TreasuryBondsFinalChartComponent } from "./ui/treasury-bonds-final-chart/treasury-bonds-final-chart.component";
import { TreasuryBondsFormComponent } from "./ui/treasury-bonds-form/treasury-bonds-form.component";
import { CalculatorPanelComponent } from "../shared/calculator-panel.component";
import { TaxExplanationComponent } from "../shared/tax-explanation.component";
import { TreasuryBondsHowToComponent } from "./ui/treasury-bonds-how-to/treasury-bonds-how-to.component";
import { TreasuryBondsResultsDescriptionComponent } from "./ui/treasury-bonds-results-description/treasury-bonds-results-description.component";
import { TreasuryBondsResultsComponent } from "./ui/treasury-bonds-results/treasury-bonds-results.component";

@Component({
  selector: "pf-treasury-bonds",
  imports: [
    RouterLink,
    DecimalPipe,
    CalculationStatusComponent,
    CalculatorPanelComponent,
    TaxExplanationComponent,
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
  error = this.#store.error;
  offers = inject(BondOfferStore);
  offer = this.offers.offer;
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #viewportScroller = inject(ViewportScroller);
  #destroyRef = inject(DestroyRef);
  #lastRequest = signal<TreasuryBondsRequest | null>(null);
  #reservedContentHeight = signal(0);
  #targetOfferId = signal<string | null>(null);
  #invalid = signal(false);
  isLoading = computed(() => this.loading() || this.offers.loading());
  isStale = computed(() => {
    const result = this.result();
    const target =
      this.#targetOfferId() ?? this.offers.catalog()?.currentOfferId;
    return (
      !!result &&
      (this.#invalid() ||
        this.isLoading() ||
        (!!target && result.offerId !== target))
    );
  });
  contentMinHeight = computed(() => {
    const target =
      this.#targetOfferId() ?? this.offers.catalog()?.currentOfferId;
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
      const target =
        this.#targetOfferId() ?? this.offers.catalog()?.currentOfferId;
      if (offer && request && offer.offerId === target)
        untracked(() =>
          this.#store.calculate({ ...request, offerId: offer.offerId }),
        );
    });
    effect(() => {
      if (this.offers.error() && !this.offer()) {
        untracked(() => this.#store.calculate("clear"));
      }
    });
    afterNextRender(() => {
      this.#route.queryParamMap
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe((params) => {
          this.#reservedContentHeight.set(
            this.offerContent()?.nativeElement.offsetHeight ?? 0,
          );
          this.#targetOfferId.set(params.get("offerId"));
          this.#store.calculate("prepare");
          this.offers.load(params.get("offerId"));
        });
    });
  }
  selectOffer(id: string) {
    if (id === this.selectedId()) return;
    const position = this.#viewportScroller.getScrollPosition();
    const restoreScroll = this.#router.events
      .pipe(
        filter((event) => event instanceof Scroll),
        take(1),
      )
      .subscribe(() => this.#viewportScroller.scrollToPosition(position));
    void this.#router
      .navigate([], {
        relativeTo: this.#route,
        queryParams: { offerId: id || null },
        queryParamsHandling: "merge",
        scroll: "manual",
      })
      .then(
        (navigated) => {
          if (!navigated) restoreScroll.unsubscribe();
        },
        () => {
          restoreScroll.unsubscribe();
        },
      );
  }
  retryOffer() {
    this.offers.load(this.#route.snapshot.queryParamMap.get("offerId"));
  }
  retry() {
    const offer = this.offer();
    const request = this.#lastRequest();
    if (offer && request) {
      this.#store.calculate({ ...request, offerId: offer.offerId });
    }
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
    return this.#targetOfferId() ?? "";
  }
  options = signal({ familyEligible: false });
  bonds = computed(() => {
    const available = availablePolishBonds(this.options());
    return Object.values(this.offer()?.bonds ?? {}).filter((bond) =>
      available.some((type) => type.toUpperCase() === bond.name),
    );
  });

  invalidate(next: TreasuryBondsRequest | null) {
    this.#invalid.set(!next);
    if (!next) {
      this.#lastRequest.set(null);
      this.#store.calculate(null);
    } else {
      this.#store.calculate("prepare");
    }
  }

  calculate(request: TreasuryBondsRequest) {
    this.#lastRequest.set(request);
  }

  readonly resultContainer =
    viewChild<ElementRef<HTMLElement>>("resultContainer");
  scrollToResult() {
    const target = this.resultContainer();
    if (target) scrollToElement(target.nativeElement);
  }

  scrollToForm() {
    const target = this.scrollToContainer();
    if (target) {
      scrollToElement(target.nativeElement);
    }
  }
}
