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
  <el-menu
    class="el-menu-vertical-demo"
    :collapse="isCollapse"
    background-color="#545c64"
    text-color="#fff"
    active-text-color="#ffd04b"
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
</template>

<style>
/* 强制控制侧边栏宽度，确保不会变化 */
.el-menu-vertical-demo {
  width: 200px !important;
  min-height: 400px;
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
}

.el-menu.el-menu--collapse {
  width: 64px !important;
}

/* 确保菜单项不会影响整体宽度 */
.el-menu-item, .el-sub-menu, .el-sub-menu__title {
  width: 100% !important;
  min-width: 200px !important;
  max-width: 200px !important;
}

.el-menu--collapse .el-menu-item,
.el-menu--collapse .el-sub-menu,
.el-menu--collapse .el-sub-menu__title {
  min-width: 64px !important;
  max-width: 64px !important;
}

/* 图标整体样式 */
.menu-icon {
  margin-right: 8px;
  color: #ffd04b; /* 亮黄色主题色 */
  flex-shrink: 0; /* 防止图标被压缩 */
  width: 16px !important;
  height: 16px !important;
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
}

/* 平滑的过渡动画 */
.el-menu {
  transition: width 0.3s ease;
}
</style>