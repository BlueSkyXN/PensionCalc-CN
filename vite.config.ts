/**
 * Vite 构建工具配置
 * 使用 @vitejs/plugin-vue 插件支持 Vue 单文件组件编译
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
