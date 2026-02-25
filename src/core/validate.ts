import { DIVISOR_BY_AGE } from './divisor-table';
import type { PensionInput, RetireAge, ValidationResult } from '../types/pension';

function isSupportedAge(age: number): age is RetireAge {
  return Object.prototype.hasOwnProperty.call(DIVISOR_BY_AGE, age);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validatePensionInput(input: PensionInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isFiniteNumber(input.P) || input.P <= 0) {
    errors.push('退休上年度当地在岗职工月平均工资（P）必须大于 0。');
  }

  if (!isFiniteNumber(input.n) || input.n <= 0) {
    errors.push('累计缴费年限（n）必须大于 0。');
  }

  if (isFiniteNumber(input.n) && input.n < 15) {
    warnings.push('累计缴费年限不足 15 年，可能影响待遇资格，具体以当地政策为准。');
  }

  if (!isFiniteNumber(input.i) || input.i < 0) {
    errors.push('平均缴费指数（i）必须大于等于 0。');
  }

  if (!isFiniteNumber(input.retireAge) || !isSupportedAge(input.retireAge)) {
    errors.push('退休年龄必须在计发月数表中（40/45/50/55/60/65/70）。');
  }

  if (input.accountMode !== 'DIRECT_BALANCE' && input.accountMode !== 'ESTIMATE') {
    errors.push('个人账户计算模式无效。');
    return { errors, warnings };
  }

  if (input.accountMode === 'DIRECT_BALANCE') {
    if (!isFiniteNumber(input.accountBalance) || input.accountBalance < 0) {
      errors.push('直接输入模式下，个人账户储存额必须填写且大于等于 0。');
    }
  } else {
    if (!isFiniteNumber(input.monthlyBase) || input.monthlyBase <= 0) {
      errors.push('估算模式下，月缴费基数必须大于 0。');
    }
    if (!isFiniteNumber(input.years) || input.years <= 0) {
      errors.push('估算模式下，缴费年限必须大于 0。');
    } else if (!Number.isInteger(input.years)) {
      errors.push('估算模式下，缴费年限必须为整数年。');
    }
    if (!isFiniteNumber(input.personalRate) || input.personalRate <= 0) {
      errors.push('估算模式下，个人费率必须大于 0。');
    }
    if (
      input.annualInterestRate !== undefined &&
      (!isFiniteNumber(input.annualInterestRate) || input.annualInterestRate < 0)
    ) {
      errors.push('估算模式下，年利率不能为负数。');
    }
  }

  if (input.enableTransitional && (!isFiniteNumber(input.transitional) || input.transitional < 0)) {
    errors.push('过渡性养老金必须大于等于 0。');
  }

  return { errors, warnings };
}
