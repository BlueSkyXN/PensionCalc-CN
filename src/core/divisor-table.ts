import type { RetireAge } from '../types/pension';

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

export function getDivisorByAge(age: number): number {
  const divisor = DIVISOR_BY_AGE[age as RetireAge];
  if (!divisor) {
    throw new Error(`退休年龄 ${age} 不在计发月数表中。`);
  }
  return divisor;
}
