<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import InputForm from '../components/InputForm.vue';
import ResultPanel from '../components/ResultPanel.vue';
import FormulaPanel from '../components/FormulaPanel.vue';
import { calculatePension } from '../core/pension';
import { validatePensionInput } from '../core/validate';
import { DEFAULT_INPUT, type PensionInput, type PensionOutput, type WageSnapshot } from '../types/pension';
import { loadInput, saveInput } from '../utils/storage';

const form = ref<PensionInput>(loadInput(DEFAULT_INPUT));

watch(
  form,
  (value) => {
    saveInput(value);
  },
  { deep: true },
);

const validation = computed(() => validatePensionInput(form.value));

const output = computed<PensionOutput | null>(() => {
  if (validation.value.errors.length > 0) {
    return null;
  }
  return calculatePension(form.value);
});

const wageSnapshots = computed<WageSnapshot[]>(() => {
  const f = form.value;
  if (f.accountMode !== 'ESTIMATE' || !f.years || f.years <= 0 || !f.monthlyBase) return [];

  const startYear = f.startYear ?? 1996;
  const monthlyBase = f.monthlyBase;
  const baseGrowth = f.personalBaseGrowthRate ?? 0;
  const wageGrowth = f.avgWageGrowthRate ?? 0;
  const totalYears = f.years;

  const milestones = new Set<number>([10]);
  if (totalYears >= 20) milestones.add(20);
  if (totalYears >= 30) milestones.add(30);
  milestones.add(totalYears);

  return [...milestones].sort((a, b) => a - b).map((y) => ({
    workedYears: y,
    calendarYear: startYear + y,
    personalWage: Math.round(monthlyBase * Math.pow(1 + baseGrowth, y) * 100) / 100,
    socialWage: Math.round(f.P * Math.pow(1 + wageGrowth, y) * 100) / 100,
    isRetirement: y === totalYears,
  }));
});
</script>

<template>
  <main class="page">
    <header class="hero">
      <h1>退休金计算器（城镇职工养老保险）</h1>
      <p>支持预填写、实时计算、公式可解释展示（仅退休当年估算）。</p>
    </header>

    <el-row :gutter="16">
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>
            <span class="section-label">参数输入</span>
          </template>
          <InputForm v-model="form" />
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <ResultPanel :output="output" :errors="validation.errors" :warnings="validation.warnings" :wage-snapshots="wageSnapshots" />
      </el-col>
    </el-row>

    <section class="formula-section">
      <FormulaPanel />
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary) 0%, #60a5fa 50%, #34d399 100%);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.hero h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.hero p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13.5px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

.formula-section {
  margin-bottom: 8px;
}
</style>
