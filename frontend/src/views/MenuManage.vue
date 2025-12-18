<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from '../utils/request'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const state = reactive({
  loading: false,
  saving: false,
  rolesText: '',
  menusText: '',
})

const loadData = async () => {
  state.loading = true
  try {
    const res = await axios.get('/api/admin/rbac')
    state.rolesText = JSON.stringify(res.roles, null, 2)
    state.menusText = JSON.stringify(res.menus, null, 2)
  } catch (e) {
    ElMessage.error(e.message || '加载 RBAC 配置失败')
  } finally {
    state.loading = false
  }
}

const handleSave = async () => {
  if (state.saving) return
  state.saving = true
  try {
    const roles = JSON.parse(state.rolesText || '[]')
    const menus = JSON.parse(state.menusText || '[]')
    await axios.post('/api/admin/rbac', { roles, menus })
    ElMessage.success('保存成功')
    // 刷新本地权限 & 菜单
    await userStore.fetchUserInfo()
    await userStore.fetchMenus()
  } catch (e) {
    ElMessage.error(e.message || '保存失败，请检查 JSON 格式')
  } finally {
    state.saving = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <el-card>
    <template #header>
      <span>菜单管理 / RBAC 配置（JSON 编辑模式）</span>
    </template>
    <el-alert
      type="info"
      show-icon
      title="仅管理员（admin）可访问。编辑下方 JSON 可动态调整角色权限与菜单结构。"
      style="margin-bottom: 16px"
    />
    <el-row :gutter="16">
      <el-col :span="12">
        <h4>角色配置（roles）</h4>
        <el-input
          v-model="state.rolesText"
          type="textarea"
          :rows="16"
          placeholder='[ { "id": "admin", "permissions": [...] } ]'
        />
      </el-col>
      <el-col :span="12">
        <h4>菜单配置（menus）</h4>
        <el-input
          v-model="state.menusText"
          type="textarea"
          :rows="16"
          placeholder='[ { "title": "xxx", "path": "/xxx", "children": [...] } ]'
        />
      </el-col>
    </el-row>
    <div style="margin-top: 16px; text-align: right">
      <el-button type="primary" :loading="state.saving" @click="handleSave">
        保存配置
      </el-button>
    </div>
  </el-card>
</template>


