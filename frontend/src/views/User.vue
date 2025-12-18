<script setup>
import { ElMessage } from 'element-plus'
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
  <el-card>
    <template #header>
      <span>用户管理（演示按钮级别权限）</span>
    </template>
    <div style="margin-bottom: 16px">
      <el-button type="primary" @click="handleAdd" v-if="userStore.hasPermission('btn:user:add')">
        新增
      </el-button>
      <el-button type="warning" @click="handleEdit" v-if="userStore.hasPermission('btn:user:edit')">
        编辑
      </el-button>
      <el-button type="danger" @click="handleDelete" v-if="userStore.hasPermission('btn:user:delete')">
        删除
      </el-button>
    </div>
    <el-alert
      title="提示：登录 admin 账号可以看到所有按钮，登录 user 账号看不到用户管理菜单和按钮"
      type="info"
      show-icon
    />
  </el-card>
</template>


