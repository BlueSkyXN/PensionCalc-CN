/**
 * 应用入口文件
 * 创建 Vue 3 应用实例，全量引入 Element Plus 组件库，挂载到 DOM
 */
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';  // Element Plus 组件样式
import App from './App.vue';
import './styles.css';                  // 全局自定义样式与设计 token

createApp(App).use(ElementPlus).mount('#app');
