export type RetireAge = 40 | 45 | 50 | 55 | 60 | 65 | 70;

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
  enableTransitional: boolean;
  transitional: number;
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
  retireAge: 60,
  P: 7000,
  i: 0.6,
  n: 15,
  accountMode: 'DIRECT_BALANCE',
  accountBalance: 72000,
  monthlyBase: 5000,
  personalRate: 0.08,
  years: 15,
  annualInterestRate: 0,
  enableTransitional: false,
  transitional: 0,
};
