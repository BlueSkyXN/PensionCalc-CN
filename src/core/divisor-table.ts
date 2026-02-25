import type { RetireAge } from '../types/pension';

export const DIVISOR_BY_AGE: Record<RetireAge, number> = {
  40: 233,
  45: 216,
  50: 195,
  55: 170,
  60: 139,
  65: 101,
  70: 56,
};

export function getDivisorByAge(age: number): number {
  const divisor = DIVISOR_BY_AGE[age as RetireAge];
  if (!divisor) {
    throw new Error(`退休年龄 ${age} 不在计发月数表中。`);
  }
  return divisor;
}
