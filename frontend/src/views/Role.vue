<template>
  <div class="role-manage">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleAdd" v-if="userStore.hasPermission('role:add')">新增角色</el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="角色名称">
          <el-input v-model="searchForm.name" placeholder="请输入角色名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="description" label="角色描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="enabled"
              inactive-value="disabled"
              @change="handleStatusChange(scope.row)"
              :disabled="scope.row.id === 'admin'"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)" v-if="userStore.hasPermission('role:edit')">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)" v-if="userStore.hasPermission('role:delete')">删除</el-button>
            <el-button type="info" size="small" @click="handlePermissions(scope.row)" v-if="userStore.hasPermission('role:assign')">权限</el-button>
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
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        <el-form-item label="角色状态">
          <el-radio-group v-model="form.status">
            <el-radio label="enabled">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限配置"
      width="600px"
      @close="handlePermissionDialogClose"
    >
      <el-form label-width="80px">
        <el-form-item label="角色名称">
          <el-input v-model="currentRole.name" disabled />
        </el-form-item>
        <el-form-item label="权限列表">
          <el-tree
            ref="permissionTreeRef"
            :data="permissionTreeData"
            :props="{ children: 'children', label: 'title' }"
            show-checkbox
            node-key="id"
            :default-checked-keys="checkedPermissions"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePermissionSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '../utils/request'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

// 搜索表单
const searchForm = reactive({
  name: ''
})

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const form = reactive({
  name: '',
  description: '',
  status: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

// 权限对话框相关
const permissionDialogVisible = ref(false)
const permissionTreeRef = ref()
const currentRole = ref({})
const permissionTreeData = ref([])
const checkedPermissions = ref([])

// 加载角色列表
const loadRoleList = async () => {
  try {
    // 添加token调试信息
    
    const response = await axios.get('/api/admin/roles')
    
    if (!response || !response.roles) {
      throw new Error('API返回数据格式错误')
    }
    
    const roles = response.roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description || `${role.name} - ${role.permissions.length}个权限`,
      createTime: role.createTime || new Date().toLocaleDateString(),
      status: role.status || 'enabled',
      permissions: role.permissions
    }))
    
    tableData.value = roles
    total.value = roles.length
  } catch (error) {
    console.error('获取角色列表失败:', error)
    if (error.response?.status === 403) {
      ElMessage.error('无角色管理权限')
    } else if (error.response?.status === 401) {
      ElMessage.error('请先登录')
    } else {
      ElMessage.error('获取角色列表失败')
    }
  }
}

// 加载权限树数据
const loadPermissionTree = async () => {
  try {
    const response = await axios.get('/api/admin/permissions')
    permissionTreeData.value = response
  } catch (error) {
    console.error('获取权限数据失败:', error)
    ElMessage.error('获取权限数据失败')
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadRoleList()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增角色'
  form.name = ''
  form.description = ''
  form.status = 'enabled'
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑角色'
  // 保存角色ID但不在表单中显示
  form.originalId = row.id
  form.name = row.name
  form.description = row.description || ''
  form.status = row.status || 'enabled'
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await axios.delete(`/api/admin/roles/${row.id}`)
    ElMessage.success('删除成功')
    loadRoleList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除角色失败:', error)
      // 根据错误信息显示具体的错误原因
      if (error.response && error.response.data && error.response.data.message) {
        ElMessage.error(error.response.data.message)
      } else {
        ElMessage.error('删除角色失败')
      }
    }
  }
}

// 权限配置
const handlePermissions = (row) => {
  currentRole.value = { ...row }
  checkedPermissions.value = row.permissions || []
  permissionDialogVisible.value = true
}

// 状态切换
const handleStatusChange = async (row) => {
  try {
    await axios.put(`/api/admin/roles/${row.id}/status`, {
      status: row.status
    })
    ElMessage.success('状态更新成功')
  } catch (error) {
    // 恢复原状态
    row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
    console.error('状态更新失败:', error)
    // 根据错误信息显示具体的错误原因
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('状态更新失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (form.originalId) {
      // 编辑角色
      await axios.put(`/api/admin/roles/${form.originalId}`, {
        name: form.name,
        description: form.description,
        status: form.status
      })
      ElMessage.success('编辑成功')
    } else {
      // 新增角色
      await axios.post('/api/admin/roles', {
        name: form.name,
        description: form.description,
        status: form.status,
        permissions: [] // 新增时默认无权限，需要后续配置
      })
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
    loadRoleList()
  } catch (error) {
    console.error('保存角色失败:', error)
    // 根据错误信息显示具体的错误原因
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error(form.originalId ? '编辑失败' : '新增失败')
    }
  }
}

// 提交权限
const handlePermissionSubmit = async () => {
  if (!permissionTreeRef.value) return
  
  try {
    const checkedKeys = permissionTreeRef.value.getCheckedKeys()
    
    await axios.put(`/api/admin/roles/${currentRole.value.id}`, {
      name: currentRole.value.name,
      permissions: checkedKeys
    })
    
    ElMessage.success('权限配置成功')
    permissionDialogVisible.value = false
    loadRoleList() // 重新加载角色列表
  } catch (error) {
    console.error('权限配置失败:', error)
    ElMessage.error('权限配置失败')
  }
}

// 对话框关闭处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
  form.originalId = ''
  form.status = ''
}

const handlePermissionDialogClose = () => {
  checkedPermissions.value = []
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  loadRoleList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadRoleList()
}

onMounted(() => {
  loadRoleList()
  loadPermissionTree()
})
</script>

<style scoped>
.role-manage {
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
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
</style>