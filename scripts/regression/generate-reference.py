"""Independent analytical checkpoints; never imports or runs application code.

Run manually from the repository root with Python 3. Review changes to the JSON.
Amounts use Decimal, half-up money rounding and upward bond-tax rounding.
The generic savings oracle sums individual monthly cash flows instead of using
the application's closed-form annuity formula. This is not a bond simulator.
"""

from decimal import Decimal as D, ROUND_HALF_UP, ROUND_CEILING, getcontext
from pathlib import Path
import argparse
import json

getcontext().prec = 70
CENT = D("0.01")


def money(value):
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def bond_tax(income, skip):
    return D(0) if skip else (max(D(0), income) * D("0.19")).quantize(CENT, rounding=ROUND_CEILING)


def number(value):
    return float(value)


# October 2026 issue letters 95–101/2026. Parameters are deliberately frozen,
# independent of treasury-bonds.offer.json. Sources and hashes are recorded in
# docs/baseline/2026-10-21-stage2-offer-sources.json.
terms = {
    "ROR": (12, "0.04", "0.04", "0.5", 1),
    "DOR": (24, "0.0415", "0.0415", "0.7", 1),
    "TOS": (36, "0.044", "0.044", "1", 0),
    "COI": (48, "0.0475", "0.05", "2", 12),
    "EDO": (120, "0.0535", "0.055", "3", 0),
    "ROS": (72, "0.05", "0.055", "2", 0),
    "ROD": (144, "0.056", "0.06", "3", 0),
}
bond_cases = []
for bond, (months, first, later, fee, coupon_months) in terms.items():
    first, later, fee = D(first), D(later), D(fee)
    for quantity in (1, 100):
        for skip in (False, True):
            if coupon_months:
                first_coupon = money(100 * first * D(coupon_months) / 12) * quantity
                later_coupon = money(100 * later * D(coupon_months) / 12) * quantity
                first_count = 12 // coupon_months
                later_count = (months - 12) // coupon_months
                net_first = first_coupon - bond_tax(first_coupon, skip)
                net_later = later_coupon - bond_tax(later_coupon, skip)
                cash = net_first * first_count + net_later * later_count
                holding = redemption = D(100 * quantity)
                coupon = net_later if later_count else net_first
                derivation = "Nominal principal + sum of rounded, individually taxed coupons; no cash interest."
            else:
                holding = money(100 * (1 + first) * (1 + later) ** (months // 12 - 1)) * quantity
                redemption = holding - bond_tax(holding - 100 * quantity, skip)
                cash = coupon = D(0)
                derivation = "100 × (1 + first rate) × (1 + later rate)^(years − 1), rounded per bond; tax on total redemption income."
            bond_cases.append({
                "name": f"{bond} maturity, {quantity} bonds, skipTax={skip}",
                "bond": bond, "quantity": quantity, "month": months,
                "skipTax": skip, "inflation": [0.035], "referenceRate": [0.04], "savingsRate": [0],
                "derivation": derivation,
                "expected": {"maturity": True, "valueAtEndOfMonth": number(holding),
                    "buyoutAtEndOfMonth": number(redemption), "balanceAtEndOfMonth": number(cash),
                    "profitAtEndOfMonth": number(coupon), "finalValueAtEndOfMath": number(redemption + cash),
                    "earlyBuyoutPenalty": 0, "numberOfBonds": quantity, "nextNumberOfBonds": quantity},
            })

# Two-year observations before maturity: year two uses zero previous-year
# inflation plus the issue margin, NOT the second scenario value (10%).
for bond, margin in (("COI", "0.015"), ("EDO", "0.02"), ("ROS", "0.02"), ("ROD", "0.025")):
    _, first, _, fee, coupon_months = terms[bond]
    for quantity in (1, 100):
        for skip in (False, True):
            if coupon_months:
                coupons = [money(100 * D(rate)) * quantity for rate in (first, margin)]
                cash = sum(c - bond_tax(c, skip) for c in coupons)
                gross = D(100 * quantity) - D(fee) * quantity
                holding = D(100 * quantity)
            else:
                holding = money(100 * (1 + D(first)) * (1 + D(margin))) * quantity
                gross = money(100 * (1 + D(first)) * (1 + D(margin)) - D(fee)) * quantity
                cash = D(0)
            redemption = gross - bond_tax(gross - 100 * quantity, skip)
            bond_cases.append({
                "name": f"{bond} year two with zero preceding inflation, {quantity} bonds, skipTax={skip}",
                "bond": bond, "quantity": quantity, "month": 24, "skipTax": skip,
                "inflation": [0, 0.1], "referenceRate": [0.04], "savingsRate": [0],
                "derivation": "Year two rate = 0% previous inflation + issue margin; redemption fee deducted before tax. COI coupons remain separate from principal.",
                "expected": {"rate": number(D(margin)), "maturity": False,
                    "valueAtEndOfMonth": number(holding), "buyoutAtEndOfMonth": number(redemption),
                    "balanceAtEndOfMonth": number(cash), "finalValueAtEndOfMath": number(redemption + cash),
                    "earlyBuyoutPenalty": number(D(fee) * quantity)},
            })

for quantity in (1, 100):
    for skip in (False, True):
        gross = money(D("104.40") * (1 + D("0.044") * 31 / 366) - 1) * quantity
        net = gross - bond_tax(gross - 100 * quantity, skip)
        bond_cases.append({
            "name": f"TOS ACT/ACT in leap year, {quantity} bonds, skipTax={skip}",
            "bond": "TOS", "quantity": quantity, "month": 13, "skipTax": skip,
            "inflation": [0.035], "referenceRate": [0.04], "savingsRate": [0],
            "derivation": "Annex 2: round(104.40 × (1 + 0.044 × 31/366) − 1) per bond, then tax total income.",
            "expected": {"buyoutAtEndOfMonth": number(net), "finalValueAtEndOfMath": number(net), "earlyBuyoutPenalty": quantity},
        })
        coupon = D("0.33") * quantity
        net_coupon = coupon - bond_tax(coupon, skip)
        cash_interest = money(net_coupon * D("0.12") / 12)
        cash = 2 * net_coupon + cash_interest - bond_tax(cash_interest, skip)
        redemption = D("99.50") * quantity
        bond_cases.append({
            "name": f"ROR coupons and interest on cash, {quantity} bonds, skipTax={skip}",
            "bond": "ROR", "quantity": quantity, "month": 2, "skipTax": skip,
            "inflation": [0.035], "referenceRate": [0.04], "savingsRate": [0.12],
            "derivation": "Two net 0.33-per-bond coupons + one month of net interest on the first coupon; principal minus 0.50 fee, no tax refund on loss.",
            "expected": {"balanceAtEndOfMonth": number(cash), "buyoutAtEndOfMonth": number(redemption),
                "finalValueAtEndOfMath": number(cash + redemption), "earlyBuyoutPenalty": number(D("0.5") * quantity)},
        })


def cash_flow_weights(years, rate):
    monthly = D(rate) / 12
    # Payment at the end of each month: the last payment earns no interest.
    return [(1 + monthly) ** remaining for remaining in range(years * 12)]


regular_cases, savings_cases = [], []
for contribution, years, rate in (("1000", 1, "0"), ("1000", 2, "0.12"), ("500.01", 15, "0.05"), ("0.01", 100, "0.01")):
    for skip in (False, True):
        total = money(D(contribution) * years * 12)
        final = money(D(contribution) * sum(cash_flow_weights(years, rate)))
        interest = final - total
        regular_cases.append({"name": f"{contribution}/month for {years} years at {rate}, skipTax={skip}",
            "input": {"contribution": float(contribution), "duration": years, "rate": float(rate), "skipTax": skip},
            "expected": {"totalContribution": number(total), "finalValue": number(final), "totalInterest": number(interest),
                "tax": number(D(0) if skip else money(interest * D("0.19")))}})

for amount, years, inflation, rate in (("12000", 1, "0", "0"), ("10000", 2, "0.03", "0.12"), ("150000", 15, "0.035", "0.05"), ("10000", 100, "0", "0")):
    for skip in (False, True):
        target = money(D(amount) * (1 + D(inflation)) ** years)
        tax = D(0) if skip else D("0.19")
        weights = cash_flow_weights(years, rate)
        # Each contribution returns its principal plus its after-tax growth.
        monthly = money(target / sum(1 + (weight - 1) * (1 - tax) for weight in weights))
        total = money(monthly * years * 12)
        final = money(monthly * sum(weights))
        interest = final - total
        savings_cases.append({"name": f"goal {amount} in {years} years, inflation={inflation}, rate={rate}, skipTax={skip}",
            "input": {"amount": float(amount), "duration": years, "inflation": float(inflation), "rate": float(rate), "skipTax": skip},
            "expected": {"futureValue": number(target), "monthlyContribution": number(monthly), "totalContribution": number(total),
                "finalValue": number(final), "totalInterest": number(interest), "tax": number(money(interest * tax))}})

reference = {
    "offerVersion": "2026-10-v1",
    "method": "Independent Decimal analytical checkpoints, not snapshots of application output. See scripts/regression/generate-reference.py and docs/TESTY-REGRESJI-KALKULATOROW.md.",
    "bonds": bond_cases, "regularContributions": regular_cases, "savings": savings_cases,
}
target = Path(__file__).resolve().parents[2] / "functions/src/calculations/regression-reference.json"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--check", action="store_true", help="Verify committed reference values without writing them")
args = parser.parse_args()
if args.check:
    if json.loads(target.read_text()) != reference:
        raise SystemExit("Reference values differ from the independent calculations. Review the difference before regenerating.")
    print("PASS: committed reference values match the independent Decimal calculations")
else:
    target.write_text(json.dumps(reference, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(bond_cases)} bond and {len(regular_cases) + len(savings_cases)} savings checkpoints to {target}")
