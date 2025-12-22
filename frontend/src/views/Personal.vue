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
              <Plus />
            </el-icon>
          </el-upload>
          <h3>{{ userStore.userInfo?.username || '未知用户' }}</h3>
          <p>角色: {{ userStore.userInfo?.role?.name || '未知角色' }}</p>
        </el-col>

        <!-- 右侧：账户设置 -->
        <el-col :span="16" class="account-settings">
          <el-tabs v-model="activeTab">
            <!-- 基本信息标签页 -->
            <el-tab-pane label="基本信息" name="profile">
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
            </el-tab-pane>

            <!-- 修改密码标签页 -->
            <el-tab-pane label="修改密码" name="password">
              <h3>修改密码</h3>
              <el-form label-width="100px" style="max-width: 500px;" ref="passwordFormRef" :model="passwordForm" :rules="passwordRules">
                <el-form-item label="旧密码" prop="oldPassword">
                  <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" show-password />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="changePassword">
                    修改密码
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElForm } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import axios from '../utils/request'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const activeTab = ref('profile')
const passwordFormRef = ref()

const form = ref({
  username: userStore.userInfo?.username || '',
  email: userStore.userInfo?.email || '',
  phone: userStore.userInfo?.phone || ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const imageUrl = ref(userStore.userInfo?.avatar || '') // 头像url

// 页面加载时初始化头像
onMounted(async () => {
  try {
    // 重新获取用户信息以确保是最新的
    await userStore.fetchUserInfo()
    form.value.username = userStore.userInfo?.username || ''
    form.value.email = userStore.userInfo?.email || ''
    form.value.phone = userStore.userInfo?.phone || ''
    imageUrl.value = userStore.userInfo?.avatar || ''
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
})

const handleAvatarSuccess = (response) => {
  // 假设上传接口返回 { url: '图片地址' }
  imageUrl.value = response.url
  ElMessage.success('头像上传成功')
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  
  return true
}

const saveProfile = async () => {
  try {
    // 发送请求保存用户信息，包括头像
    const userData = {
      email: form.value.email,
      phone: form.value.phone,
      avatar: imageUrl.value // 包含头像信息
    }
    
    // 调用API保存用户信息
    const response = await axios.post('/api/user/profile', userData)
    
    // 更新用户store中的信息
    userStore.userInfo = {
      ...userStore.userInfo,
      ...response
    }
    
    ElMessage.success('信息保存成功')
  } catch (error) {
    ElMessage.error('保存失败: ' + (error.message || '未知错误'))
  }
}

const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    
    // 调用API修改密码
    const response = await axios.post('/api/user/change-password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    ElMessage.success(response.message || '密码修改成功')
    
    // 密码修改成功后，退出登录并跳转到登录页面
    userStore.logout()
    router.push('/login')
  } catch (error) {
    ElMessage.error('修改失败: ' + (error.message || '未知错误'))
  }
}
</script>

<style scoped lang="scss">
.card-header {
  font-size: 18px;
  font-weight: bold;
}

.avatar-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar-uploader {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 200px;
  height: 200px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  margin-bottom: 16px;
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 32px;
  color: #8c939d;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.account-settings {
  h3 {
    margin-bottom: 20px;
    color: #333;
  }
}
</style>