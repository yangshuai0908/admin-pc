<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Fold, Expand, Sunny, Moon, Bell, FullScreen, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { useThemeStore } from '../../stores/theme'

const props = defineProps({
    isCollapse: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['toggleCollapse'])

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const themeStore = useThemeStore()

// 全屏状态
const isFullscreen = ref(false)

const handleLogout = () => {
    userStore.logout()
    router.push('/login')
}

// 跳转到消息页面
const handleMessage = () => {
    router.push('/message')
}

// 切换全屏
const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
        isFullscreen.value = true
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen()
            isFullscreen.value = false
        }
    }
}

// 监听全屏状态变化
onMounted(() => {
    userStore.fetchUnreadCount()
    // 每30秒更新一次未读数量
    setInterval(userStore.fetchUnreadCount, 30000)
    
    // 监听全屏变化事件
    const handleFullscreenChange = () => {
        isFullscreen.value = !!document.fullscreenElement
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    // 清理事件监听
    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
})

onMounted(() => {
    userStore.fetchUnreadCount()
    // 每30秒更新一次未读数量
    setInterval(userStore.fetchUnreadCount, 30000)
})
</script>

<template>
    <el-header class="layout-header">
        <div class="left">
            <el-icon class="collapse-icon" @click="emit('toggleCollapse')">
                <Fold v-if="!isCollapse" />
                <Expand v-else />
            </el-icon>
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/dashboard' }"
                    :class="{ 'is-current-page': route.path === '/dashboard' }">
                    首页
                </el-breadcrumb-item>
                <el-breadcrumb-item v-if="route.path !== '/dashboard'" :class="{ 'is-current-page': true }">
                    {{ route.meta.title || '仪表盘' }}
                </el-breadcrumb-item>
            </el-breadcrumb>
        </div>
        <div class="right">
            <!-- 消息提醒 -->
            <div class="message-notification">
                <el-badge :value="userStore.unreadCount" :hidden="userStore.unreadCount === 0" class="notification-badge">
                    <div class="message-toggle" @click="handleMessage">
                        <el-icon class="message-icon">
                            <Bell />
                        </el-icon>
                    </div>
                </el-badge>
            </div>
            
            <!-- 全屏切换 -->
            <div class="fullscreen-toggle" @click="toggleFullscreen">
                <el-icon class="fullscreen-icon">
                    <FullScreen v-if="!isFullscreen" />
                    <SwitchButton v-else />
                </el-icon>
            </div>
            
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
</template>

<style scoped>
.layout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-inline: 20px;
    background: rgba(255, 255, 255, 0.95);
    /* backdrop-filter: blur(20px); */
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
    /* backdrop-filter: blur(20px); */
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

/* 消息通知按钮 */
.message-notification {
    position: relative;
}

.message-toggle {
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

[data-theme='dark'] .message-toggle {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.message-toggle:hover {
    transform: scale(1.05);
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.message-toggle:active {
    transform: scale(0.95);
}

.message-toggle:hover .message-icon {
    color: var(--primary-color);
    transform: rotate(15deg) scale(1.1);
}

.message-icon {
    font-size: 20px;
    color: #475569;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
}

[data-theme='dark'] .message-icon {
    color: var(--sidebar-text);
}

.message-toggle:hover .message-icon {
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
}

.notification-badge {
    display: inline-block;
}

/* 全屏切换按钮美化 */
.fullscreen-toggle {
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

[data-theme='dark'] .fullscreen-toggle {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.fullscreen-icon {
    font-size: 20px;
    color: #475569;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
}

[data-theme='dark'] .fullscreen-icon {
    color: var(--sidebar-text);
}

.fullscreen-toggle:hover {
    transform: scale(1.05);
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.fullscreen-toggle:active {
    transform: scale(0.95);
}

.fullscreen-toggle:hover .fullscreen-icon {
    color: var(--primary-color);
    transform: scale(1.1);
}

.fullscreen-toggle:hover .fullscreen-icon {
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
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
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes moonGlow {

    0%,
    100% {
        filter: brightness(1) drop-shadow(0 0 4px rgba(251, 191, 36, 0.3));
    }

    50% {
        filter: brightness(1.2) drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
    }
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

.collapse-icon>* {
    position: relative;
    z-index: 1;
}
</style>
