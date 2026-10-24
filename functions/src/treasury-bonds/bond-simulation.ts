import { TREASURY_BONDS_OFFER } from "./treasury-bonds.consts";
import {
  CalculationParams,
  TreasuryBonds,
  TreasuryBondsResult,
} from "./treasury-bonds.model";

export const money = (value: number): number =>
  Math.round((value + 1e-9) * 100) / 100;

// One payment for the whole holding; tax is rounded UP, never refunded on a loss.
export function paymentTax(income: number, skipTax = false): number {
  const incomeInCents = Math.max(0, Math.round((income + 1e-9) * 100));
  return skipTax ? 0 : Math.ceil((incomeInCents * 19) / 100) / 100;
}

function annualValue(values: number[], year: number): number {
  return values[Math.min(Math.max(year - 1, 0), values.length - 1)];
}

function dateAtMonth(month: number, saleFrom: string): number {
  const [year, firstMonth] = saleFrom.split("-").map(Number);
  return Date.UTC(year, firstMonth - 1 + month, 1);
}

/** Monthly anniversary snapshots, after coupons, before buying the next holding.
 * The starting date is the first day of the offer month. Annual partial periods
 * use ACT/ACT. Settlement delays and non-working days are not simulated.
 */
export function simulateBond(
  bond: TreasuryBonds,
  initialNumberOfBonds: number,
  maxMonth: number,
  params: CalculationParams,
  saleFrom = TREASURY_BONDS_OFFER.saleFrom,
): TreasuryBondsResult {
  if (
    !Number.isInteger(initialNumberOfBonds) ||
    initialNumberOfBonds < 1 ||
    initialNumberOfBonds > 1000000 ||
    !Number.isInteger(maxMonth) ||
    maxMonth < 1 ||
    maxMonth > 144
  ) {
    throw new RangeError("Invalid bond count or month");
  }
  const result: TreasuryBondsResult = {};
  let count = initialNumberOfBonds;
  let purchasePrice = 100;
  let cash = 0;
  let capital = 100; // unrounded compounded value PER BOND
  let lockedRate = bond.firstPeriodRate;
  for (let month = 1; month <= maxMonth; month++) {
    const age = ((month - 1) % bond.maturityInMonths) + 1;
    const cycleStart = month - age;
    const maturity = age === bond.maturityInMonths;
    const year = Math.ceil(month / 12);
    const savingsInterest = money(
      (cash * annualValue(params.savingsRate, year)) / 12,
    );
    cash = money(
      cash + savingsInterest - paymentTax(savingsInterest, params.skipTax),
    );
    const periodStart =
      Math.floor((age - 1) / bond.rateUpdateInMonths) * bond.rateUpdateInMonths;
    if ((age - 1) % bond.rateUpdateInMonths === 0) {
      lockedRate =
        periodStart === 0 || bond.indexation === "fixed"
          ? bond.firstPeriodRate
          : bond.margin +
            Math.max(
              0,
              annualValue(
                bond.indexation === "inflation"
                  ? params.inflation
                  : params.referenceRate,
                bond.indexation === "inflation"
                  ? Math.ceil((cycleStart + periodStart) / 12)
                  : year,
              ),
            );
    }
    const annualStart = Math.floor((age - 1) / 12) * 12;
    const fraction =
      bond.paymentOfInterestInMonths === 1
        ? 1 / 12
        : (dateAtMonth(month, saleFrom) -
            dateAtMonth(cycleStart + annualStart, saleFrom)) /
          (dateAtMonth(cycleStart + annualStart + 12, saleFrom) -
            dateAtMonth(cycleStart + annualStart, saleFrom));
    const basis = capital;
    // TOS annex 2 rounds N(k-1), while the maturity formula rounds the final product.
    const earlyBasis = bond.indexation === "fixed" ? money(basis) : basis;
    const accruedValue = basis * (1 + lockedRate * fraction);
    const couponDue =
      bond.paymentOfInterestInMonths > 0 &&
      age % bond.paymentOfInterestInMonths === 0;
    let coupon = 0;
    if (couponDue) {
      const grossCoupon =
        money(100 * lockedRate * (bond.paymentOfInterestInMonths / 12)) * count;
      coupon = money(grossCoupon - paymentTax(grossCoupon, params.skipTax));
      cash = money(cash + coupon);
    }
    // Once a coupon is paid it cannot also offset the fee or be taxed a second time.
    const holdingValue = couponDue ? 100 : accruedValue;
    const earlyHoldingValue = couponDue
      ? 100
      : earlyBasis * (1 + lockedRate * fraction);
    const protectedCapital =
      age < bond.buyoutProtectionInMonths ||
      (age === bond.buyoutProtectionInMonths && !couponDue);
    const fee = maturity
      ? 0
      : protectedCapital
        ? Math.min(Math.max(0, earlyHoldingValue - 100), bond.earlyBuyoutCost)
        : bond.earlyBuyoutCost;
    const grossRedemptionPerBond = maturity
      ? money(holdingValue)
      : money(earlyHoldingValue - fee);
    const grossRedemption = money(grossRedemptionPerBond * count);
    const redemption = money(
      grossRedemption -
        paymentTax(grossRedemption - count * purchasePrice, params.skipTax),
    );
    const finalValue = money(cash + redemption);
    let nextCount = count;
    let nextPrice = purchasePrice;
    let nextCash = cash;
    if (maturity && month < maxMonth) {
      // Scenario assumption: future offers retain today's terms. Only redemption
      // proceeds use the exchange price; accumulated cash buys at the nominal price.
      const exchangeCount = Math.floor(
        (money(redemption + coupon) * 100) /
          Math.round(bond.exchangeCost * 100),
      );
      const cashCount = Math.floor((money(cash - coupon) * 100) / 10000);
      nextCount = exchangeCount + cashCount;
      const cost = money(exchangeCount * bond.exchangeCost + cashCount * 100);
      nextPrice = nextCount ? cost / nextCount : 100;
      nextCash = money(finalValue - cost);
    }
    result[month] = {
      rate: money(lockedRate * 10000) / 10000,
      maturity,
      numberOfBonds: count,
      nextNumberOfBonds: nextCount,
      buyCost: money(count * purchasePrice),
      nextBuyCost: money(nextCount * nextPrice),
      nominalValue: count * 100,
      nextNominalValue: nextCount * 100,
      basisOfCapitalisation: money(basis * count),
      nextBasisOfCapitalisation: maturity
        ? nextCount * 100
        : money((age % 12 === 0 && !couponDue ? accruedValue : basis) * count),
      valueAtEndOfMonth: money(money(holdingValue) * count),
      earlyBuyoutPenalty: money(fee * count),
      buyoutAtEndOfMonth: redemption,
      profitAtEndOfMonth: coupon,
      balanceAtEndOfMonth: cash,
      finalValueAtEndOfMath: finalValue,
    };
    if (maturity) {
      count = nextCount;
      purchasePrice = nextPrice;
      cash = nextCash;
      capital = 100;
    } else if (age % 12 === 0 && !couponDue) {
      capital = accruedValue;
    }
  }
  return result;
}
