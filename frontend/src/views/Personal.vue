<template>
  <div class="personal-center">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>👤 个人中心</span>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- 左侧：头像上传 -->
        <el-col :span="8" class="avatar-section">
          <el-upload class="avatar-uploader" action="http://localhost:3000/api/upload/avatar"
            :headers="{ Authorization: 'Bearer ' + userStore.token }" :show-file-list="false"
            :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload">
            <img v-if="imageUrl" :src="'http://localhost:3000' + imageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon">
              <UserFilled />
            </el-icon>
          </el-upload>
          <h3>{{ userStore.userInfo?.username || '未知用户' }}</h3>
          <p>角色: {{ userStore.userInfo?.role?.name || '未知角色' }}</p>
        </el-col>

        <!-- 右侧：账户设置 -->
        <el-col :span="16" class="account-settings">
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
              <el-button type="primary" @click="saveProfile" v-if="userStore.hasPermission('personal:edit')">
                保存信息
              </el-button>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
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

const imageUrl = ref('') // 头像url

const handleAvatarSuccess = (response) => {
  // 假设上传接口返回 { url: '图片地址' }
  imageUrl.value = response.url
  ElMessage.success('头像上传成功')
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片!')
    return false
  }
  return true
}

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

.avatar-section {
  text-align: center;
}

.avatar-uploader {
  display: inline-block;
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
}

.avatar-uploader-icon {
  font-size: 32px;
  color: #8c939d;
  line-height: 100px;
  text-align: center;
}

.account-settings h3 {
  margin-bottom: 20px;
  color: #333;
}
</style>