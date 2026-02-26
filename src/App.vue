<script setup lang="ts">
/**
 * App.vue — 应用根组件
 *
 * 作为 Vue 应用的入口组件，仅负责引入并渲染 PensionCalculator 页面。
 */
import PensionCalculator from './pages/PensionCalculator.vue';
</script>

<template>
  <!-- 渲染养老金计算器主页面 -->
  <PensionCalculator />
</template>
