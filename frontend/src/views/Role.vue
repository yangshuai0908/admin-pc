<template>
  <div class="role-manage">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleAdd">新增角色</el-button>
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
        <el-table-column prop="id" label="角色ID" width="80" />
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="description" label="角色描述" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            <el-button type="info" size="small" @click="handlePermissions(scope.row)">权限</el-button>
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
  id: '',
  name: '',
  description: ''
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
    // 模拟数据
    const mockData = [
      { id: 1, name: '管理员', description: '系统管理员，拥有所有权限', createTime: '2024-01-01 10:00:00' },
      { id: 2, name: '普通用户', description: '普通用户，基础权限', createTime: '2024-01-02 10:00:00' },
      { id: 3, name: '访客', description: '访客用户，只读权限', createTime: '2024-01-03 10:00:00' }
    ]
    
    tableData.value = mockData
    total.value = mockData.length
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  }
}

// 加载权限树数据
const loadPermissionTree = async () => {
  try {
    // 模拟权限树数据
    permissionTreeData.value = [
      {
        id: 'page',
        title: '页面权限',
        children: [
          { id: 'page:dashboard', title: '仪表盘' },
          { id: 'page:user', title: '用户管理' },
          { id: 'page:role', title: '角色管理' },
          { id: 'page:menu', title: '菜单管理' },
          { id: 'page:personal', title: '个人中心' },
          { id: 'page:system', title: '系统管理' }
        ]
      },
      {
        id: 'operation',
        title: '操作权限',
        children: [
          { id: 'user:add', title: '新增用户' },
          { id: 'user:edit', title: '编辑用户' },
          { id: 'user:delete', title: '删除用户' },
          { id: 'role:add', title: '新增角色' },
          { id: 'role:edit', title: '编辑角色' },
          { id: 'role:delete', title: '删除角色' }
        ]
      }
    ]
  } catch (error) {
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
  form.id = ''
  form.name = ''
  form.description = ''
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑角色'
  form.id = row.id
  form.name = row.name
  form.description = row.description
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
    
    ElMessage.success('删除成功')
    loadRoleList()
  } catch {
    // 用户取消删除
  }
}

// 权限配置
const handlePermissions = (row) => {
  currentRole.value = { ...row }
  // 模拟当前角色已有权限
  if (row.id === 1) {
    checkedPermissions.value = ['page:dashboard', 'page:user', 'page:role', 'page:menu', 'page:personal', 'page:system']
  } else {
    checkedPermissions.value = ['page:dashboard', 'page:personal']
  }
  permissionDialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 这里调用保存API
    ElMessage.success(form.id ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    loadRoleList()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 提交权限
const handlePermissionSubmit = async () => {
  if (!permissionTreeRef.value) return
  
  try {
    const checkedKeys = permissionTreeRef.value.getCheckedKeys()
    console.log('角色权限:', currentRole.value.id, checkedKeys)
    
    ElMessage.success('权限配置成功')
    permissionDialogVisible.value = false
  } catch (error) {
    ElMessage.error('权限配置失败')
  }
}

// 对话框关闭处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
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