/**
 * @file localStorage 持久化工具模块
 *
 * 负责将用户的计算器输入参数（PensionInput）存取于浏览器 localStorage，
 * 以实现页面刷新后数据恢复。
 *
 * 导出函数：
 *   loadInput(defaultValue)  — 读取已保存的输入，数据损坏时自动清理并回退默认值
 *   saveInput(input)         — 将当前输入序列化后写入 localStorage
 *
 * 内部函数：
 *   cloneDefaultInput(defaultValue) — 浅拷贝默认值，避免外部引用被意外修改
 *
 * 依赖：../types/pension — PensionInput 接口
 */

import type { PensionInput } from '../types/pension';

/** localStorage 存储键名，带版本号以便未来数据迁移 */
const STORAGE_KEY = 'pension-calculator-input-v1';

/**
 * 浅拷贝默认输入值
 * @param defaultValue - 默认输入参数对象
 * @returns 一份独立的浅拷贝，防止调用方修改原始默认值
 */
function cloneDefaultInput(defaultValue: PensionInput): PensionInput {
  return { ...defaultValue };
}

/**
 * 从 localStorage 恢复用户输入
 *
 * 处理策略（防御性设计）：
 *   1. localStorage 不可用（隐私模式等） → 回退默认值
 *   2. 无已保存数据 → 回退默认值
 *   3. JSON 解析失败（数据损坏） → 清除脏数据，回退默认值
 *   4. 数据不是对象 → 清除脏数据，回退默认值
 *   5. 正常 → 以默认值为底，合并已保存字段（保证新增字段有值）
 *
 * @param defaultValue - 回退用的默认输入参数
 * @returns 合并后的完整 PensionInput 对象
 */
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

  // 以默认值为底合并：保证接口新增字段始终有值，同时保留用户已保存的旧字段
  return {
    ...cloneDefaultInput(defaultValue),
    ...(parsed as Partial<PensionInput>),
  };
}

/**
 * 将用户输入持久化到 localStorage
 * @param input - 当前完整的计算器输入参数
 */
export function saveInput(input: PensionInput): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch (error) {
    console.error('[pension-storage] localStorage 写入失败。', error);
  }
}
