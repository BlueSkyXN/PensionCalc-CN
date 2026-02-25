<script setup lang="ts">
import type { PensionOutput, WageSnapshot } from '../types/pension';

defineProps<{
  output: PensionOutput | null;
  errors: string[];
  warnings: string[];
  wageSnapshots: WageSnapshot[];
}>();

function toCurrency(value: number): string {
  return `${value.toFixed(2)} 元/月`;
}

function toWage(value: number): string {
  return `${value.toFixed(0)} 元`;
}

function milestoneLabel(s: WageSnapshot): string {
  const base = `工作第 ${s.workedYears} 年（${s.calendarYear} 年）`;
  return s.isRetirement ? `${base} · 退休时` : base;
}
</script>

<template>
  <div class="result-panel">
    <el-alert
      v-for="error in errors"
      :key="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      class="result-alert"
    />
    <el-alert
      v-for="warning in warnings"
      :key="warning"
      :title="warning"
      type="warning"
      :closable="false"
      show-icon
      class="result-alert"
    />

    <el-card v-if="output" shadow="never">
      <template #header>
        <strong>实时计算结果</strong>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="基础养老金">
          {{ toCurrency(output.basic) }}
        </el-descriptions-item>
        <el-descriptions-item label="个人账户养老金">
          {{ toCurrency(output.personal) }}
        </el-descriptions-item>
        <el-descriptions-item label="过渡性养老金">
          {{ toCurrency(output.transitional) }}
        </el-descriptions-item>
        <el-descriptions-item label="退休养老金合计">
          <strong class="total">{{ toCurrency(output.total) }}</strong>
        </el-descriptions-item>
      </el-descriptions>
      <div class="meta">
        个人账户储存额：{{ output.accountBalance.toFixed(2) }} 元；
        计发月数：{{ output.divisor }} 个月；
        实际使用缴费指数：{{ output.effectiveIndex.toFixed(4) }}
      </div>
    </el-card>

    <el-empty v-else description="请修正输入项后查看结果" />

    <el-card v-if="wageSnapshots.length > 0" shadow="never">
      <template #header>
        <strong>工资增长预测</strong>
      </template>
      <el-table :data="wageSnapshots" size="small" border>
        <el-table-column label="阶段" min-width="200">
          <template #default="{ row }">
            <span :class="{ 'retirement-row': row.isRetirement }">{{ milestoneLabel(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="月均个人工资" align="right" min-width="130">
          <template #default="{ row }">
            <span :class="{ 'retirement-row': row.isRetirement }">{{ toWage(row.personalWage) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="社会平均工资" align="right" min-width="130">
          <template #default="{ row }">
            <span :class="{ 'retirement-row': row.isRetirement }">{{ toWage(row.socialWage) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.result-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-alert {
  margin-bottom: 4px;
}

.meta {
  margin-top: 12px;
  color: #606266;
  font-size: 13px;
}

.total {
  color: #1d4ed8;
}

.retirement-row {
  color: #1d4ed8;
  font-weight: 600;
}
</style>
