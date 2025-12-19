<script setup>
import { ref } from 'vue'
import { useThemeStore } from '../stores/theme'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'
import AppMain from './components/AppMain.vue'

const themeStore = useThemeStore()
themeStore.init()

const isCollapse = ref(false)
</script>

<template>
  <el-container class="layout-container">
    <AppSidebar :is-collapse="isCollapse" :is-dark="themeStore.mode === 'dark'" />
    <el-container direction="vertical">
      <AppHeader :is-collapse="isCollapse" @toggle-collapse="isCollapse = !isCollapse" />
      <AppMain />
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}
</style>
