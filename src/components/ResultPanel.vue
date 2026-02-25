<script setup lang="ts">
import type { PensionOutput, WageSnapshot } from '../types/pension';

defineProps<{
  output: PensionOutput | null;
  errors: string[];
  warnings: string[];
  wageSnapshots: WageSnapshot[];
}>();

function fmt(value: number): string {
  return value.toFixed(2);
}

function toWage(value: number): string {
  return value.toFixed(0);
}

function milestoneLabel(s: WageSnapshot): string {
  const base = `工作第 ${s.workedYears} 年 · ${s.calendarYear} 年`;
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
    />
    <el-alert
      v-for="warning in warnings"
      :key="warning"
      :title="warning"
      type="warning"
      :closable="false"
      show-icon
    />

    <el-card v-if="output" shadow="never">
      <template #header>
        <span class="section-label">实时计算结果</span>
      </template>

      <!-- 合计大牌 -->
      <div class="total-banner">
        <div class="total-label">退休养老金合计</div>
        <div class="total-value">
          <span class="total-currency">¥</span>{{ fmt(output.total) }}
          <span class="total-unit">元/月</span>
        </div>
      </div>

      <!-- 三项细目 -->
      <div class="metrics-grid">
        <div class="metric-card metric-basic">
          <div class="metric-label">基础养老金</div>
          <div class="metric-value">¥{{ fmt(output.basic) }}</div>
          <div class="metric-unit">元/月</div>
        </div>
        <div class="metric-card metric-personal">
          <div class="metric-label">个人账户养老金</div>
          <div class="metric-value">¥{{ fmt(output.personal) }}</div>
          <div class="metric-unit">元/月</div>
        </div>
        <div class="metric-card metric-transitional">
          <div class="metric-label">过渡性养老金</div>
          <div class="metric-value">¥{{ fmt(output.transitional) }}</div>
          <div class="metric-unit">元/月</div>
        </div>
      </div>

      <!-- 元信息 -->
      <div class="meta-row">
        <span class="meta-chip">个人账户储存额 <strong>{{ output.accountBalance.toFixed(0) }}</strong> 元</span>
        <span class="meta-chip">计发月数 <strong>{{ output.divisor }}</strong> 个月</span>
        <span class="meta-chip">实际缴费指数 <strong>{{ output.effectiveIndex.toFixed(4) }}</strong></span>
      </div>
    </el-card>

    <el-empty v-else description="请修正输入项后查看结果" />

    <el-card v-if="wageSnapshots.length > 0" shadow="never">
      <template #header>
        <span class="section-label">工资增长预测</span>
      </template>
      <div class="snapshot-list">
        <div
          v-for="s in wageSnapshots"
          :key="s.workedYears"
          class="snapshot-row"
          :class="{ 'is-retirement': s.isRetirement }"
        >
          <div class="snapshot-stage">{{ milestoneLabel(s) }}</div>
          <div class="snapshot-values">
            <div class="snapshot-item">
              <div class="snapshot-item-label">月均个人工资</div>
              <div class="snapshot-item-value">¥{{ toWage(s.personalWage) }}</div>
            </div>
            <div class="snapshot-item">
              <div class="snapshot-item-label">社会平均工资</div>
              <div class="snapshot-item-value">¥{{ toWage(s.socialWage) }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.result-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #7c3aed;
  letter-spacing: 0.03em;
}

/* ── 合计大牌 ── */
.total-banner {
  background: var(--grad-primary);
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

.total-banner::after {
  content: '';
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.total-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
  font-weight: 500;
}

.total-value {
  font-size: 36px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.total-currency {
  font-size: 22px;
  font-weight: 600;
  margin-right: 2px;
  opacity: 0.9;
}

.total-unit {
  font-size: 14px;
  font-weight: 400;
  opacity: 0.75;
  margin-left: 4px;
}

/* ── 三项细目网格 ── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.metric-card {
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 11.5px;
  font-weight: 500;
  opacity: 0.75;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.metric-unit {
  font-size: 11px;
  opacity: 0.6;
}

.metric-basic {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
}

.metric-personal {
  background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
  color: #065f46;
}

.metric-transitional {
  background: linear-gradient(135deg, #fffbeb 0%, #fde68a 100%);
  color: #92400e;
}

/* ── 元信息 chips ── */
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-chip {
  font-size: 12px;
  color: #6b7280;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 20px;
  padding: 3px 12px;
}

.meta-chip strong {
  color: #5b21b6;
}

/* ── 工资快照 ── */
.snapshot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.snapshot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #f3f4f6;
  gap: 12px;
}

.snapshot-row.is-retirement {
  background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%);
  border-color: #ddd6fe;
}

.snapshot-stage {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
  min-width: 0;
  flex: 1;
}

.snapshot-row.is-retirement .snapshot-stage {
  color: #5b21b6;
  font-weight: 600;
}

.snapshot-values {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.snapshot-item {
  text-align: right;
}

.snapshot-item-label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 2px;
}

.snapshot-item-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.snapshot-row.is-retirement .snapshot-item-value {
  color: #6d28d9;
}
</style>
