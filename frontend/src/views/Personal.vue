<template>
  <div class="personal-center">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>👤 个人中心</span>
        </div>
      </template>
      
      <div class="profile-info">
        <el-avatar :size="100" :icon="UserFilled" />
        <h2>{{ userStore.userInfo?.username || '未知用户' }}</h2>
        <p>角色: {{ userStore.userInfo?.role?.name || '未知角色' }}</p>
      </div>
      
      <el-divider />
      
      <div class="account-settings">
        <h3>账户设置</h3>
        <el-form label-width="100px" style="max-width: 500px;">
          <el-form-item label="用户名">
            <el-input v-model="form.username" disabled />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="form.phone" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="saveProfile"
              v-if="userStore.hasPermission('personal:edit')"
            >
              保存信息
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const form = ref({
  username: userStore.userInfo?.username || '',
  email: '',
  phone: ''
})

const saveProfile = () => {
  ElMessage.success('信息保存成功')
}
</script>

<style scoped>
.personal-center {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.profile-info {
  text-align: center;
  padding: 20px 0;
}

.profile-info h2 {
  margin: 15px 0 5px;
  font-size: 24px;
}

.profile-info p {
  color: #666;
  margin-bottom: 20px;
}

.account-settings h3 {
  margin-bottom: 20px;
  color: #333;
}
</style>