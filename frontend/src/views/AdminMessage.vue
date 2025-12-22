<template>
  <div class="admin-message">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📢 消息管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            创建消息
          </el-button>
        </div>
      </template>
      
      <!-- 搜索和过滤 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select v-model="filters.type" placeholder="消息类型" clearable @change="fetchMessages">
              <el-option label="全部" value="" />
              <el-option label="通知" value="notice" />
              <el-option label="公告" value="announcement" />
              <el-option label="系统" value="system" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.priority" placeholder="优先级" clearable @change="fetchMessages">
              <el-option label="全部" value="" />
              <el-option label="普通" value="normal" />
              <el-option label="重要" value="high" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="fetchMessages">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </el-col>
        </el-row>
      </div>
      
      <!-- 消息列表 -->
      <el-table :data="messages" style="width: 100%" v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="message-title">
              <el-icon v-if="row.priority === 'high'" color="#f56c6c"><Warning /></el-icon>
              <el-icon v-else-if="row.type === 'notice'" color="#409eff"><Bell /></el-icon>
              <el-icon v-else-if="row.type === 'announcement'" color="#67c23a"><Promotion /></el-icon>
              <el-icon v-else color="#909399"><InfoFilled /></el-icon>
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.priority === 'high'" type="danger" size="small">重要</el-tag>
            <el-tag v-else type="info" size="small">普通</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="阅读情况" width="150">
          <template #default="{ row }">
            <div class="read-stats">
              <div>已读: {{ row.readCount }}</div>
              <div>未读: {{ row.unreadCount }}</div>
              <el-progress 
                :percentage="row.readRate" 
                :stroke-width="4" 
                :show-text="false"
                style="margin-top: 4px;"
              />
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewMessage(row)">
              查看
            </el-button>
            <el-button size="small" type="danger" @click="deleteMessage(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchMessages"
          @current-change="fetchMessages"
        />
      </div>
    </el-card>
    
    <!-- 创建消息对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑消息' : '创建消息'" 
      width="600px"
    >
      <el-form :model="messageForm" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="messageForm.title" placeholder="请输入消息标题" />
        </el-form-item>
        
        <el-form-item label="类型" prop="type">
          <el-select v-model="messageForm.type" placeholder="请选择消息类型" style="width: 100%">
            <el-option label="通知" value="notice" />
            <el-option label="公告" value="announcement" />
            <el-option label="系统" value="system" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="messageForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="普通" value="normal" />
            <el-option label="重要" value="high" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标角色" prop="targetRoles">
          <el-select 
            v-model="messageForm.targetRoles" 
            placeholder="请选择目标角色（不选择则所有角色可见）" 
            multiple
            style="width: 100%"
          >
            <el-option 
              v-for="role in roles" 
              :key="role.id" 
              :label="role.name" 
              :value="role.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <el-input 
            v-model="messageForm.content" 
            type="textarea" 
            :rows="6" 
            placeholder="请输入消息内容"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMessage" :loading="submitting">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 查看消息对话框 -->
    <el-dialog v-model="viewDialogVisible" title="消息详情" width="600px">
      <div v-if="viewingMessage" class="message-detail">
        <div class="detail-header">
          <h3>{{ viewingMessage.title }}</h3>
          <div class="message-meta">
            <el-tag :type="getTypeColor(viewingMessage.type)" size="small">
              {{ getTypeLabel(viewingMessage.type) }}
            </el-tag>
            <el-tag v-if="viewingMessage.priority === 'high'" type="danger" size="small">
              重要
            </el-tag>
            <span>{{ formatDateTime(viewingMessage.createTime) }}</span>
          </div>
        </div>
        
        <el-divider />
        
        <div class="message-content">
          {{ viewingMessage.content }}
        </div>
        
        <el-divider />
        
        <div class="read-statistics">
          <h4>阅读统计</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ viewingMessage.readCount }}</div>
              <div class="stat-label">已读</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ viewingMessage.unreadCount }}</div>
              <div class="stat-label">未读</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ viewingMessage.readRate }}%</div>
              <div class="stat-label">阅读率</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Warning, Bell, Promotion, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEditing = ref(false)
const messages = ref([])
const roles = ref([])
const viewingMessage = ref(null)
const formRef = ref()

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 过滤条件
const filters = reactive({
  type: '',
  priority: ''
})

// 消息表单
const messageForm = reactive({
  title: '',
  type: 'notice',
  priority: 'normal',
  targetRoles: [],
  content: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入消息标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择消息类型', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入消息内容', trigger: 'blur' },
    { min: 5, max: 2000, message: '内容长度在 5 到 2000 个字符', trigger: 'blur' }
  ]
}

// API调用方法
const fetchMessages = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit
    })
    
    if (filters.type) params.append('type', filters.type)
    if (filters.priority) params.append('priority', filters.priority)
    
    const response = await fetch(`/api/admin/messages?${params}`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    const data = await response.json()
    if (response.ok) {
      messages.value = data.data
      pagination.total = data.total
      pagination.page = data.page
      pagination.limit = data.limit
    } else {
      ElMessage.error(data.message || '获取消息列表失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const response = await fetch('/api/roles', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    const data = await response.json()
    if (response.ok) {
      roles.value = data
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

const saveMessage = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const response = await fetch('/api/admin/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageForm)
    })
    
    const data = await response.json()
    if (response.ok) {
      ElMessage.success(data.message)
      dialogVisible.value = false
      resetForm()
      await fetchMessages()
    } else {
      ElMessage.error(data.message || '创建消息失败')
    }
  } catch (error) {
    if (error !== false) { // 不是验证失败
      ElMessage.error('操作失败，请稍后重试')
    }
  } finally {
    submitting.value = false
  }
}

const deleteMessage = async (message) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除消息"${message.title}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await fetch(`/api/admin/messages/${message.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    const data = await response.json()
    if (response.ok) {
      ElMessage.success(data.message)
      await fetchMessages()
    } else {
      ElMessage.error(data.message || '删除消息失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作取消或失败')
    }
  }
}

// 事件处理方法
const showCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const viewMessage = (message) => {
  viewingMessage.value = message
  viewDialogVisible.value = true
}

const resetForm = () => {
  Object.assign(messageForm, {
    title: '',
    type: 'notice',
    priority: 'normal',
    targetRoles: [],
    content: ''
  })
  formRef.value?.clearValidate()
}

// 工具方法
const formatDateTime = (timeString) => {
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
  if (!userStore.hasPermission('message:view')) {
    ElMessage.error('您没有权限访问消息管理')
    return
  }
  
  await fetchMessages()
  await fetchRoles()
})
</script>

<style scoped>
.admin-message {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.filter-section {
  margin-bottom: 20px;
}

.message-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.read-stats {
  font-size: 12px;
}

.read-stats > div {
  margin-bottom: 2px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.message-detail {
  max-height: 500px;
  overflow-y: auto;
}

.detail-header h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #909399;
}

.message-content {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 20px 0;
}

.read-statistics h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>