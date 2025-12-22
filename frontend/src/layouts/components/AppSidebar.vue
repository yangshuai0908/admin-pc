<script setup>
import { computed, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'

// 直接用官方名字引入，不使用别名
import {
    Document,
    Menu as IconMenu,
    Location,
    Setting,
    Odometer,
    User,
    Tools,
    HelpFilled,
    Star,
    Bell,
    Folder,
    Link
} from '@element-plus/icons-vue'

const props = defineProps({
  isCollapse: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false }
})

const userStore = useUserStore()

const iconMap = {
  'Odometer': Odometer,
  'Setting': Tools, // 改成工具图标，更明显
  'User': User,
  'Menu': IconMenu,
  'Document': Document,
  'Location': Location,
  'Tools': Tools,
  'HelpFilled': HelpFilled,
  'Star': Star,
  'Folder': Folder,   // 文件夹图标
  'Bell': Bell,       // 消息图标
  'UserFilled': User,  // 用户填充图标用 User 代替
  'Link': Link
}

const menus = computed(() => userStore.menus || [])

const getIcon = (iconName) => {
  return iconMap[iconName] || Location
}

onMounted(async () => {
  if (userStore.token) {
    await userStore.fetchMenus()
  }
})
</script>

<template>
  <div class="sidebar-wrapper">
    <!-- Logo区域 -->
    <div class="logo-container" :class="{ 'collapsed': isCollapse }">
      <div class="logo">
        <img src="/logo.svg" alt="Logo" class="logo-image" />
        <img src="/logo-mini.svg" alt="Logo" class="logo-mini" />
      </div>
      <h1 class="logo-text">管理系统</h1>
    </div>
    
    <el-menu
      class="el-menu-vertical-demo"
      :collapse="isCollapse"
      :background-color="isDark ? 'var(--sidebar-solid-bg)' : '#f8fafc'"
      :text-color="isDark ? 'var(--sidebar-text)' : '#475569'"
      :active-text-color="isDark ? 'var(--accent-color)' : '#2563eb'"
      :default-active="$route.path"
      router
    >
    <template v-for="menu in menus" :key="menu.id">
      <!-- 有子菜单 -->
      <el-sub-menu
        v-if="menu.children && menu.children.length > 0"
        :index="menu.id.toString()"
      >
        <template #title>
          <el-icon class="menu-icon">
            <component :is="getIcon(menu.icon)" class="svg-icon" />
          </el-icon>
          <span>{{ menu.title }}</span>
        </template>

        <el-menu-item
          v-for="child in menu.children"
          :key="child.id"
          :index="child.path"
        >
          <el-icon class="menu-icon">
            <component :is="getIcon(child.icon)" class="svg-icon" />
          </el-icon>
          <template #title>{{ child.title }}</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- 没有子菜单 -->
      <el-menu-item v-else :index="menu.path">
        <el-icon class="menu-icon">
          <component :is="getIcon(menu.icon)" class="svg-icon" />
        </el-icon>
        <template #title>{{ menu.title }}</template>
      </el-menu-item>
    </template>
    </el-menu>
  </div>
</template>

<style>
/* 侧边栏包装器 */
.sidebar-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--page-border-color) !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* Logo容器 */
.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background-color: var(--isDark ? 'var(--sidebar-solid-bg)' : '#f8fafc');
  border-bottom: 1px solid var(--page-border-color);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 12px;
  flex-shrink: 0;
}

.logo-container.collapsed {
  padding: 0 6px;
  justify-content: center;
}

/* Logo样式 */
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 32px;
  height: 32px;
}

.logo-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

.logo-mini {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 6px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 折叠状态下的 logo 动画 */
.logo-container.collapsed .logo-image {
  opacity: 0;
  transform: scale(0.8) rotate(180deg);
}

.logo-container.collapsed .logo-mini {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

/* Logo文字 */
.logo-text {
  color: var(--primary-color) !important;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  opacity: 1;
  transform: translateX(0) scale(1);
  max-width: 120px;
}

.logo-container.collapsed .logo-text {
  opacity: 0;
  transform: translateX(-10px) scale(0.9);
  max-width: 0;
  overflow: hidden;
}

[data-theme='dark'] .logo-text {
  color: var(--accent-color) !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Logo容器悬停效果 */
.logo-container:hover .logo-text {
  transform: scale(1.02);
}

.logo-container:hover .logo-image,
.logo-container:hover .logo-mini {
  transform: rotate(5deg) scale(1.05);
}

/* Logo图片动画效果 */
.logo-image,
.logo-mini {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Logo容器在不同主题下的背景 */
[data-theme='dark'] .logo-container {
  background-color: var(--sidebar-solid-bg);
}

/* 强制控制侧边栏宽度，确保不会变化 */
.el-menu-vertical-demo {
  width: 200px !important;
  min-height: 400px;
  border-right: none !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border-top: none !important;
  overflow: hidden !important;
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px !important;
}

.el-menu-vertical-demo.el-menu--collapse {
  width: 64px !important;
}

/* 确保菜单容器宽度固定 */
.el-menu {
  width: 200px !important;
  border: none !important;
  flex: 1;
  overflow-y: auto;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.el-menu.el-menu--collapse {
  width: 64px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* 确保菜单项不会影响整体宽度 */
.el-menu-item, .el-sub-menu, .el-sub-menu__title {
  width: 100% !important;
  min-width: 200px !important;
  max-width: 200px !important;
  position: relative !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.el-menu--collapse .el-menu-item,
.el-menu--collapse .el-sub-menu,
.el-menu--collapse .el-sub-menu__title {
  min-width: 64px !important;
  max-width: 64px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* 折叠状态下隐藏子菜单箭头 */
.el-menu--collapse .el-sub-menu__icon-arrow {
  display: none !important;
}

/* 图标整体样式 */
.menu-icon {
  margin-right: 8px;
  color: var(--primary-color) !important;
  flex-shrink: 0; /* 防止图标被压缩 */
  width: 16px !important;
  height: 16px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 暗黑主题图标颜色 */
[data-theme='dark'] .menu-icon {
  color: var(--accent-color) !important;
}

/* 菜单项悬停效果 */
.el-menu-item:hover,
.el-sub-menu__title:hover {
  background-color: rgba(37, 99, 235, 0.08) !important;
}

[data-theme='dark'] .el-menu-item:hover,
[data-theme='dark'] .el-sub-menu__title:hover {
  background-color: rgba(96, 165, 250, 0.15) !important;
}

/* 菜单激活状态 */
.el-menu-item.is-active {
  background-color: rgba(37, 99, 235, 0.12) !important;
  border-left: 3px solid #2563eb !important;
}

[data-theme='dark'] .el-menu-item.is-active {
  background-color: var(--sidebar-solid-hover-bg) !important;
  border-left-color: var(--accent-color) !important;
}

/* 强制 SVG 显示大小，避免被 flex 压成 0 */
.svg-icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}

/* 确保菜单项文本不会溢出 */
.el-menu-item span, .el-sub-menu__title span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 平滑的过渡动画 */
.el-menu {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* 子菜单样式 */
.el-sub-menu .el-menu-item {
  background-color: #f1f5f9 !important;
}

[data-theme='dark'] .el-sub-menu .el-menu-item {
  background-color: rgba(0, 0, 0, 0.2) !important;
}

/* 折叠状态下的图标居中 */
.el-menu--collapse .menu-icon {
  margin-right: 0;
  margin-left: 0;
}

/* 子菜单展开箭头样式 */
.el-sub-menu__icon-arrow {
  color: var(--primary-color) !important;
  transition: all 0.3s ease;
  font-size: 14px !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 12px !important;
  height: 12px !important;
  position: absolute !important;
  right: 20px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

[data-theme='dark'] .el-sub-menu__icon-arrow {
  color: var(--accent-color) !important;
}

.el-sub-menu__title:hover .el-sub-menu__icon-arrow {
  color: #2563eb !important;
  transform: scale(1.1);
}

[data-theme='dark'] .el-sub-menu__title:hover .el-sub-menu__icon-arrow {
  color: #60a5fa !important;
}

/* 确保子菜单箭头显示 */
.el-sub-menu .el-sub-menu__title {
  padding-right: 40px !important;
}

/* 确保箭头容器显示 */
.el-sub-menu__title::after {
  display: block !important;
}

/* 展开状态的箭头旋转 */
.el-sub-menu.is-opened > .el-sub-menu__title .el-sub-menu__icon-arrow {
  transform: rotateZ(180deg) !important;
}

/* 强制显示所有子菜单的箭头 */
.el-sub-menu > .el-sub-menu__title .el-sub-menu__icon-arrow {
  position: absolute !important;
  right: 20px !important;
  top: 50% !important;
  margin-top: -6px !important;
}

/* 隐藏CSS备用箭头，只使用原生箭头 */
.el-sub-menu .el-sub-menu__title::after {
  display: none !important;
}

/* 滚动条样式（如果需要） */
.el-menu-vertical-demo::-webkit-scrollbar {
  width: 4px;
}

.el-menu-vertical-demo::-webkit-scrollbar-track {
  background: transparent;
}

.el-menu-vertical-demo::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 4px;
}

.el-menu-vertical-demo::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.5);
}

[data-theme='dark'] .el-menu-vertical-demo::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}

[data-theme='dark'] .el-menu-vertical-demo::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>