/**
 * @file 养老金计算器 — TypeScript 类型定义与默认常量
 *
 * 定义计算器全部数据结构，供 core/ 计算层和 components/ 展示层共享。
 *
 * 导出内容：
 *   类型：RetireAge, AccountMode, IndexMode, PensionInput, WageSnapshot,
 *         PensionOutput, ValidationResult
 *   常量：DEFAULT_INPUT — 计算器初始默认值
 *
 * 无外部依赖。
 */

/**
 * 退休年龄字面量联合类型，限制为 40-70 岁整数。
 * 与 divisor-table.ts 中的计发月数表一一对应。
 */
export type RetireAge = 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70;

/** 个人账户计算模式：DIRECT_BALANCE 直接输入余额 | ESTIMATE 按参数估算 */
export type AccountMode = 'DIRECT_BALANCE' | 'ESTIMATE';
/** 缴费指数模式：STATIC 使用固定值 i | DYNAMIC 按工资增长率逐年计算 */
export type IndexMode = 'STATIC' | 'DYNAMIC';

/**
 * 养老金计算器输入参数接口
 *
 * 必选字段为基础养老金公式所需参数，
 * 可选字段（带 ?）仅在对应模式下使用：
 *   - accountMode='DIRECT_BALANCE' 时使用 accountBalance
 *   - accountMode='ESTIMATE' 时使用 monthlyBase / personalRate / years / annualInterestRate 等
 *   - indexMode='DYNAMIC' 时使用 personalBaseGrowthRate / avgWageGrowthRate / startYear
 */
export interface PensionInput {
  /** 退休年龄（岁），决定计发月数 */
  retireAge: RetireAge;
  /** 退休时上年度社会平均工资（元/月） */
  P: number;
  /** 本人平均缴费工资指数（如 1.33 表示社平的 133%） */
  i: number;
  /** 累计缴费年限（年） */
  n: number;
  /** 个人账户计算模式 */
  accountMode: AccountMode;
  /** 个人账户累计余额（元），accountMode='DIRECT_BALANCE' 时使用 */
  accountBalance?: number;
  /** 当前月缴费基数（元），用于估算个人账户 */
  monthlyBase?: number;
  /** 个人缴费比例（如 0.08 = 8%），用于估算个人账户 */
  personalRate?: number;
  /** 预计还需缴费年数（年），用于估算个人账户 */
  years?: number;
  /** 个人账户记账年利率（如 0.035 = 3.5%） */
  annualInterestRate?: number;
  /** 个人缴费基数年增长率（如 0.01 = 1%），indexMode='DYNAMIC' 时使用 */
  personalBaseGrowthRate?: number;
  /** 社会平均工资年增长率（如 0.03 = 3%），indexMode='DYNAMIC' 时使用 */
  avgWageGrowthRate?: number;
  /** 动态指数计算起始年份（日历年），indexMode='DYNAMIC' 时使用 */
  startYear?: number;
  /** 缴费指数模式 */
  indexMode: IndexMode;
  /** 是否启用过渡性养老金 */
  enableTransitional: boolean;
  /** 过渡性养老金金额（元/月），手动输入 */
  transitional: number;
}

/**
 * 工资增长预测快照
 *
 * 动态指数模式下，逐年记录个人工资与社会平均工资的变化，
 * 用于计算各年度缴费指数并取平均值。
 */
export interface WageSnapshot {
  /** 已缴费年数（从 1 开始计） */
  workedYears: number;
  /** 对应日历年份 */
  calendarYear: number;
  /** 当年个人月缴费工资（元） */
  personalWage: number;
  /** 当年社会平均月工资（元） */
  socialWage: number;
  /** 是否为退休当年 */
  isRetirement: boolean;
}

/**
 * 养老金计算结果输出接口
 *
 * 退休养老金 = basic + personal + transitional
 */
export interface PensionOutput {
  /** 基础养老金（元/月）：P × (1 + i) / 2 × n × 1% */
  basic: number;
  /** 个人账户养老金（元/月）：accountBalance / 计发月数 */
  personal: number;
  /** 过渡性养老金（元/月） */
  transitional: number;
  /** 月总退休金（元） */
  total: number;
  /** 个人账户累计余额（元），可能为输入值或估算值 */
  accountBalance: number;
  /** 计发月数，由退休年龄查表得出 */
  divisor: number;
  /** 实际使用的缴费指数（静态时等于 i，动态时为加权平均值） */
  effectiveIndex: number;
}

/**
 * 输入校验结果
 *
 * errors 非空时阻断计算；warnings 仅提示用户。
 */
export interface ValidationResult {
  /** 错误信息列表，存在时阻止计算 */
  errors: string[];
  /** 警告信息列表，不阻止计算 */
  warnings: string[];
}

/**
 * 计算器默认输入参数
 *
 * 页面初始化和 localStorage 数据损坏时的回退值。
 * 场景假设：55 岁退休、社平 7500、缴费指数 1.33、缴费 30 年。
 */
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
  personalBaseGrowthRate: 0.01,
  avgWageGrowthRate: 0.03,
  startYear: 2025,
  indexMode: 'STATIC',
  enableTransitional: false,
  transitional: 0,
};
