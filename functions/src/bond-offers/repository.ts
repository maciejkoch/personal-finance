import { createHash } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { BondOffer, OfferSummary, offerSchema } from "../contracts/bond-offer";

export function database(): Firestore {
  if (!getApps().length) initializeApp();
  return getFirestore(process.env.BOND_DATABASE_ID || "(default)");
}
export function warsawDate(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function hash(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export function offerId(offer: BondOffer): string {
  const content = Object.fromEntries(
    Object.entries(offer).filter(
      ([key]) => key !== "version" && key !== "verifiedAt",
    ),
  );
  return `${offer.month}-${hash(canonical(content)).slice(0, 24)}`;
}
export function selectCurrent(
  entries: OfferSummary[],
  today: string,
): OfferSummary | undefined {
  return entries
    .filter((entry) => entry.saleFrom <= today)
    .sort((a, b) => b.saleFrom.localeCompare(a.saleFrom))[0];
}
export class OfferError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export class OfferRepository {
  constructor(private readonly db = database()) {}
  // One bounded catalog document, read atomically with publications. No query/index dependency.
  async catalog(): Promise<OfferSummary[]> {
    const snap = await this.db.doc("bondOfferCatalog/months").get();
    return Object.values(
      (snap.data()?.entries ?? {}) as Record<string, OfferSummary>,
    ).sort((a, b) => b.month.localeCompare(a.month));
  }
  async get(id: string): Promise<BondOffer & { offerId: string }> {
    if (!/^20\d{2}-\d{2}-[a-f0-9]{24}$/.test(id))
      throw new OfferError(400, "Invalid offerId");
    const snap = await this.db.doc(`bondOffers/${id}`).get();
    if (!snap.exists) throw new OfferError(404, "Offer not found");
    if (snap.data()?.withdrawn) throw new OfferError(410, "Offer withdrawn");
    const offer = offerSchema.parse(snap.data()?.offer);
    if (offer.version !== id || offerId(offer) !== id)
      throw new Error("Corrupt offer revision");
    return { ...offer, offerId: id };
  }
  async publish(
    input: unknown,
    evidence: Record<string, unknown>,
  ): Promise<string> {
    const offer = offerSchema.parse(input);
    const id = offerId(offer);
    offer.version = id;
    const ref = this.db.doc(`bondOffers/${id}`);
    const catalogRef = this.db.doc("bondOfferCatalog/months");
    const observedAt =
      typeof evidence.observedAt === "string"
        ? evidence.observedAt
        : new Date().toISOString();
    await this.db.runTransaction(async (tx) => {
      const [existing, catalog] = await Promise.all([
        tx.get(ref),
        tx.get(catalogRef),
      ]);
      // A repeated historical revision must not undo a later correction/withdrawal.
      if (existing.exists) {
        if (existing.data()?.withdrawn)
          throw new OfferError(410, "Imported revision was withdrawn");
        return;
      }
      const entries = catalog.data()?.entries ?? {};
      if (Object.keys(entries).length >= 600 && !entries[offer.month])
        throw new Error("Catalog capacity reached");
      const newerObservation = entries[offer.month]?.observedAt > observedAt;
      if (!newerObservation)
        entries[offer.month] = {
          observedAt,
          offerId: id,
          month: offer.month,
          label: offer.label,
          saleFrom: offer.saleFrom,
          saleTo: offer.saleTo,
        };
      tx.create(ref, {
        offer,
        evidence,
        createdAt: new Date().toISOString(),
        withdrawn: false,
      });
      tx.set(catalogRef, { entries });
    });
    return id;
  }
  async withdraw(id: string, reason: string): Promise<void> {
    if (!/^20\d{2}-\d{2}-[a-f0-9]{24}$/.test(id) || !reason.trim())
      throw new Error("Revision and reason required");
    await this.db.runTransaction(async (tx) => {
      const ref = this.db.doc(`bondOffers/${id}`);
      const catalogRef = this.db.doc("bondOfferCatalog/months");
      const [snap, catalog] = await Promise.all([
        tx.get(ref),
        tx.get(catalogRef),
      ]);
      if (!snap.exists) throw new OfferError(404, "Offer not found");
      const offer = offerSchema.parse(snap.data()?.offer);
      const entries = catalog.data()?.entries ?? {};
      if (entries[offer.month]?.offerId === id) delete entries[offer.month];
      tx.update(ref, {
        withdrawn: true,
        withdrawalReason: reason,
        withdrawnAt: new Date().toISOString(),
      });
      tx.set(catalogRef, { entries });
    });
  }
  async activate(id: string): Promise<void> {
    if (!/^20\d{2}-\d{2}-[a-f0-9]{24}$/.test(id))
      throw new OfferError(400, "Invalid offerId");
    await this.db.runTransaction(async (tx) => {
      const ref = this.db.doc(`bondOffers/${id}`);
      const [snap, catalog] = await Promise.all([
        tx.get(ref),
        tx.get(this.db.doc("bondOfferCatalog/months")),
      ]);
      if (!snap.exists || snap.data()?.withdrawn)
        throw new Error("Unavailable revision");
      const offer = offerSchema.parse(snap.data()?.offer);
      const entries = catalog.data()?.entries ?? {};
      entries[offer.month] = {
        observedAt: new Date().toISOString(),
        offerId: id,
        month: offer.month,
        label: offer.label,
        saleFrom: offer.saleFrom,
        saleTo: offer.saleTo,
      };
      tx.set(this.db.doc("bondOfferCatalog/months"), { entries });
    });
  }
}
