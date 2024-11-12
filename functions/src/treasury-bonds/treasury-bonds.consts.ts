import { Indexation, TreasuryBonds } from './treasury-bonds.model';

export const ROR: TreasuryBonds = {
  name: 'ROR',
  maturityInMonths: 12,
  firstPeriodRate: 0.0575,
  rateUpdateInMonths: 1,
  indexation: Indexation.referenceRate,
  margin: 0,
  paymentOfInterestInMonths: 1,
  capitalizationOfInterestInMonths: 0,
  exchangeCost: 99.9,
  earlyBuyoutCost: 0.5,
  buyoutProtectionInMonths: 1,
};

export const DOR: TreasuryBonds = {
  name: 'DOR',
  maturityInMonths: 24,
  firstPeriodRate: 0.059,
  rateUpdateInMonths: 1,
  indexation: Indexation.referenceRate,
  margin: 0.0015,
  paymentOfInterestInMonths: 1,
  capitalizationOfInterestInMonths: 0,
  exchangeCost: 99.9,
  earlyBuyoutCost: 0.7,
  buyoutProtectionInMonths: 1,
};

export const TOS: TreasuryBonds = {
  name: 'TOS',
  maturityInMonths: 36,
  firstPeriodRate: 0.0595,
  rateUpdateInMonths: 36,
  indexation: Indexation.wibor6m,
  margin: 0,
  paymentOfInterestInMonths: 0,
  capitalizationOfInterestInMonths: 12,
  exchangeCost: 99.9,
  earlyBuyoutCost: 1,
  buyoutProtectionInMonths: 144,
};

export const COI: TreasuryBonds = {
  name: 'COI',
  maturityInMonths: 48,
  firstPeriodRate: 0.063,
  rateUpdateInMonths: 12,
  indexation: Indexation.inflation,
  margin: 0.015,
  paymentOfInterestInMonths: 12,
  capitalizationOfInterestInMonths: 0,
  exchangeCost: 99.9,
  earlyBuyoutCost: 2,
  buyoutProtectionInMonths: 12,
};

export const EDO: TreasuryBonds = {
  name: 'EDO',
  maturityInMonths: 120,
  firstPeriodRate: 0.0655,
  rateUpdateInMonths: 12,
  indexation: Indexation.inflation,
  margin: 0.02,
  paymentOfInterestInMonths: 0,
  capitalizationOfInterestInMonths: 12,
  exchangeCost: 99.9,
  earlyBuyoutCost: 3,
  buyoutProtectionInMonths: 144,
};

export const ROS: TreasuryBonds = {
  name: 'ROS',
  maturityInMonths: 72,
  firstPeriodRate: 0.057,
  rateUpdateInMonths: 12,
  indexation: Indexation.inflation,
  margin: 0.015,
  paymentOfInterestInMonths: 0,
  capitalizationOfInterestInMonths: 12,
  exchangeCost: 100,
  earlyBuyoutCost: 0.7,
  buyoutProtectionInMonths: 144,
};

export const ROD: TreasuryBonds = {
  name: 'ROD',
  maturityInMonths: 144,
  firstPeriodRate: 0.06,
  rateUpdateInMonths: 12,
  indexation: Indexation.inflation,
  margin: 0.0175,
  paymentOfInterestInMonths: 0,
  capitalizationOfInterestInMonths: 12,
  exchangeCost: 100,
  earlyBuyoutCost: 2,
  buyoutProtectionInMonths: 144,
};
