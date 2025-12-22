<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Switch } from '@element-plus/icons-vue'
import axios from '../utils/request'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索表单
const searchForm = reactive({
  username: '',
  role: ''
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const form = reactive({
  id: '',
  username: '',
  password: '',
  roleId: ''
})

// 表单验证规则
const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    {
      validator: (rule, value, callback) => {
        // 新增用户时密码必填
        if (!form.id && !value) {
          callback(new Error('请输入密码'))
        } 
        // 如果填写了密码，长度不能少于6位
        else if (value && value.length < 6) {
          callback(new Error('密码长度不能少于6位'))
        } 
        else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  roleId: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
})

// 角色选项
const roleOptions = ref([])

// 加载用户列表
const loadUserList = async () => {
  try {
    const response = await axios.get('/api/admin/users')
    if (!response || !response.users) {
      throw new Error('API返回数据格式错误')
    }
    
    tableData.value = response.users
    total.value = response.users.length
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  }
}

// 加载角色列表
const loadRoleList = async () => {
  try {
    const response = await axios.get('/api/admin/roles')
    if (!response || !response.roles) {
      throw new Error('API返回数据格式错误')
    }
    
    roleOptions.value = response.roles.map(role => ({
      label: role.name,
      value: role.id
    }))
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadUserList()
}

// 重置
const handleReset = () => {
  searchForm.username = ''
  searchForm.role = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  if (!userStore.hasPermission('user:add')) {
    return ElMessage.error('无新增权限')
  }
  dialogTitle.value = '新增用户'
  form.id = ''
  form.username = ''
  form.password = ''
  form.roleId = ''
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  if (!userStore.hasPermission('user:edit')) {
    return ElMessage.error('无编辑权限')
  }
  dialogTitle.value = '编辑用户'
  form.id = row.id
  form.username = row.username
  form.password = ''
  form.roleId = row.roleId
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row) => {
  if (!userStore.hasPermission('user:delete')) {
    return ElMessage.error('无删除权限')
  }
  
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await axios.delete(`/api/admin/users/${row.id}`)
    ElMessage.success('删除成功')
    loadUserList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      // 根据错误信息显示具体的错误原因
      if (error.response && error.response.data && error.response.data.message) {
        ElMessage.error(error.response.data.message)
      } else {
        ElMessage.error('删除用户失败')
      }
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (form.id) {
      // 编辑用户
      const updateData = {
        username: form.username,
        roleId: form.roleId
      }
      // 只有填写了新密码才更新密码
      if (form.password) {
        updateData.password = form.password
      }
      
      await axios.put(`/api/admin/users/${form.id}`, updateData)
      ElMessage.success('编辑成功')
    } else {
      // 新增用户
      await axios.post('/api/admin/users', {
        username: form.username,
        password: form.password,
        roleId: form.roleId
      })
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
    loadUserList()
  } catch (error) {
    console.error('保存用户失败:', error)
    // 根据错误信息显示具体的错误原因
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error(form.id ? '编辑失败' : '新增失败')
    }
  }
}

// 对话框关闭处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 切换用户状态
const handleStatusChange = async (row) => {
  if (!userStore.hasPermission('user:edit')) {
    return ElMessage.error('无编辑权限')
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要${row.status === 'enabled' ? '启用' : '禁用'}用户 "${row.username}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await axios.put(`/api/admin/users/${row.id}/status`, {
      status: row.status
    })
    
    ElMessage.success(`用户${row.status === 'enabled' ? '启用' : '禁用'}成功`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换用户状态失败:', error)
      // 恢复原状态
      row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
      
      if (error.response && error.response.data && error.response.data.message) {
        ElMessage.error(error.response.data.message)
      } else {
        ElMessage.error('状态切换失败')
      }
    } else {
      // 用户取消，恢复原状态
      row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
    }
  }
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  loadUserList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadUserList()
}

onMounted(() => {
  loadUserList()
  loadRoleList()
})
</script>

<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>👥 用户管理</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="handleAdd" 
            v-if="userStore.hasPermission('user:add')"
          >
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择角色" clearable style="width: 150px;">
            <el-option
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" border style="width: 100%">
        <el-table-column prop="id" label="用户ID"  />
        <el-table-column prop="username" label="用户名" />
        <el-table-column label="角色" >
          <template #default="scope">
            <el-tag>{{ scope.row.roleName || '未知' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="enabled"
              inactive-value="disabled"
              active-text="启用"
              inactive-text="禁用"
              :disabled="!userStore.hasPermission('user:edit')"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleEdit(scope.row)"
              v-if="userStore.hasPermission('user:edit')"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(scope.row)"
              v-if="userStore.hasPermission('user:delete')"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" :prop="form.id ? '' : 'password'">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码"
            show-password
          />
          <div v-if="form.id" class="form-tip">
            留空表示不修改密码，填写则更新密码
          </div>
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="请选择角色" style="width: 100%;">
            <el-option
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.search-form .el-select {
  width: 150px;
}

.search-form .el-input {
  width: 200px;
}

.el-pagination {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 对话框表单样式 */
.el-dialog .el-form-item .el-select {
  width: 100%;
}

.el-dialog .el-form-item .el-input {
  width: 100%;
}
</style>