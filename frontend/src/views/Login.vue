<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: 'admin',
  password: '123456',
})

const loading = reactive({
  submitting: false,
})

const handleSubmit = async () => {
  if (loading.submitting) return
  loading.submitting = true
  try {
    await userStore.login(form)
    await userStore.fetchUserInfo()
    await userStore.fetchMenus()
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.submitting = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="title">后台管理系统</h2>
      <el-form @keyup.enter="handleSubmit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="admin 或 user" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="123456" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" :loading="loading.submitting" @click="handleSubmit">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top left, #4f46e5 0, transparent 55%),
    radial-gradient(circle at bottom right, #06b6d4 0, transparent 55%),
    #020617;
}
.login-card {
  width: 380px;
  padding: 32px 30px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.92);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.4);
  color: #e5e7eb;
}
.title {
  text-align: center;
  margin-bottom: 28px;
  color: #e5e7eb;
}
</style>


