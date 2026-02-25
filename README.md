# 退休金计算器（城镇职工养老保险）

基于 Vue 3 + TypeScript + Element Plus 的纯前端退休金计算器，实现城镇职工养老保险退休当年预计月养老金计算。

## 功能范围（v1）

- 支持总公式：`退休养老金 = 基础养老金 + 个人账户养老金 + 过渡性养老金`
- 支持基础养老金、个人账户养老金实时计算
- 支持个人账户两种模式：
  - 直接输入账户储存额
  - 按缴费参数估算账户储存额（个人费率默认 8%，可作为模拟参数调整）
- 支持过渡性养老金开关与手动输入（默认 0）
- 支持 `localStorage` 预填与实时保存
- 支持边界校验和缴费年限不足提示

## 快速开始

```bash
npm install
npm run dev
```

## 构建与测试

```bash
npm run build
npm run test
npm run test:coverage
```

## 关键公式

- 基础养老金：`basic = P * (1 + i) / 2 * n * 0.01`
- 个人账户养老金：`personal = accountBalance / divisorByAge(retireAge)`
- 合计：`total = basic + personal + transitional`

## 目录结构

```text
src/
  pages/
    PensionCalculator.vue
  components/
    InputForm.vue
    ResultPanel.vue
    FormulaPanel.vue
  core/
    pension.ts
    divisor-table.ts
    validate.ts
  types/
    pension.ts
  utils/
    storage.ts
```

## 说明

- 本项目仅覆盖城镇职工养老保险，不包含城乡居民养老保险算法。
- 过渡性养老金 v1 暂不做省份规则拆分，采用手动输入模式。
