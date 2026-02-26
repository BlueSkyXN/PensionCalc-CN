<script setup lang="ts">
/**
 * InputForm.vue — 养老金计算参数输入表单组件
 *
 * 功能：收集用户输入的养老金计算参数，通过 defineModel 实现与父组件的双向绑定。
 *
 * 主要变量/计算属性：
 *   - model (defineModel<PensionInput>)：双向绑定的表单数据对象
 *   - divisor (computed)：根据退休年龄查表得到的计发月数
 *   - personalRatePct / annualInterestRatePct / personalBaseGrowthRatePct / avgWageGrowthRatePct
 *       (computed get/set)：百分比 ↔ 小数双向转换，UI 显示百分比，数据层存储小数
 *   - indexModes：缴费指数模式选项（固定值 / 动态计算）
 *   - accountModes：个人账户计算模式选项（直接输入余额 / 按参数估算）
 *   - dynamicIndex (computed)：在估算模式下自动计算的动态缴费指数
 *
 * Watch：
 *   - enableTransitional：关闭过渡性养老金开关时自动将金额归零
 */
import { computed, watch } from 'vue';
import { DIVISOR_BY_AGE } from '../core/divisor-table';
import type { AccountMode, IndexMode, PensionInput, RetireAge } from '../types/pension';
import { computeDynamicIndex } from '../core/pension';

const model = defineModel<PensionInput>({ required: true });

/** 根据退休年龄从计发月数表查找对应月数，未匹配时显示 '-' */
const divisor = computed(() => DIVISOR_BY_AGE[model.value.retireAge as RetireAge] ?? '-');

/**
 * 以下四个 computed 均为百分比 ↔ 小数双向转换：
 * - get: 将数据层的小数值（如 0.08）转换为百分比（如 8）供 UI 展示
 * - set: 将用户输入的百分比值转换回小数存入数据层
 */
const personalRatePct = computed({
  get: () => Number(((model.value.personalRate ?? 0) * 100).toFixed(4)),
  set: (v: number) => { model.value.personalRate = v / 100; },
});

const annualInterestRatePct = computed({
  get: () => Number(((model.value.annualInterestRate ?? 0) * 100).toFixed(4)),
  set: (v: number) => { model.value.annualInterestRate = v / 100; },
});

const personalBaseGrowthRatePct = computed({
  get: () => Number(((model.value.personalBaseGrowthRate ?? 0) * 100).toFixed(4)),
  set: (v: number) => { model.value.personalBaseGrowthRate = v / 100; },
});

const avgWageGrowthRatePct = computed({
  get: () => Number(((model.value.avgWageGrowthRate ?? 0) * 100).toFixed(4)),
  set: (v: number) => { model.value.avgWageGrowthRate = v / 100; },
});

/** 缴费指数模式选项：STATIC（手动输入固定值）/ DYNAMIC（根据缴费参数自动计算） */
const indexModes: Array<{ label: string; value: IndexMode }> = [
  { label: '固定值', value: 'STATIC' },
  { label: '动态计算', value: 'DYNAMIC' },
];

/**
 * 动态缴费指数：仅在估算模式下且参数齐全时计算。
 * 调用 computeDynamicIndex() 根据月缴费基数、社平工资及各增长率推算平均缴费指数。
 */
const dynamicIndex = computed(() => {
  const f = model.value;
  if (
    f.accountMode !== 'ESTIMATE' ||
    !f.monthlyBase ||
    !f.years ||
    f.years <= 0
  ) return null;
  return computeDynamicIndex(
    f.monthlyBase,
    f.P,
    f.personalBaseGrowthRate ?? 0,
    f.avgWageGrowthRate ?? 0,
    f.years,
  );
});

/** 个人账户计算模式选项：直接输入余额 / 按缴费参数估算 */
const accountModes: Array<{ label: string; value: AccountMode }> = [
  { label: '模式 A：直接输入账户储存额', value: 'DIRECT_BALANCE' },
  { label: '模式 B：按缴费参数估算账户储存额', value: 'ESTIMATE' },
];

/** 关闭过渡性养老金开关时，自动将过渡性养老金金额清零 */
watch(
  () => model.value.enableTransitional,
  (enabled) => {
    if (!enabled) {
      model.value.transitional = 0;
    }
  },
);
</script>

<template>
  <el-form label-width="160px" label-position="top">
    <!-- ====== 基础参数区域 ====== -->
    <el-form-item label="退休年龄">
      <div class="age-input-row">
        <el-input-number
          v-model="model.retireAge"
          :min="40"
          :max="70"
          :step="1"
          :precision="0"
          controls-position="right"
          style="width: 140px"
        />
        <span class="age-unit">岁</span>
        <el-tag type="info" class="divisor-tag">计发月数：{{ divisor }} 个月</el-tag>
      </div>
    </el-form-item>

    <el-form-item label="退休上年度当地在岗职工月平均工资（元）">
      <el-input-number v-model="model.P" :min="0" :step="100" :precision="2" style="width: 100%" />
    </el-form-item>

    <!-- 缴费指数：支持固定值手动输入或动态自动计算两种模式 -->
    <el-form-item label="平均缴费指数（本人历年缴费基数 ÷ 当地社平工资的平均值）">
      <div class="index-mode-row">
        <el-radio-group v-model="model.indexMode" size="small">
          <!-- 动态计算仅在估算模式下可用 -->
          <el-radio-button
            v-for="opt in indexModes"
            :key="opt.value"
            :label="opt.value"
            :value="opt.value"
            :disabled="opt.value === 'DYNAMIC' && model.accountMode !== 'ESTIMATE'"
          >
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
      <!-- 固定值模式：手动输入；动态模式：显示自动计算结果 -->
      <div class="index-input-row">
        <template v-if="model.indexMode === 'STATIC' || model.accountMode !== 'ESTIMATE'">
          <el-input-number v-model="model.i" :min="0" :step="0.1" :precision="3" style="width: 180px" />
        </template>
        <template v-else>
          <el-tag type="success" class="dynamic-index-tag">
            {{ dynamicIndex !== null ? dynamicIndex.toFixed(4) : '—' }}
          </el-tag>
          <span class="index-hint">（由缴费基数与社平工资参数自动计算）</span>
        </template>
      </div>
    </el-form-item>

    <el-form-item label="累计缴费年限（年）">
      <el-input-number v-model="model.n" :min="0" :step="1" :precision="1" style="width: 100%" />
    </el-form-item>

    <!-- ====== 个人账户计算模式切换 ====== -->
    <el-form-item label="个人账户计算模式">
      <el-radio-group v-model="model.accountMode" class="account-mode-group">
        <el-radio-button
          v-for="option in accountModes"
          :key="option.value"
          :label="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </el-radio-button>
      </el-radio-group>
    </el-form-item>

    <!-- 模式 A：直接输入个人账户储存额 -->
    <template v-if="model.accountMode === 'DIRECT_BALANCE'">
      <el-form-item label="个人账户储存额（元）">
        <el-input-number
          v-model="model.accountBalance"
          :min="0"
          :step="1000"
          :precision="2"
          style="width: 100%"
        />
      </el-form-item>
    </template>

    <!-- 模式 B：按缴费参数估算账户储存额（月缴费基数、缴费年限、缴费比例、记账利率等） -->
    <template v-else>
      <el-form-item label="月缴费基数（元）">
        <el-input-number
          v-model="model.monthlyBase"
          :min="0"
          :step="100"
          :precision="2"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="缴费年限（年）">
        <el-input-number v-model="model.years" :min="0" :step="1" :precision="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="个人账户缴费比例（职工本人缴费部分，通常为 8%）">
        <el-input-number
          v-model="personalRatePct"
          :min="0"
          :max="100"
          :step="0.5"
          :precision="2"
          style="width: 100%"
        >
          <template #suffix>%</template>
        </el-input-number>
      </el-form-item>

      <el-form-item label="个人账户记账利率（年化，0 表示不计息，影响账户余额估算）">
        <el-input-number
          v-model="annualInterestRatePct"
          :min="0"
          :max="100"
          :step="0.1"
          :precision="2"
          style="width: 100%"
        >
          <template #suffix>%</template>
        </el-input-number>
      </el-form-item>

      <el-form-item label="初始就业年份（用于推算各阶段工资水平）">
        <div class="age-input-row">
          <el-input-number
            v-model="model.startYear"
            :min="1950"
            :max="2020"
            :step="1"
            :precision="0"
            controls-position="right"
            style="width: 140px"
          />
          <span class="age-unit">年</span>
        </div>
      </el-form-item>

      <el-form-item label="个人缴费基数年增长率（每年缴费基数按此比例递增）">
        <el-input-number
          v-model="personalBaseGrowthRatePct"
          :min="0"
          :max="30"
          :step="0.5"
          :precision="2"
          style="width: 100%"
        >
          <template #suffix>%</template>
        </el-input-number>
      </el-form-item>

      <el-form-item label="社会平均工资年增长率（用于预测退休时的社平工资）">
        <el-input-number
          v-model="avgWageGrowthRatePct"
          :min="0"
          :max="30"
          :step="0.5"
          :precision="2"
          style="width: 100%"
        >
          <template #suffix>%</template>
        </el-input-number>
      </el-form-item>
    </template>

    <!-- ====== 过渡性养老金（可选） ====== -->
    <el-form-item label="启用过渡性养老金">
      <el-switch v-model="model.enableTransitional" />
    </el-form-item>

    <el-form-item v-if="model.enableTransitional" label="过渡性养老金（元/月）">
      <el-input-number
        v-model="model.transitional"
        :min="0"
        :step="10"
        :precision="2"
        style="width: 100%"
      />
    </el-form-item>
  </el-form>
</template>

<style scoped>
/* ── 账户模式按钮组：自适应换行 ── */
.account-mode-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ── 退休年龄输入行：数字输入 + 单位 + 计发月数标签 ── */
.age-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.age-unit {
  color: var(--text-secondary);
  font-size: 14px;
}

.divisor-tag {
  margin-left: 4px;
  font-size: 13px;
}

/* ── 缴费指数区域：模式切换行 + 输入/展示行 ── */
.index-mode-row {
  margin-bottom: 8px;
}

.index-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dynamic-index-tag {
  font-size: 15px;
  padding: 4px 12px;
}

.index-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
