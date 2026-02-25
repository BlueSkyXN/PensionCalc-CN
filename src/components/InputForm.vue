<script setup lang="ts">
import { computed, watch } from 'vue';
import { DIVISOR_BY_AGE } from '../core/divisor-table';
import type { AccountMode, PensionInput, RetireAge } from '../types/pension';

const model = defineModel<PensionInput>({ required: true });

const ageOptions = computed(() =>
  Object.keys(DIVISOR_BY_AGE)
    .map((age) => Number(age) as RetireAge)
    .sort((a, b) => a - b),
);

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
      <el-select v-model="model.retireAge" style="width: 100%">
        <el-option
          v-for="age in ageOptions"
          :key="age"
          :label="`${age} 岁（计发月数 ${DIVISOR_BY_AGE[age]}）`"
          :value="age"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="退休上年度当地在岗职工月平均工资 P（元）">
      <el-input-number v-model="model.P" :min="0" :step="100" :precision="2" style="width: 100%" />
    </el-form-item>

    <el-form-item label="平均缴费指数 i（如 0.6 / 1.0）">
      <el-input-number v-model="model.i" :min="0" :step="0.1" :precision="3" style="width: 100%" />
    </el-form-item>

    <el-form-item label="累计缴费年限 n（年）">
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

      <el-form-item label="个人费率（模拟参数，小数，默认 0.08）">
        <el-input-number
          v-model="model.personalRate"
          :min="0"
          :step="0.01"
          :precision="4"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="年利率（小数，默认 0）">
        <el-input-number
          v-model="model.annualInterestRate"
          :min="0"
          :step="0.01"
          :precision="4"
          style="width: 100%"
        />
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
</style>
