<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const themeStore = useThemeStore()

themeStore.init()

const isCollapse = ref(false)
const asideWidth = computed(() => (isCollapse.value ? '64px' : '220px'))

const menus = computed(() => userStore.menus || [])

const handleMenuClick = (path) => {
  router.push(path)
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="layout-container">
    <el-aside :width="asideWidth" class="layout-aside">
      <div class="logo">
        <span class="logo-icon">📊</span>
        <span v-show="!isCollapse" class="logo-text">后台管理系统</span>
      </div>
      <el-menu
        :default-active="route.path"
        class="el-menu-vertical-demo"
        router
        :collapse="isCollapse"
      >
        <template v-for="menu in menus" :key="menu.id">
          <el-menu-item :index="menu.path" @click="handleMenuClick(menu.path)">
            <el-icon v-if="menu.icon">
              <component :is="menu.icon" />
            </el-icon>
            <span>{{ menu.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="left">
          <el-icon class="collapse-icon" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item 
              :to="{ path: '/dashboard' }"
              :class="{ 'is-current-page': route.path === '/dashboard' }"
            >
              首页
            </el-breadcrumb-item>
            <el-breadcrumb-item 
              v-if="route.path !== '/dashboard'"
              :class="{ 'is-current-page': true }"
            >
              {{ route.meta.title || '仪表盘' }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="right">
          <div class="theme-toggle" @click="themeStore.toggle">
            <el-icon class="theme-icon" :class="{ 'dark-theme': themeStore.mode === 'dark' }">
              <Sunny v-if="themeStore.mode === 'light'" />
              <Moon v-else />
            </el-icon>
          </div>
          <el-dropdown>
            <span class="el-dropdown-link">
              {{ userStore.userInfo?.username || '用户' }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.layout-aside::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.layout-aside:hover::before {
  opacity: 1;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 22px;
  color: var(--sidebar-logo-text);
  position: relative;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  gap: 10px;
  padding: 0 10px;
}

.logo:hover {
  transform: scale(1.02);
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.logo-icon {
  font-size: 24px;
  transition: all 0.3s ease;
  animation: float 3s ease-in-out infinite;
  flex-shrink: 0;
}

.logo-text {
  white-space: nowrap;
  opacity: 1;
  transform: translateX(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 20px;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-inline: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--page-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}

.layout-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
  opacity: 0.3;
}

[data-theme='dark'] .layout-header::before {
  background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
}

.left {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 面包屑美化 */
.el-breadcrumb {
  display: flex;
  align-items: center;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 1);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  backdrop-filter: blur(20px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

[data-theme='dark'] .el-breadcrumb {
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 面包屑项美化 */
.el-breadcrumb :deep(.el-breadcrumb__item) {
  font-size: 14px !important;
  font-weight: 600 !important;
}

.el-breadcrumb :deep(.el-breadcrumb__item:last-child) {
  color: var(--primary-color) !important;
  font-weight: 700 !important;
}

/* 当前页面高亮样式 */
.el-breadcrumb :deep(.el-breadcrumb__item.is-current-page) {
  position: relative;
}

.el-breadcrumb :deep(.el-breadcrumb__item.is-current-page .el-breadcrumb__inner) {
  color: var(--primary-color) !important;
  background: rgba(59, 130, 246, 0.1) !important;
  font-weight: 700 !important;
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  cursor: default !important;
}

[data-theme='dark'] .el-breadcrumb :deep(.el-breadcrumb__item.is-current-page .el-breadcrumb__inner) {
  background: rgba(96, 165, 250, 0.15) !important;
  border-color: rgba(96, 165, 250, 0.3);
  box-shadow: 0 2px 8px rgba(96, 165, 250, 0.2);
}

.el-breadcrumb :deep(.el-breadcrumb__inner) {
  color: #475569 !important;
  transition: all 0.3s ease !important;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 600 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

[data-theme='dark'] .el-breadcrumb :deep(.el-breadcrumb__inner) {
  color: var(--sidebar-text) !important;
}

.el-breadcrumb :deep(.el-breadcrumb__inner:hover) {
  background: var(--primary-color) !important;
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

/* 当前页面不显示悬停效果 */
.el-breadcrumb :deep(.el-breadcrumb__item.is-current-page .el-breadcrumb__inner:hover) {
  background: rgba(59, 130, 246, 0.1) !important;
  color: var(--primary-color) !important;
  transform: none !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15) !important;
}

[data-theme='dark'] .el-breadcrumb :deep(.el-breadcrumb__item.is-current-page .el-breadcrumb__inner:hover) {
  background: rgba(96, 165, 250, 0.15) !important;
  color: var(--primary-color) !important;
}

.el-breadcrumb :deep(.el-breadcrumb__separator) {
  color: #64748b !important;
  opacity: 1 !important;
  font-weight: 600 !important;
  margin: 0 4px !important;
  font-size: 12px !important;
}

[data-theme='dark'] .el-breadcrumb :deep(.el-breadcrumb__separator) {
  color: var(--sidebar-text) !important;
  opacity: 0.6 !important;
}

.layout-main {
  padding: 20px;
  background-color: var(--page-bg);
  min-height: calc(100vh - 60px);
}

.right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.el-dropdown-link {
  cursor: pointer;
  color: #475569;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 600;
  position: relative;
  background: rgba(255, 255, 255, 1);
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] .el-dropdown-link {
  color: var(--sidebar-text);
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.el-dropdown-link:hover {
  background: var(--primary-color);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.el-dropdown-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.el-dropdown-link:hover::after {
  width: 80%;
}

[data-theme='dark'] .el-dropdown-link:hover {
  transform: translateY(-2px);
}

/* 主题切换按钮美化 */
.theme-toggle {
  cursor: pointer;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

[data-theme='dark'] .theme-toggle {
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.theme-icon {
  font-size: 20px;
  color: #475569;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

[data-theme='dark'] .theme-icon {
  color: var(--sidebar-text);
}

.theme-icon.dark-theme {
  color: #fbbf24;
}

.theme-toggle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: all 0.4s ease;
  border-radius: 50%;
  z-index: 0;
}

.theme-toggle:hover::before {
  width: 60px;
  height: 60px;
}

.theme-toggle:hover {
  transform: scale(1.05);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-toggle:hover .theme-icon {
  transform: rotate(180deg) scale(1.1);
}

.theme-toggle:hover .theme-icon.dark-theme {
  color: #f59e0b;
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4));
}

.theme-toggle:hover .theme-icon:not(.dark-theme) {
  color: var(--primary-color);
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
}

/* 图标动画 */
@keyframes sunRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes moonGlow {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 4px rgba(251, 191, 36, 0.3)); }
  50% { filter: brightness(1.2) drop-shadow(0 0 8px rgba(251, 191, 36, 0.5)); }
}

.theme-icon:not(.dark-theme) {
  animation: sunRotate 20s linear infinite;
}

.theme-icon.dark-theme {
  animation: moonGlow 3s ease-in-out infinite;
}

.collapse-icon {
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #1e293b;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

[data-theme='dark'] .collapse-icon {
  color: var(--sidebar-text);
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.collapse-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: all 0.4s ease;
  border-radius: 50%;
  z-index: 0;
}

.collapse-icon:hover::before {
  width: 50px;
  height: 50px;
}

.collapse-icon:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
  transform: scale(1.05);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.collapse-icon:active {
  transform: scale(0.95);
}

.collapse-icon > * {
  position: relative;
  z-index: 1;
}

/* 美化菜单样式 */
.el-menu-vertical-demo {
  border: none !important;
  background: transparent !important;
}

.el-menu-vertical-demo .el-menu-item {
  border-radius: 0 24px 24px 0 !important;
  margin: 4px 8px 4px 0 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative;
  overflow: hidden;
  height: 48px;
  line-height: 48px;
  color: var(--sidebar-text) !important;
  font-weight: 500 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.el-menu-vertical-demo .el-menu-item:not(.is-active) {
  opacity: 0.9;
}

.el-menu-vertical-demo .el-menu-item:not(.is-active):hover {
  opacity: 1;
}

.el-menu-vertical-demo .el-menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  transition: left 0.5s ease;
  border-radius: inherit;
}

.el-menu-vertical-demo .el-menu-item:hover::before {
  left: 100%;
}

.el-menu-vertical-demo .el-menu-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), transparent);
  border-radius: inherit;
  pointer-events: none;
}

[data-theme='light'] .el-menu-vertical-demo .el-menu-item::after {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.05), transparent);
}

.el-menu-vertical-demo .el-menu-item:hover {
  background: var(--sidebar-solid-hover-bg) !important;
  transform: translateX(4px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.el-menu-vertical-demo .el-menu-item.is-active {
  background: var(--sidebar-hover-bg) !important;
  color: var(--sidebar-text-active) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  font-weight: 600;
}

.el-menu-vertical-demo .el-menu-item.is-active::after {
  content: '';
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  border-radius: 2px;
}

.el-menu-vertical-demo .el-menu-item .el-icon {
  font-size: 18px !important;
  margin-right: 8px !important;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  color: var(--sidebar-text) !important;
  filter: brightness(1.1) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.el-menu-vertical-demo .el-menu-item:hover .el-icon {
  transform: scale(1.2) rotate(5deg);
  color: var(--accent-color) !important;
  filter: brightness(1.3) drop-shadow(0 0 8px rgba(96, 165, 250, 0.6));
}

.el-menu-vertical-demo .el-menu-item.is-active .el-icon {
  color: var(--accent-color) !important;
  filter: brightness(1.2) drop-shadow(0 0 6px rgba(96, 165, 250, 0.4));
}

.el-menu-vertical-demo .el-menu-item span {
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  color: inherit !important;
}

.el-menu-vertical-demo .el-menu-item:hover span {
  font-weight: 600;
  color: var(--sidebar-text-active) !important;
}

/* 折叠状态下的样式 */
.layout-aside[style*="64px"] .logo {
  padding: 0;
}

.layout-aside[style*="64px"] .logo-icon {
  font-size: 20px;
  margin: 0;
  animation: pulse 2s ease-in-out infinite;
}

.layout-aside[style*="64px"] .logo:hover .logo-icon {
  transform: scale(1.1) rotate(5deg);
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1);
    filter: brightness(1);
  }
  50% { 
    transform: scale(1.05);
    filter: brightness(1.2);
  }
}

/* 暗黑模式下的特殊处理 */
[data-theme='dark'] .layout-aside {
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);
}

[data-theme='dark'] .layout-header {
  background: rgba(15, 23, 42, 0.95);
}

[data-theme='dark'] .collapse-icon:hover {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme='dark'] .logo-icon {
  filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.3));
}

/* 响应式优化 */
@media (max-width: 768px) {
  .logo {
    font-size: 18px;
    padding: 0 8px;
  }
  
  .logo-icon {
    font-size: 18px;
  }
  
  .logo-text {
    font-size: 16px;
  }
  
  .el-menu-vertical-demo .el-menu-item {
    height: 44px;
    line-height: 44px;
  }
}
</style>


