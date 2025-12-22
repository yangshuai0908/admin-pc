<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from '../utils/request'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const state = reactive({
  loading: false,
  saving: false,
  menus: [],
  expandedKeys: [],
  selectedKey: null,
  editingNode: null,
  showAddDialog: false,
  addForm: {
    title: '',
    path: '',
    icon: '',
    component: '',
    permission: '',
    type: 'menu',
    parentId: null
  }
})

const iconOptions = [
  { label: '仪表盘', value: 'Odometer' },
  { label: '用户', value: 'User' },
  { label: '设置', value: 'Setting' },
  { label: '文档', value: 'Document' },
  { label: '菜单', value: 'Menu' },
  { label: '首页', value: 'House' },
  { label: '锁', value: 'Lock' },
  { label: '星', value: 'Star' },
  { label: '文件夹', value: 'Folder' },
  { label: '链接', value: 'Link' }
]

const loadData = async () => {
  state.loading = true
  try {
    const res = await axios.get('/api/admin/menus')
    state.menus = res.menus || []

    // 默认展开所有节点
    state.expandedKeys = state.menus.map(menu => menu.id)
  } catch (e) {
    ElMessage.error(e.message || '加载菜单配置失败')
  } finally {
    state.loading = false
  }
}

const handleAddMenu = (parentData = null) => {
  state.addForm = {
    title: '',
    path: '',
    icon: '',
    component: '',
    permission: '',
    type: 'menu',
    parentId: parentData ? parentData.id : null
  }
  state.showAddDialog = true
}

const handleEdit = (data) => {
  state.editingNode = { ...data }
}

const handleDelete = async (data) => {
  try {
    await ElMessageBox.confirm('确定要删除此菜单项吗？删除后不可恢复。', '确认删除', {
      type: 'warning'
    })

    await axios.delete(`/api/admin/menus/${data.id}`)
    deleteMenuById(state.menus, data.id)
    ElMessage.success('删除成功')
    // 刷新用户菜单
    await userStore.fetchMenus(true)
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

const deleteMenuById = (menus, id) => {
  for (let i = 0; i < menus.length; i++) {
    if (menus[i].id === id) {
      menus.splice(i, 1)
      return true
    }
    if (menus[i].children && deleteMenuById(menus[i].children, id)) {
      return true
    }
  }
  return false
}

const handleSaveEdit = async () => {
  if (!state.editingNode.title) {
    ElMessage.error('请输入菜单名称')
    return
  }

  try {
    await axios.put(`/api/admin/menus/${state.editingNode.id}`, state.editingNode)
    updateMenuById(state.menus, state.editingNode.id, state.editingNode)
    state.editingNode = null
    ElMessage.success('修改成功')
    // 刷新用户菜单
    await userStore.fetchMenus(true)
  } catch (e) {
    ElMessage.error(e.message || '修改失败')
  }
}

const updateMenuById = (menus, id, newData) => {
  for (let menu of menus) {
    if (menu.id === id) {
      Object.assign(menu, newData)
      return true
    }
    if (menu.children && updateMenuById(menu.children, id, newData)) {
      return true
    }
  }
  return false
}

const handleSaveAdd = async () => {
  if (!state.addForm.title) {
    ElMessage.error('请输入菜单名称')
    return
  }

  try {
    const newMenuData = {
      title: state.addForm.title,
      path: state.addForm.path,
      icon: state.addForm.icon,
      component: state.addForm.component,
      permission: state.addForm.permission,
      type: state.addForm.type,
      parentId: state.addForm.parentId
    }

    const response = await axios.post('/api/admin/menus', newMenuData)
    const newMenu = response.data

    if (state.addForm.parentId) {
      addMenuToParent(state.menus, state.addForm.parentId, newMenu)
    } else {
      state.menus.push(newMenu)
    }

    state.showAddDialog = false
    state.expandedKeys.push(newMenu.id)
    ElMessage.success('添加成功')
    // 刷新用户菜单
    await userStore.fetchMenus(true)
  } catch (e) {
    ElMessage.error(e.message || '添加失败')
  }
}

const addMenuToParent = (menus, parentId, newMenu) => {
  for (let menu of menus) {
    if (menu.id === parentId) {
      if (!menu.children) {
        menu.children = []
      }
      menu.children.push(newMenu)
      return true
    }
    if (menu.children && addMenuToParent(menu.children, parentId, newMenu)) {
      return true
    }
  }
  return false
}

const getNodeTitle = (data) => {
  return data.title + (data.type === 'button' ? ' (按钮)' : '')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="menu-manage">
    <el-card class="visual-editor">
      <template #header>
        <div class="card-header">
          <span>🎨 可视化菜单管理</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="handleAddMenu()" v-if="userStore.hasPermission('menu:add')">
              <el-icon>
                <Plus />
              </el-icon>
              添加顶级菜单
            </el-button>
          </div>
        </div>
      </template>

      <el-tree :data="state.menus" :props="{ children: 'children', label: 'title' }"
        :default-expanded-keys="state.expandedKeys" node-key="id" class="menu-tree">
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-content">
              <el-icon v-if="data.icon" class="node-icon">
                <component :is="data.icon" />
              </el-icon>
              <span class="node-title">{{ getNodeTitle(data) }}</span>
              <el-tag v-if="data.permission" size="small" type="info">
                {{ data.permission }}
              </el-tag>
              <el-tag v-if="data.path" size="small">
                {{ data.path }}
              </el-tag>
            </div>
            <div class="node-actions">
              <el-button v-if="data.type !== 'button' && userStore.hasPermission('menu:add')" size="small"
                type="primary" @click="handleAddMenu(data)">
                添加子项
              </el-button>
              <el-button size="small" @click="handleEdit(data)" v-if="userStore.hasPermission('menu:edit')">
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(data)"
                v-if="userStore.hasPermission('menu:delete')">
                删除
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </el-card>



    <!-- 添加菜单对话框 -->
    <el-dialog v-model="state.showAddDialog" :title="state.addForm.parentId ? '添加子菜单' : '添加顶级菜单'" width="600px">
      <el-form :model="state.addForm" label-width="100px">
        <el-form-item label="菜单名称" required>
          <el-input v-model="state.addForm.title" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-radio-group v-model="state.addForm.type">
            <el-radio label="menu">菜单</el-radio>
            <el-radio label="button">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="state.addForm.type === 'menu'" label="路由路径">
          <el-input v-model="state.addForm.path" placeholder="如: /user-manage" />
        </el-form-item>
        <el-form-item v-if="state.addForm.type === 'menu'" label="组件名">
          <el-input v-model="state.addForm.component" placeholder="如: UserManage" />
        </el-form-item>
        <el-form-item v-if="state.addForm.type === 'menu'" label="图标">
          <el-select v-model="state.addForm.icon" placeholder="选择图标" clearable>
            <el-option v-for="icon in iconOptions" :key="icon.value" :label="icon.label" :value="icon.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="state.addForm.permission" placeholder="如: page:user" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="state.showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAdd">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑菜单对话框 -->
    <el-dialog :model-value="!!state.editingNode" @update:model-value="(val) => !val && (state.editingNode = null)"
      title="编辑菜单" width="600px">
      <el-form v-if="state.editingNode" :model="state.editingNode" label-width="100px">
        <el-form-item label="菜单名称" required>
          <el-input v-model="state.editingNode.title" />
        </el-form-item>
        <el-form-item label="路由路径">
          <el-input v-model="state.editingNode.path" />
        </el-form-item>
        <el-form-item label="组件名">
          <el-input v-model="state.editingNode.component" />
        </el-form-item>
        <el-form-item label="图标">
          <el-select v-model="state.editingNode.icon" placeholder="选择图标" clearable>
            <el-option v-for="icon in iconOptions" :key="icon.value" :label="icon.label" :value="icon.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="state.editingNode.permission" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="state.editingNode = null">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.menu-manage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.visual-editor {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.menu-tree {
  margin-top: 16px;
  max-height: 500px;
  overflow-y: auto;

  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }

  /* 暗黑主题适配 */
  [data-theme='dark'] & {
    &::-webkit-scrollbar-track {
      background: #2d3748;
    }

    &::-webkit-scrollbar-thumb {
      background: #4a5568;

      &:hover {
        background: #718096;
      }
    }
  }
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;

  &:hover {
    .node-actions {
      opacity: 1;
    }
  }
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.node-icon {
  font-size: 16px;
  color: var(--primary-color);
}

.node-title {
  font-weight: 500;
  font-size: 14px;
}

.node-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;

  .el-button {
    padding: 4px 8px;
    font-size: 12px;
  }
}

/* 标签美化 */
.el-tag {
  margin-left: 4px;
}

/* 表单美化 */
.el-form-item {
  margin-bottom: 18px;
}

.el-dialog {
  .el-form {
    padding: 0 20px;
  }
}
</style>
