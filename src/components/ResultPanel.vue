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

      <!-- 合计横幅 -->
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
        <span class="meta-chip">账户储存额 <strong>{{ output.accountBalance.toFixed(0) }}</strong> 元</span>
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
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

/* ── 合计横幅 ── */
.total-banner {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: var(--radius);
  padding: 18px 22px;
  margin-bottom: 14px;
  position: relative;
  overflow: hidden;
}

.total-banner::after {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
  border-radius: 50%;
}

.total-label {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 4px;
  font-weight: 500;
}

.total-value {
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
  letter-spacing: -0.5px;
}

.total-currency {
  font-size: 20px;
  font-weight: 600;
  margin-right: 1px;
  opacity: 0.85;
}

.total-unit {
  font-size: 13px;
  font-weight: 400;
  opacity: 0.7;
  margin-left: 4px;
}

/* ── 三项细目 ── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.metric-card {
  border-radius: var(--radius);
  padding: 12px 14px;
  border: 1px solid transparent;
}

.metric-label {
  font-size: 11.5px;
  font-weight: 500;
  margin-bottom: 4px;
  opacity: 0.8;
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.metric-unit {
  font-size: 11px;
  margin-top: 2px;
  opacity: 0.6;
}

.metric-basic {
  background: rgba(59, 130, 246, 0.07);
  border-color: rgba(59, 130, 246, 0.18);
  color: #1d4ed8;
}

.metric-personal {
  background: rgba(16, 185, 129, 0.07);
  border-color: rgba(16, 185, 129, 0.18);
  color: #065f46;
}

.metric-transitional {
  background: rgba(245, 158, 11, 0.07);
  border-color: rgba(245, 158, 11, 0.18);
  color: #92400e;
}

/* ── 元信息 chips ── */
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-chip {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 9999px;
  padding: 3px 10px;
}

.meta-chip strong {
  color: var(--text-secondary);
  font-weight: 600;
}

/* ── 工资快照 ── */
.snapshot-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.snapshot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: var(--radius);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  gap: 12px;
  transition: background var(--transition);
}

.snapshot-row.is-retirement {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

.snapshot-stage {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.snapshot-row.is-retirement .snapshot-stage {
  color: var(--primary);
  font-weight: 600;
}

.snapshot-values {
  display: flex;
  gap: 20px;
  flex-shrink: 0;
}

.snapshot-item {
  text-align: right;
}

.snapshot-item-label {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.snapshot-item-value {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.snapshot-row.is-retirement .snapshot-item-value {
  color: var(--primary);
}
</style>
