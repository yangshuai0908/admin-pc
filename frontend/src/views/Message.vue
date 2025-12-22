<template>
  <div class="message-manage">
    <el-row :gutter="20">
      <!-- 左侧消息列表 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📨 消息列表</span>
              <el-badge :value="userStore.unreadCount" :hidden="userStore.unreadCount === 0" class="notification-badge">
                <el-button size="small" type="primary" @click="refreshMessages">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </el-badge>
            </div>
          </template>
          
          <!-- 过滤器 -->
          <div class="filter-section">
            <el-select v-model="filterType" placeholder="消息类型" size="small" style="width: 100px; margin-right: 10px;" @change="filterMessages">
              <el-option label="全部" value="all" />
              <el-option label="通知" value="notice" />
              <el-option label="公告" value="announcement" />
              <el-option label="系统" value="system" />
            </el-select>
            
            <el-select v-model="filterStatus" placeholder="阅读状态" size="small" style="width: 100px;" @change="filterMessages">
              <el-option label="全部" value="all" />
              <el-option label="未读" value="unread" />
              <el-option label="已读" value="read" />
            </el-select>
            
            <el-button size="small" type="primary" @click="markAllAsRead" :disabled="selectedMessages.length === 0">
              批量标记已读
            </el-button>
          </div>
          
          <!-- 消息列表 -->
          <div class="message-list">
            <div 
              v-for="message in filteredMessages" 
              :key="message.id"
              :class="['message-item', { 'unread': !message.isRead, 'selected': selectedMessages.includes(message.id) }]"
              @click="selectMessage(message)"
            >
              <div class="message-header">
                <div class="message-title">
                  <el-icon v-if="message.priority === 'high'" color="#f56c6c"><Warning /></el-icon>
                  <el-icon v-else-if="message.type === 'notice'" color="#409eff"><Bell /></el-icon>
                  <el-icon v-else-if="message.type === 'announcement'" color="#67c23a"><Promotion /></el-icon>
                  <el-icon v-else color="#909399"><InfoFilled /></el-icon>
                  <span class="title-text">{{ message.title }}</span>
                </div>
                <div class="message-time">
                  {{ formatTime(message.createTime) }}
                </div>
              </div>
              <div class="message-preview">
                {{ message.content.substring(0, 50) }}{{ message.content.length > 50 ? '...' : '' }}
              </div>
              <div v-if="!message.isRead" class="unread-dot"></div>
            </div>
            
            <div v-if="filteredMessages.length === 0" class="empty-state">
              <el-empty description="暂无消息" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧消息详情 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📄 消息详情</span>
              <div v-if="selectedMessage">
                <el-button size="small" @click="markAsRead(selectedMessage.id)" :disabled="selectedMessage.isRead">
                  {{ selectedMessage.isRead ? '已读' : '标记已读' }}
                </el-button>
              </div>
            </div>
          </template>
          
          <div v-if="selectedMessage" class="message-detail">
            <div class="detail-header">
              <div class="detail-title">
                <h2>{{ selectedMessage.title }}</h2>
                <div class="message-meta">
                  <el-tag :type="getTypeColor(selectedMessage.type)" size="small">
                    {{ getTypeLabel(selectedMessage.type) }}
                  </el-tag>
                  <el-tag v-if="selectedMessage.priority === 'high'" type="danger" size="small">
                    重要
                  </el-tag>
                  <span class="create-time">{{ formatDateTime(selectedMessage.createTime) }}</span>
                </div>
              </div>
            </div>
            
            <el-divider />
            
            <div class="message-content">
              {{ selectedMessage.content }}
            </div>
            
            <el-divider />
            
            <div class="message-footer">
              <span v-if="selectedMessage.isRead" class="read-status">
                已读时间: {{ formatDateTime(selectedMessage.readTime) }}
              </span>
              <span v-else class="unread-status">
                📌 未读消息
              </span>
            </div>
          </div>
          
          <div v-else class="empty-detail">
            <el-empty description="请选择一条消息查看详情" :image-size="120" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import { Refresh, Warning, Bell, Promotion, InfoFilled } from '@element-plus/icons-vue'

const userStore = useUserStore()

// 响应式数据
const messages = ref([])
const selectedMessage = ref(null)
const filterType = ref('all')
const filterStatus = ref('all')


// 计算属性
const filteredMessages = computed(() => {
  let filtered = messages.value
  
  // 类型过滤
  if (filterType.value !== 'all') {
    filtered = filtered.filter(msg => msg.type === filterType.value)
  }
  
  // 状态过滤
  if (filterStatus.value !== 'all') {
    if (filterStatus.value === 'unread') {
      filtered = filtered.filter(msg => !msg.isRead)
    } else if (filterStatus.value === 'read') {
      filtered = filtered.filter(msg => msg.isRead)
    }
  }
  
  return filtered
})

const selectedMessages = computed(() => {
  return filteredMessages.value.filter(msg => !msg.isRead).map(msg => msg.id)
})

// API调用方法
const fetchMessages = async () => {
  try {
    const response = await fetch('/api/messages?page=1&limit=100', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    const data = await response.json()
    if (response.ok) {
      messages.value = data.data
    } else {
      ElMessage.error(data.message || '获取消息失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  }
}



const markAsRead = async (messageId) => {
  try {
    const response = await fetch(`/api/messages/${messageId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    if (response.ok) {
      ElMessage.success(data.message)
      await fetchMessages()
      await userStore.fetchUnreadCount()
      // 更新选中的消息
      const message = messages.value.find(msg => msg.id === messageId)
      if (message) {
        message.isRead = true
        message.readTime = new Date().toISOString()
        selectedMessage.value = message
      }
    } else {
      ElMessage.error(data.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  }
}

const markAllAsRead = async () => {
  try {
    await ElMessageBox.confirm('确定要标记所有未读消息为已读吗？', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const unreadIds = filteredMessages.value.filter(msg => !msg.isRead).map(msg => msg.id)
    
    const response = await fetch('/api/messages/read-batch', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messageIds: unreadIds })
    })
    const data = await response.json()
    if (response.ok) {
      ElMessage.success(data.message)
      await fetchMessages()
      await userStore.fetchUnreadCount()
    } else {
      ElMessage.error(data.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作取消或失败')
    }
  }
}

// 事件处理方法
const selectMessage = (message) => {
  selectedMessage.value = message
  // 如果是未读消息，自动标记为已读
  if (!message.isRead) {
    markAsRead(message.id)
  }
}

const filterMessages = () => {
  // 过滤逻辑由计算属性自动处理
}

const refreshMessages = async () => {
  await fetchMessages()
  await userStore.fetchUnreadCount()
  ElMessage.success('消息列表已刷新')
}

// 工具方法
const formatTime = (timeString) => {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString()
  }
}

const formatDateTime = (timeString) => {
  if (!timeString) return ''
  return new Date(timeString).toLocaleString()
}

const getTypeColor = (type) => {
  const colors = {
    notice: 'primary',
    announcement: 'success',
    system: 'warning'
  }
  return colors[type] || 'info'
}

const getTypeLabel = (type) => {
  const labels = {
    notice: '通知',
    announcement: '公告',
    system: '系统'
  }
  return labels[type] || '消息'
}

// 生命周期
onMounted(async () => {
  if (!userStore.hasPermission('page:message')) {
    ElMessage.error('您没有访问消息管理页面的权限')
    return
  }
  
  await fetchMessages()
  await userStore.fetchUnreadCount()
})
</script>

<style scoped>
/* .message-manage {
  padding: 20px;
  height: calc(100vh - 140px);
} */

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.notification-badge {
  margin-left: 10px;
}

.filter-section {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-list {
  height: calc(100vh - 320px);
  overflow-y: auto;
}

.message-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.message-item:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.message-item.unread {
  background-color: #f0f9ff;
  border-color: #b3d8ff;
}

.message-item.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.message-title {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 6px;
}

.title-text {
  font-weight: 500;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.message-preview {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

.unread-dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 8px;
  height: 8px;
  background-color: #f56c6c;
  border-radius: 50%;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.message-detail {
  height: calc(100vh - 240px);
  overflow-y: auto;
}

.detail-header h2 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #303133;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.create-time {
  font-size: 13px;
  color: #909399;
}

.message-content {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.read-status {
  font-size: 13px;
  color: #67c23a;
}

.unread-status {
  font-size: 13px;
  color: #f56c6c;
  font-weight: 500;
}

.empty-detail {
  height: calc(100vh - 240px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 滚动条样式 */
.message-list::-webkit-scrollbar,
.message-detail::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track,
.message-detail::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb,
.message-detail::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover,
.message-detail::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>