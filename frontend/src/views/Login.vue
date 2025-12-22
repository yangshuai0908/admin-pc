<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, ArrowRight } from '@element-plus/icons-vue' // 引入图标
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
    const menus = await userStore.fetchMenus()
    ElMessage.success('登录成功')
    
    // 等待路由动态注册完成
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 直接跳转到根路径
    await router.push('/')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.submitting = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 动态粒子背景 -->
    <div class="background-particles">
      <div 
        v-for="i in 20" 
        :key="i" 
        class="particle"
        :style="{ 
          left: Math.random() * 100 + '%', 
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 5 + 's',
          animationDuration: (15 + Math.random() * 10) + 's'
        }"
      ></div>
    </div>

    <!-- 动态光斑背景 -->
    <div class="background-blobs">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
      <div class="blob blob-5"></div>
    </div>

    <!-- 星空背景 -->
    <div class="stars-container">
      <div 
        v-for="i in 200" 
        :key="`star-${i}`" 
        class="star"
        :style="{ 
          left: Math.random() * 100 + '%', 
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 3 + 's'
        }"
      ></div>
    </div>

    <div class="login-card-container">
      <div class="login-card animate__animated animate__fadeInUp">
        <div class="header">
          <div class="logo-circle animate__animated animate__pulse animate__infinite">
            <el-icon :size="30"><User /></el-icon>
          </div>
          <h2 class="title animate__animated animate__fadeInDown animate__delay-1s">后台管理系统</h2>
          <p class="subtitle animate__animated animate__fadeIn animate__delay-2s">欢迎回来，请登录您的账号</p>
        </div>

        <el-form class="login-form size-large" @keyup.enter="handleSubmit">
          <el-form-item class="animate__animated animate__fadeInLeft animate__delay-1s">
            <el-input 
              v-model="form.username" 
              placeholder="请输入用户名" 
              :prefix-icon="User"
              class="custom-input"
            />
          </el-form-item>
          
          <el-form-item class="animate__animated animate__fadeInLeft animate__delay-2s">
            <el-input 
              v-model="form.password" 
              type="password" 
              placeholder="请输入密码" 
              show-password 
              :prefix-icon="Lock"
              class="custom-input"
            />
          </el-form-item>

          <el-form-item class="animate__animated animate__fadeInUp animate__delay-3s">
            <el-button 
              type="primary" 
              class="submit-btn" 
              :loading="loading.submitting" 
              @click="handleSubmit"
            >
              {{ loading.submitting ? '登录中...' : '立即登录' }}
              <el-icon class="el-icon--right" v-if="!loading.submitting">
                <ArrowRight />
              </el-icon>
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 装饰性元素 -->
        <div class="decorative-elements">
          <div class="orb orb-1 animate__animated animate__pulse animate__slow animate__infinite"></div>
          <div class="orb orb-2 animate__animated animate__pulse animate__slow animate__infinite animate__delay-1s"></div>
          <div class="orb orb-3 animate__animated animate__pulse animate__slow animate__infinite animate__delay-2s"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 布局与背景 --- */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #1e293b 0%, #0f172a 50%, #020617 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* --- 星空背景 --- */
.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  animation: twinkle 3s infinite;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
}

@keyframes twinkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1); }
}

/* --- 动态粒子背景 --- */
.background-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: linear-gradient(45deg, #60a5fa, #a78bfa, #f472b6);
  border-radius: 50%;
  opacity: 0.3;
  animation: particleFloat 20s infinite linear;
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.4;
  }
  90% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

/* --- 动态光斑背景动画 --- */
.background-blobs {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 15s infinite ease-in-out alternate;
}

.blob-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(45deg, #4f46e5, #7c3aed);
  top: -200px;
  left: -200px;
  animation-duration: 20s;
}

.blob-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(45deg, #06b6d4, #0891b2);
  bottom: -150px;
  right: -150px;
  animation-duration: 25s;
  animation-delay: -5s;
}

.blob-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(45deg, #ec4899, #f43f5e);
  bottom: 30%;
  left: 20%;
  animation-duration: 30s;
  animation-delay: -10s;
}

.blob-4 {
  width: 350px;
  height: 350px;
  background: linear-gradient(45deg, #f59e0b, #ef4444);
  top: 20%;
  right: 10%;
  animation-duration: 22s;
  animation-delay: -7s;
}

.blob-5 {
  width: 300px;
  height: 300px;
  background: linear-gradient(45deg, #10b981, #14b8a6);
  top: 60%;
  left: 60%;
  animation-duration: 18s;
  animation-delay: -3s;
}

@keyframes float {
  0% { 
    transform: translate(0, 0) scale(1) rotate(0deg);
    filter: blur(80px) hue-rotate(0deg);
  }
  33% { 
    transform: translate(50px, -30px) scale(1.2) rotate(120deg);
    filter: blur(90px) hue-rotate(60deg);
  }
  66% { 
    transform: translate(-30px, 50px) scale(0.8) rotate(240deg);
    filter: blur(70px) hue-rotate(-60deg);
  }
  100% { 
    transform: translate(0, 0) scale(1) rotate(360deg);
    filter: blur(80px) hue-rotate(0deg);
  }
}

/* --- 卡片容器与进场动画 --- */
.login-card-container {
  position: relative;
  z-index: 10;
  perspective: 1000px;
}

.login-card {
  width: 420px;
  padding: 48px;
  border-radius: 24px;
  /* 增强的毛玻璃效果 */
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

/* 卡片内部光效 */
.login-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 70%
  );
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

/* --- 装饰性元素 --- */
.decorative-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  border-radius: 24px;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
}

.orb-1 {
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, transparent 70%);
  top: -50px;
  right: -50px;
  animation: orbFloat 8s infinite ease-in-out;
}

.orb-2 {
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
  bottom: -40px;
  left: -40px;
  animation: orbFloat 10s infinite ease-in-out reverse;
}

.orb-3 {
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%);
  top: 50%;
  right: -30px;
  animation: orbFloat 12s infinite ease-in-out;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(10px, -15px) scale(1.1); }
  50% { transform: translate(-10px, 10px) scale(0.9); }
  75% { transform: translate(15px, 5px) scale(1.05); }
}

/* --- 内容样式 --- */
.header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.logo-circle {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  box-shadow: 
    0 10px 20px rgba(79, 70, 229, 0.3),
    0 0 20px rgba(79, 70, 229, 0.2);
  position: relative;
}

.logo-circle::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #4f46e5, #06b6d4, #4f46e5);
  border-radius: 50%;
  z-index: -1;
  animation: logoGlow 3s infinite;
}

@keyframes logoGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin-top: 8px;
  font-weight: 400;
}

/* --- 表单样式 --- */
.login-form {
  position: relative;
  z-index: 1;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

/* --- 覆盖 Element Plus 样式 --- */
.login-form :deep(.el-input__wrapper) {
  background-color: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: none;
  border-radius: 12px;
  padding: 12px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.login-form :deep(.el-input__wrapper::before) {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.1), transparent);
  transition: left 0.5s;
}

.login-form :deep(.el-input__wrapper:hover::before) {
  left: 100%;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background-color: rgba(15, 23, 42, 0.8);
  border-color: #4f46e5;
  box-shadow: 
    0 0 0 1px #4f46e5, 
    0 0 20px rgba(79, 70, 229, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.login-form :deep(.el-input__inner) {
  color: #e2e8f0;
  height: 24px;
  font-size: 15px;
}

.login-form :deep(.el-input__prefix) {
  color: #64748b;
}

/* --- 按钮样式优化 --- */
.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
  border: none;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-top: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 
    0 20px 40px -10px rgba(79, 70, 229, 0.5),
    0 0 20px rgba(79, 70, 229, 0.3);
  background: linear-gradient(135deg, #4338ca 0%, #0891b2 100%);
}

.submit-btn:active {
  transform: translateY(0) scale(1);
  transition: all 0.1s;
}

/* --- 响应式设计 --- */
@media (max-width: 480px) {
  .login-card {
    width: 90vw;
    padding: 32px 24px;
  }
  
  .title {
    font-size: 24px;
  }
}
</style>