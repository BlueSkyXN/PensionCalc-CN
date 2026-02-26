<script setup lang="ts">
/**
 * PensionCalculator.vue — 养老金计算器页面容器
 *
 * 功能：协调数据流，连接输入表单、计算引擎和结果展示。
 *
 * 数据流：
 *   InputForm (v-model) → form (reactive) → watch → saveInput (localStorage 持久化)
 *                                         → validation (computed，实时校验)
 *                                         → output (computed，养老金计算结果)
 *                                         → wageSnapshots (computed，工资增长预测)
 *                                         → ResultPanel (props 展示)
 *
 * 响应式变量：
 *   - form (ref<PensionInput>)：从 localStorage 加载的用户输入，支持页面刷新后恢复
 *
 * 计算属性：
 *   - validation：实时校验结果，含 errors（阻断计算）和 warnings（仅提示）
 *   - output：养老金计算结果，校验失败时为 null
 *   - wageSnapshots：工资增长预测快照，在 10/20/30 年及退休年取样
 *
 * Watch：
 *   - form (deep)：输入变化时自动保存到 localStorage
 */
import { computed, ref, watch } from 'vue';
import InputForm from '../components/InputForm.vue';
import ResultPanel from '../components/ResultPanel.vue';
import FormulaPanel from '../components/FormulaPanel.vue';
import { calculatePension } from '../core/pension';
import { validatePensionInput } from '../core/validate';
import { DEFAULT_INPUT, type PensionInput, type PensionOutput, type WageSnapshot } from '../types/pension';
import { loadInput, saveInput } from '../utils/storage';

/** 从 localStorage 加载已保存的输入数据，首次使用时以 DEFAULT_INPUT 为默认值 */
const form = ref<PensionInput>(loadInput(DEFAULT_INPUT));

/** 输入数据变化时自动持久化到 localStorage */
watch(
  form,
  (value) => {
    saveInput(value);
  },
  { deep: true },
);

/** 实时校验用户输入，返回 errors 和 warnings */
const validation = computed(() => validatePensionInput(form.value));

/** 养老金计算结果：存在校验错误时返回 null，不执行计算 */
const output = computed<PensionOutput | null>(() => {
  if (validation.value.errors.length > 0) {
    return null;
  }
  return calculatePension(form.value);
});

/**
 * 工资增长预测快照：仅在估算模式下生成。
 * 在工作第 10/20/30 年和退休年这些里程碑节点取样，
 * 按个人缴费基数增长率和社会平均工资增长率分别推算未来工资。
 */
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
    <!-- 页面顶部标题横幅 -->
    <header class="hero">
      <h1>退休金计算器（城镇职工养老保险）</h1>
      <p>支持预填写、实时计算、公式可解释展示（仅退休当年估算）。</p>
    </header>

    <!-- 左右两栏布局：左侧参数输入，右侧结果展示；移动端上下堆叠 -->
    <el-row :gutter="16">
      <!-- 左栏：参数输入表单 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>
            <span class="section-label">参数输入</span>
          </template>
          <InputForm v-model="form" />
        </el-card>
      </el-col>

      <!-- 右栏：计算结果与工资预测 -->
      <el-col :xs="24" :md="12">
        <ResultPanel :output="output" :errors="validation.errors" :warnings="validation.warnings" :wage-snapshots="wageSnapshots" />
      </el-col>
    </el-row>

    <!-- 底部公式说明区域 -->
    <section class="formula-section">
      <FormulaPanel />
    </section>
  </main>
</template>

<style scoped>
/* ── 页面容器：居中、最大宽度限制 ── */
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 顶部横幅：白色卡片 + 顶部渐变装饰线 ── */
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
