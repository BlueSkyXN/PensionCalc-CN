<script setup lang="ts">
/**
 * FormulaPanel.vue — 公式说明面板
 *
 * 功能：展示养老金计算公式和计发月数对照表，帮助用户理解计算逻辑。
 *
 * 计算属性：
 *   - divisorRows：将 DIVISOR_BY_AGE 常量对象转换为按年龄升序排列的表格数据
 *     输入：DIVISOR_BY_AGE（退休年龄 → 计发月数映射表）
 *     输出：Array<{ age: number, divisor: number }>
 */
import { computed } from 'vue';
import { DIVISOR_BY_AGE } from '../core/divisor-table';

/** 将计发月数映射表转换为排序后的表格行数据 */
const divisorRows = computed(() =>
  Object.entries(DIVISOR_BY_AGE)
    .map(([age, divisor]) => ({ age: Number(age), divisor }))
    .sort((a, b) => a.age - b.age),
);
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span class="section-label">公式与说明（v1）</span>
    </template>

    <!-- 养老金计算公式说明 -->
    <div class="formula-block">
      <div><strong>总公式：</strong>退休养老金 = 基础养老金 + 个人账户养老金 + 过渡性养老金</div>
      <div><strong>基础养老金：</strong>basic = P × (1 + i) ÷ 2 × n × 1%</div>
      <div><strong>个人账户养老金：</strong>personal = accountBalance ÷ divisorByAge(retireAge)</div>
      <div><strong>v1 范围：</strong>仅城镇职工养老保险，过渡性养老金仅支持手动输入。</div>
    </div>

    <el-divider />

    <!-- 退休年龄与计发月数对照表 -->
    <el-table :data="divisorRows" size="small" border>
      <el-table-column prop="age" label="退休年龄（岁）" />
      <el-table-column prop="divisor" label="计发月数（个月）" />
    </el-table>
  </el-card>
</template>

<style scoped>
/* ── 卡片标题样式 ── */
.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

/* ── 公式展示区块：带边框背景的公式列表 ── */
.formula-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 18px;
  font-size: 13.5px;
  color: var(--text-primary);
  line-height: 1.7;
}

.formula-block strong {
  color: var(--primary);
}
</style>
