<script setup>
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const handleAdd = () => {
  if (!userStore.hasPermission('btn:user:add')) {
    return ElMessage.error('无新增权限')
  }
  ElMessage.success('模拟新增成功')
}

const handleEdit = () => {
  if (!userStore.hasPermission('btn:user:edit')) {
    return ElMessage.error('无编辑权限')
  }
  ElMessage.success('模拟编辑成功')
}

const handleDelete = () => {
  if (!userStore.hasPermission('btn:user:delete')) {
    return ElMessage.error('无删除权限')
  }
  ElMessage.success('模拟删除成功')
}
</script>

<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>👥 用户管理（演示按钮级别权限）</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="handleAdd" 
            v-if="userStore.hasPermission('btn:user:add')"
          >
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>
      
      <div class="action-buttons" style="margin-bottom: 16px">
        <el-button type="warning" @click="handleEdit" v-if="userStore.hasPermission('btn:user:edit')">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button type="danger" @click="handleDelete" v-if="userStore.hasPermission('btn:user:delete')">
          <el-icon><Delete /></el-icon>
          删除
        </el-button>
      </div>
      <el-alert
        title="提示：登录 admin 账号可以看到所有按钮，登录 user 账号看不到用户管理菜单和按钮"
        type="info"
        show-icon
      />
    </el-card>
  </div>
</template>

<style scoped>
.user-manage {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>