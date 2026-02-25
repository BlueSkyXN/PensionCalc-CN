export type RetireAge = 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70;

export type AccountMode = 'DIRECT_BALANCE' | 'ESTIMATE';

export interface PensionInput {
  retireAge: RetireAge;
  P: number;
  i: number;
  n: number;
  accountMode: AccountMode;
  accountBalance?: number;
  monthlyBase?: number;
  personalRate?: number;
  years?: number;
  annualInterestRate?: number;
  personalBaseGrowthRate?: number;
  avgWageGrowthRate?: number;
  startYear?: number;
  enableTransitional: boolean;
  transitional: number;
}

export interface WageSnapshot {
  workedYears: number;
  calendarYear: number;
  personalWage: number;
  socialWage: number;
  isRetirement: boolean;
}

export interface PensionOutput {
  basic: number;
  personal: number;
  transitional: number;
  total: number;
  accountBalance: number;
  divisor: number;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export const DEFAULT_INPUT: PensionInput = {
  retireAge: 55,
  P: 7500,
  i: 1.33,
  n: 30,
  accountMode: 'ESTIMATE',
  accountBalance: 72000,
  monthlyBase: 10000,
  personalRate: 0.08,
  years: 30,
  annualInterestRate: 0.035,
  personalBaseGrowthRate: 0.02,
  avgWageGrowthRate: 0.03,
  startYear: 1996,
  enableTransitional: false,
  transitional: 0,
};
