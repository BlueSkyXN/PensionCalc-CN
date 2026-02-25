<script setup lang="ts">
import { computed, watch } from 'vue';
import { DIVISOR_BY_AGE } from '../core/divisor-table';
import type { AccountMode, IndexMode, PensionInput, RetireAge } from '../types/pension';
import { computeDynamicIndex } from '../core/pension';

const model = defineModel<PensionInput>({ required: true });

const divisor = computed(() => DIVISOR_BY_AGE[model.value.retireAge as RetireAge] ?? '-');

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

const indexModes: Array<{ label: string; value: IndexMode }> = [
  { label: '固定值', value: 'STATIC' },
  { label: '动态计算', value: 'DYNAMIC' },
];

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

const accountModes: Array<{ label: string; value: AccountMode }> = [
  { label: '模式 A：直接输入账户储存额', value: 'DIRECT_BALANCE' },
  { label: '模式 B：按缴费参数估算账户储存额', value: 'ESTIMATE' },
];

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

    <el-form-item label="平均缴费指数（本人历年缴费基数 ÷ 当地社平工资的平均值）">
      <div class="index-mode-row">
        <el-radio-group v-model="model.indexMode" size="small">
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
.account-mode-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

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
