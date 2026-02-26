/**
 * @file 养老金计算核心模块 —— 纯函数，零 UI 依赖，可在 Node.js 环境复用
 *
 * 函数清单：
 *   - round2(value)                    辅助：四舍五入保留两位小数
 *   - estimateAccountBalance(...)      按缴费参数估算个人账户累计余额（复利累积模型）
 *   - computeDynamicIndex(...)         动态计算平均缴费指数（逐年个人工资/社平工资比值求均）
 *   - resolveAccountBalance(input)     根据 accountMode 决定直接取值或调用估算
 *   - calculatePension(input)          主入口：校验 → 组合基础 + 个人账户 + 过渡性养老金
 *
 * 核心公式：
 *   基础养老金   = P × (1 + i) / 2 × n × 1%
 *   个人账户养老金 = accountBalance / divisor
 *   退休养老金   = 基础 + 个人账户 + 过渡性
 *
 * 依赖模块：
 *   - types/pension   PensionInput / PensionOutput 接口定义
 *   - divisor-table   计发月数查表
 *   - validate        输入合法性校验
 */

import type { PensionInput, PensionOutput } from '../types/pension';
import { getDivisorByAge } from './divisor-table';
import { validatePensionInput } from './validate';

/**
 * 四舍五入保留两位小数
 * @param value - 原始数值
 * @returns 保留两位小数的结果
 * @remarks 加 Number.EPSILON 修正浮点精度（如 1.005 → 1.01 而非 1.00）
 */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * 按缴费参数估算个人账户累计余额（复利累积模型）
 *
 * 逐年计算：每年缴费额 = monthlyBase × (1 + 基数增长率)^year × personalRate × 12
 * 余额滚存：balance = 上年余额 × (1 + 年利率) + 当年缴费额
 *
 * @param monthlyBase           - 首年月缴费基数（元）
 * @param years                 - 缴费年限（整数年）
 * @param personalRate          - 个人缴费费率，默认 8%
 * @param annualInterestRate    - 个人账户年记账利率，默认 0
 * @param personalBaseGrowthRate - 缴费基数年增长率，默认 0
 * @returns 累计个人账户余额（元，保留两位小数）
 * @throws 参数不合法时抛出 Error
 */
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
    // 当年缴费额：基数按增长率逐年递增，乘以费率和 12 个月
    const annualContribution = monthlyBase * Math.pow(1 + personalBaseGrowthRate, year) * personalRate * 12;
    // 上年余额按利率增值后加上当年缴费额（先息后本）
    balance = balance * (1 + annualInterestRate) + annualContribution;
  }
  return round2(balance);
}

/**
 * 动态计算平均缴费指数
 *
 * 公式：i_dynamic = (1/years) × Σ(personalWage_t / socialWage_t), t = 1..years
 * 即每年「个人缴费工资 / 当地社平工资」比值的算术平均
 *
 * @param monthlyBase           - 首年个人月缴费基数
 * @param P                     - 首年当地在岗职工月平均工资
 * @param personalBaseGrowthRate - 个人缴费基数年增长率
 * @param avgWageGrowthRate     - 社平工资年增长率
 * @param years                 - 缴费年限
 * @returns 平均缴费指数（保留 4 位小数）
 */
export function computeDynamicIndex(
  monthlyBase: number,
  P: number,
  personalBaseGrowthRate: number,
  avgWageGrowthRate: number,
  years: number,
): number {
  let sum = 0;
  for (let t = 1; t <= years; t += 1) {
    // 第 t 年个人缴费工资（按增长率递增）
    const personalWage = monthlyBase * Math.pow(1 + personalBaseGrowthRate, t - 1);
    // 第 t 年社平工资（按增长率递增）
    const socialWage = P * Math.pow(1 + avgWageGrowthRate, t - 1);
    sum += personalWage / socialWage;
  }
  // 保留 4 位小数
  return Math.round((sum / years) * 10000) / 10000;
}

/**
 * 根据 accountMode 解析个人账户余额
 * - DIRECT_BALANCE：直接取用户输入的 accountBalance
 * - ESTIMATE：调用 estimateAccountBalance() 按参数估算
 *
 * @param input - 完整的养老金输入参数
 * @returns 个人账户余额（元）
 * @throws 直接输入模式下缺少 accountBalance 时抛出 Error
 */
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

/**
 * 养老金计算主入口
 *
 * 流程：校验输入 → 查计发月数 → 解析账户余额 → 推算退休时社平工资
 *      → 确定缴费指数 → 计算基础/个人账户/过渡性养老金 → 汇总
 *
 * @param input - 完整的养老金输入参数（PensionInput）
 * @returns PensionOutput，包含各分项金额、账户余额、计发月数、实际缴费指数
 * @throws 输入校验失败时抛出 Error（包含所有错误信息）
 */
export function calculatePension(input: PensionInput): PensionOutput {
  const validation = validatePensionInput(input);
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join(' '));
  }

  const divisor = getDivisorByAge(input.retireAge);
  const accountBalance = round2(resolveAccountBalance(input));
  const projectionYears = input.accountMode === 'ESTIMATE' ? (input.years ?? 0) : 0;
  // 若处于估算模式且存在社平工资增长率，将 P 推算至退休年份
  const P = projectionYears > 0 && (input.avgWageGrowthRate ?? 0) > 0
    ? input.P * Math.pow(1 + (input.avgWageGrowthRate ?? 0), projectionYears)
    : input.P;
  // 动态指数模式下自动计算平均缴费指数，否则使用用户手动输入的 i
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
  // 基础养老金 = P × (1 + i) / 2 × n × 1%
  const basic = round2((P * (1 + effectiveIndex) * input.n * 0.01) / 2);
  // 个人账户养老金 = 账户余额 / 计发月数
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
