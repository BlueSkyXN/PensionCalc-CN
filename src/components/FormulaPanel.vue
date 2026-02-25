<script setup lang="ts">
import { computed } from 'vue';
import { DIVISOR_BY_AGE } from '../core/divisor-table';

const divisorRows = computed(() =>
  Object.entries(DIVISOR_BY_AGE)
    .map(([age, divisor]) => ({ age: Number(age), divisor }))
    .sort((a, b) => a.age - b.age),
);
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <strong>公式与说明（v1）</strong>
    </template>

    <div class="formula-block">
      <div><strong>总公式：</strong>退休养老金 = 基础养老金 + 个人账户养老金 + 过渡性养老金</div>
      <div><strong>基础养老金：</strong>basic = P × (1 + i) ÷ 2 × n × 1%</div>
      <div><strong>个人账户养老金：</strong>personal = accountBalance ÷ divisorByAge(retireAge)</div>
      <div><strong>v1 范围：</strong>仅城镇职工养老保险，过渡性养老金仅支持手动输入。</div>
    </div>

    <el-divider />

    <el-table :data="divisorRows" size="small" border>
      <el-table-column prop="age" label="退休年龄（岁）" />
      <el-table-column prop="divisor" label="计发月数（个月）" />
    </el-table>
  </el-card>
</template>

<style scoped>
.formula-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
