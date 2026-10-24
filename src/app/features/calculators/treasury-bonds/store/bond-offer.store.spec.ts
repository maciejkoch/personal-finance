import { TestBed } from "@angular/core/testing";
import { of, Subject } from "rxjs";
import { BondOfferStore } from "./bond-offer.store";
import { TreasuryBondsDataService } from "../data/treasury-bonds-data.service";
import { PublishedOffer } from "@contracts/bond-offer";
import baseline from "@data/bond-offer";

const offer = (id: string) =>
  ({ ...baseline, offerId: id, version: id }) as PublishedOffer;
describe("Offer selection", () => {
  it("uses the current revision and ignores a late response for the previous selection", () => {
    const old = new Subject<PublishedOffer>();
    const next = new Subject<PublishedOffer>();
    TestBed.configureTestingModule({
      providers: [
        BondOfferStore,
        {
          provide: TreasuryBondsDataService,
          useValue: {
            catalog: () =>
              of({
                entries: [],
                currentOfferId: "old",
                stale: false,
                nextCursor: null,
              }),
            offer: (id: string) => (id === "old" ? old : next),
          },
        },
      ],
    });
    const store = TestBed.inject(BondOfferStore);
    store.load(null);
    expect(store.loading()).toBe(true);
    store.load("next");
    next.next(offer("next"));
    next.complete();
    old.next(offer("old"));
    old.complete();
    expect(store.offer()?.offerId).toBe("next");
    expect(store.loading()).toBe(false);
  });
  it("clears the previous offer on failure instead of silently substituting another revision", () => {
    const pending = new Subject<PublishedOffer>();
    TestBed.configureTestingModule({
      providers: [
        BondOfferStore,
        {
          provide: TreasuryBondsDataService,
          useValue: {
            catalog: () =>
              of({
                entries: [],
                currentOfferId: "old",
                stale: false,
                nextCursor: null,
              }),
            offer: (id: string) => (id === "old" ? of(offer(id)) : pending),
          },
        },
      ],
    });
    const store = TestBed.inject(BondOfferStore);
    store.load(null);
    expect(store.offer()?.offerId).toBe("old");
    store.load("missing");
    expect(store.offer()).toBeNull();
    pending.error(new Error("404"));
    expect(store.error()).toBeTruthy();
    expect(store.offer()).toBeNull();
    expect(store.loading()).toBe(false);
  });
});
