import { describe, expect, it } from 'vitest';
import { calculatePension, estimateAccountBalance, resolveAccountBalance } from './pension';
import { getDivisorByAge } from './divisor-table';
import { validatePensionInput } from './validate';
import { DEFAULT_INPUT, type PensionInput } from '../types/pension';

function buildInput(overrides: Partial<PensionInput> = {}): PensionInput {
  return {
    ...DEFAULT_INPUT,
    ...overrides,
  };
}

describe('养老金计算核心逻辑', () => {
  it('按直接输入账户储存额计算退休养老金', () => {
    const output = calculatePension(
      buildInput({
        retireAge: 60,
        P: 7000,
        i: 0.6,
        n: 15,
        accountMode: 'DIRECT_BALANCE',
        accountBalance: 72000,
        enableTransitional: false,
        transitional: 0,
      }),
    );

    expect(output.basic).toBe(840);
    expect(output.personal).toBe(517.99);
    expect(output.total).toBe(1357.99);
    expect(output.divisor).toBe(139);
  });

  it('按估算模式计算个人账户储存额', () => {
    const balance = estimateAccountBalance(5000, 15, 0.08, 0);
    expect(balance).toBe(72000);

    const output = calculatePension(
      buildInput({
        retireAge: 60,
        P: 7000,
        i: 0.6,
        n: 15,
        accountMode: 'ESTIMATE',
        monthlyBase: 5000,
        years: 15,
        personalRate: 0.08,
        annualInterestRate: 0,
        enableTransitional: true,
        transitional: 100,
      }),
    );

    expect(output.accountBalance).toBe(72000);
    expect(output.transitional).toBe(100);
    expect(output.total).toBe(1457.99);
  });
});

describe('计算函数异常路径', () => {
  it('不支持的退休年龄会抛出错误', () => {
    expect(() => getDivisorByAge(61)).toThrow(/不在计发月数表中/);
  });

  it('估算函数对非法参数抛出错误', () => {
    expect(() => estimateAccountBalance(0, 15)).toThrow(/月缴费基数/);
    expect(() => estimateAccountBalance(5000, 0)).toThrow(/缴费年限/);
    expect(() => estimateAccountBalance(5000, 15, 0)).toThrow(/个人费率/);
    expect(() => estimateAccountBalance(5000, 15, 0.08, -0.01)).toThrow(/年利率/);
  });

  it('直接输入模式缺少账户储存额时抛出错误', () => {
    expect(() =>
      resolveAccountBalance(
        buildInput({
          accountMode: 'DIRECT_BALANCE',
          accountBalance: undefined,
        }),
      ),
    ).toThrow(/缺少个人账户储存额/);
  });

  it('整体计算在输入非法时抛出错误', () => {
    expect(() =>
      calculatePension(
        buildInput({
          P: 0,
        }),
      ),
    ).toThrow(/必须大于 0/);
  });
});

describe('输入校验', () => {
  it('缴费年限不足 15 年时返回提示', () => {
    const result = validatePensionInput(
      buildInput({
        n: 10,
      }),
    );

    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((message) => message.includes('不足 15 年'))).toBe(true);
  });

  it('直接输入模式缺少账户储存额时报错', () => {
    const result = validatePensionInput(
      buildInput({
        accountMode: 'DIRECT_BALANCE',
        accountBalance: undefined,
      }),
    );

    expect(result.errors.some((message) => message.includes('个人账户储存额'))).toBe(true);
  });

  it('数值为 NaN 时返回错误', () => {
    const result = validatePensionInput(
      buildInput({
        P: Number.NaN,
      }),
    );

    expect(result.errors.some((message) => message.includes('P'))).toBe(true);
  });

  it('估算模式下非整数缴费年限返回错误', () => {
    const result = validatePensionInput(
      buildInput({
        accountMode: 'ESTIMATE',
        years: 15.5,
      }),
    );

    expect(result.errors.some((message) => message.includes('整数年'))).toBe(true);
  });

  it('估算模式缺少关键字段时返回错误', () => {
    const result = validatePensionInput(
      buildInput({
        accountMode: 'ESTIMATE',
        monthlyBase: 0,
        years: 0,
        personalRate: 0,
        annualInterestRate: -0.01,
      }),
    );

    expect(result.errors.some((message) => message.includes('月缴费基数'))).toBe(true);
    expect(result.errors.some((message) => message.includes('缴费年限'))).toBe(true);
    expect(result.errors.some((message) => message.includes('个人费率'))).toBe(true);
    expect(result.errors.some((message) => message.includes('年利率'))).toBe(true);
  });

  it('基础字段非法时返回错误', () => {
    const result = validatePensionInput(
      buildInput({
        retireAge: 60,
        P: 0,
        i: -0.1,
        n: 0,
      }),
    );

    expect(result.errors.some((message) => message.includes('P'))).toBe(true);
    expect(result.errors.some((message) => message.includes('缴费年限'))).toBe(true);
    expect(result.errors.some((message) => message.includes('平均缴费指数'))).toBe(true);
  });

  it('退休年龄不在表内时返回错误', () => {
    const result = validatePensionInput(
      buildInput({
        retireAge: 61 as unknown as PensionInput['retireAge'],
      }),
    );

    expect(result.errors.some((message) => message.includes('退休年龄'))).toBe(true);
  });

  it('过渡性养老金为负数时返回错误', () => {
    const result = validatePensionInput(
      buildInput({
        enableTransitional: true,
        transitional: -1,
      }),
    );

    expect(result.errors.some((message) => message.includes('过渡性养老金'))).toBe(true);
  });

  it('非法账户模式返回错误', () => {
    const result = validatePensionInput(
      buildInput({
        accountMode: 'INVALID_MODE' as unknown as PensionInput['accountMode'],
      }),
    );

    expect(result.errors.some((message) => message.includes('计算模式无效'))).toBe(true);
  });
});
