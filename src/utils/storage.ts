import type { PensionInput } from '../types/pension';

const STORAGE_KEY = 'pension-calculator-input-v1';

function cloneDefaultInput(defaultValue: PensionInput): PensionInput {
  return { ...defaultValue };
}

export function loadInput(defaultValue: PensionInput): PensionInput {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('[pension-storage] localStorage 读取失败，已回退默认值。', error);
    return cloneDefaultInput(defaultValue);
  }

  if (!raw) {
    return cloneDefaultInput(defaultValue);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error('[pension-storage] localStorage 数据格式无效，已回退默认值。', error);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (removeError) {
      console.error('[pension-storage] localStorage 清理失败。', removeError);
    }
    return cloneDefaultInput(defaultValue);
  }

  if (parsed === null || typeof parsed !== 'object') {
    console.error('[pension-storage] localStorage 数据结构无效，已回退默认值。');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (removeError) {
      console.error('[pension-storage] localStorage 清理失败。', removeError);
    }
    return cloneDefaultInput(defaultValue);
  }

  return {
    ...cloneDefaultInput(defaultValue),
    ...(parsed as Partial<PensionInput>),
  };
}

export function saveInput(input: PensionInput): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch (error) {
    console.error('[pension-storage] localStorage 写入失败。', error);
  }
}
