/**
 * @file 计发月数查表模块
 *
 * 根据《国务院关于完善企业职工基本养老保险制度的决定》(国发〔2005〕38 号)
 * 附表：个人账户养老金计发月数表（退休年龄 40–70 岁）
 *
 * 函数清单：
 *   - getDivisorByAge(age)  按退休年龄查表，返回对应的计发月数
 *
 * 导出常量：
 *   - DIVISOR_BY_AGE        退休年龄 → 计发月数的完整映射 Record
 *
 * 依赖模块：
 *   - types/pension   RetireAge 字面量联合类型（40 | 41 | ... | 70）
 */

import type { RetireAge } from '../types/pension';

/**
 * 退休年龄 → 计发月数映射表
 * 键：退休年龄（40–70 岁整数），值：对应计发月数
 * 年龄越大计发月数越小，反映预期领取年限的递减
 */
export const DIVISOR_BY_AGE: Record<RetireAge, number> = {
  40: 233,
  41: 230,
  42: 226,
  43: 223,
  44: 220,
  45: 216,
  46: 212,
  47: 207,
  48: 204,
  49: 199,
  50: 195,
  51: 190,
  52: 185,
  53: 180,
  54: 175,
  55: 170,
  56: 164,
  57: 158,
  58: 152,
  59: 145,
  60: 139,
  61: 132,
  62: 125,
  63: 117,
  64: 109,
  65: 101,
  66: 93,
  67: 84,
  68: 75,
  69: 65,
  70: 56,
};

/**
 * 按退休年龄查表获取计发月数
 * @param age - 退休年龄（应为 40–70 岁整数）
 * @returns 对应的计发月数
 * @throws 年龄不在表中时抛出 Error
 */
export function getDivisorByAge(age: number): number {
  const divisor = DIVISOR_BY_AGE[age as RetireAge];
  if (!divisor) {
    throw new Error(`退休年龄 ${age} 不在计发月数表中。`);
  }
  return divisor;
}
