/**
 * Vitest 单元测试配置
 * 测试范围：src/core/ 下的纯函数计算层，覆盖率门禁 ≥80%
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',                // 使用 Node.js 环境运行测试（无需浏览器 DOM）
    include: ['src/**/*.test.ts'],      // 测试文件匹配模式
    coverage: {
      provider: 'v8',                   // 使用 V8 引擎内置的覆盖率采集
      reporter: ['text', 'lcov'],       // 终端文本报告 + lcov 格式（可生成 HTML）
      include: ['src/core/**/*.ts'],    // 仅统计核心计算模块的覆盖率
      thresholds: {                     // 覆盖率门禁：任一指标低于 80% 则测试失败
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
