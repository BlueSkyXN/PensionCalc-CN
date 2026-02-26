/**
 * @file 养老金输入校验模块 —— 纯函数，零 UI 依赖
 *
 * 函数清单：
 *   - isSupportedAge(age)          类型守卫：检查退休年龄是否在计发月数表中（40–70 岁）
 *   - isFiniteNumber(value)        类型守卫：检查值是否为有限数字（排除 NaN / Infinity）
 *   - validatePensionInput(input)  校验所有输入字段，返回 { errors[], warnings[] }
 *
 * 校验规则：
 *   - errors 非空时阻断计算，warnings 仅做提示
 *   - 根据 accountMode 切换校验分支（DIRECT_BALANCE / ESTIMATE）
 *   - 过渡性养老金仅在开启时校验
 *
 * 依赖模块：
 *   - divisor-table   DIVISOR_BY_AGE 映射表，用于校验退休年龄
 *   - types/pension   PensionInput / RetireAge / ValidationResult 类型
 */

import { DIVISOR_BY_AGE } from './divisor-table';
import type { PensionInput, RetireAge, ValidationResult } from '../types/pension';

/**
 * 类型守卫：判断退休年龄是否在计发月数表中
 * @param age - 待检查的年龄值
 * @returns 如果 age 是 DIVISOR_BY_AGE 的合法键则返回 true
 */
function isSupportedAge(age: number): age is RetireAge {
  return Object.prototype.hasOwnProperty.call(DIVISOR_BY_AGE, age);
}

/**
 * 类型守卫：判断值是否为有限数字（排除 NaN、±Infinity、非 number 类型）
 * @param value - 待检查的值
 * @returns 如果 value 是有限数字则返回 true
 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * 校验养老金计算输入参数的合法性
 *
 * 校验顺序：基础字段（P / n / i / retireAge）→ 账户模式分支 → 过渡性养老金
 * - errors：存在时阻断计算流程
 * - warnings：仅做提示（如缴费年限不足 15 年）
 *
 * @param input - 完整的养老金输入参数
 * @returns ValidationResult { errors: string[], warnings: string[] }
 */
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
    errors.push('退休年龄必须在计发月数表中（40–70 岁整数）。');
  }

  // ---- 账户模式校验 ----
  if (input.accountMode !== 'DIRECT_BALANCE' && input.accountMode !== 'ESTIMATE') {
    errors.push('个人账户计算模式无效。');
    // 模式非法时无法继续后续分支校验，提前返回
    return { errors, warnings };
  }

  // ---- 按模式分支校验账户相关字段 ----
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

  // ---- 过渡性养老金校验（仅在开启时检查） ----
  if (input.enableTransitional && (!isFiniteNumber(input.transitional) || input.transitional < 0)) {
    errors.push('过渡性养老金必须大于等于 0。');
  }

  return { errors, warnings };
}
