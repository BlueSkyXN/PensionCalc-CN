import type { PensionInput, PensionOutput } from '../types/pension';
import { getDivisorByAge } from './divisor-table';
import { validatePensionInput } from './validate';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function estimateAccountBalance(
  monthlyBase: number,
  years: number,
  personalRate = 0.08,
  annualInterestRate = 0,
  personalBaseGrowthRate = 0,
): number {
  if (!(monthlyBase > 0)) {
    throw new Error('月缴费基数必须大于 0。');
  }
  if (!(years > 0)) {
    throw new Error('缴费年限必须大于 0。');
  }
  if (!(personalRate > 0)) {
    throw new Error('个人费率必须大于 0。');
  }
  if (annualInterestRate < 0) {
    throw new Error('年利率不能为负数。');
  }

  let balance = 0;
  for (let year = 0; year < years; year += 1) {
    const annualContribution = monthlyBase * Math.pow(1 + personalBaseGrowthRate, year) * personalRate * 12;
    balance = balance * (1 + annualInterestRate) + annualContribution;
  }
  return round2(balance);
}

export function computeDynamicIndex(
  monthlyBase: number,
  P: number,
  personalBaseGrowthRate: number,
  avgWageGrowthRate: number,
  years: number,
): number {
  let sum = 0;
  for (let t = 1; t <= years; t += 1) {
    const personalWage = monthlyBase * Math.pow(1 + personalBaseGrowthRate, t - 1);
    const socialWage = P * Math.pow(1 + avgWageGrowthRate, t - 1);
    sum += personalWage / socialWage;
  }
  return Math.round((sum / years) * 10000) / 10000;
}

export function resolveAccountBalance(input: PensionInput): number {
  if (input.accountMode === 'DIRECT_BALANCE') {
    if (input.accountBalance === undefined) {
      throw new Error('直接输入模式缺少个人账户储存额。');
    }
    return input.accountBalance;
  }

  return estimateAccountBalance(
    input.monthlyBase ?? 0,
    input.years ?? 0,
    input.personalRate ?? 0.08,
    input.annualInterestRate ?? 0,
    input.personalBaseGrowthRate ?? 0,
  );
}

export function calculatePension(input: PensionInput): PensionOutput {
  const validation = validatePensionInput(input);
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join(' '));
  }

  const divisor = getDivisorByAge(input.retireAge);
  const accountBalance = round2(resolveAccountBalance(input));
  const projectionYears = input.accountMode === 'ESTIMATE' ? (input.years ?? 0) : 0;
  const P = projectionYears > 0 && (input.avgWageGrowthRate ?? 0) > 0
    ? input.P * Math.pow(1 + (input.avgWageGrowthRate ?? 0), projectionYears)
    : input.P;
  const effectiveIndex =
    input.indexMode === 'DYNAMIC' && input.accountMode === 'ESTIMATE' && projectionYears > 0
      ? computeDynamicIndex(
          input.monthlyBase ?? 0,
          input.P,
          input.personalBaseGrowthRate ?? 0,
          input.avgWageGrowthRate ?? 0,
          projectionYears,
        )
      : input.i;
  const basic = round2((P * (1 + effectiveIndex) * input.n * 0.01) / 2);
  const personal = round2(accountBalance / divisor);
  const transitional = round2(input.enableTransitional ? input.transitional : 0);
  const total = round2(basic + personal + transitional);

  return {
    basic,
    personal,
    transitional,
    total,
    accountBalance,
    divisor,
    effectiveIndex,
  };
}
