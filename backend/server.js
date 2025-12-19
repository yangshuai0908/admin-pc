const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'demo-secret';

app.use(cors());
app.use(bodyParser.json());

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 确保 uploads 目录存在
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  },
  fileFilter: function (req, file, cb) {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件!'));
    }
  }
});

// ===== 从 JSON 文件加载 RBAC 数据（模拟简单持久化） =====
const dbFile = path.join(__dirname, 'data', 'rbac.json');

let db = {
  roles: [],
  users: [],
  menus: [],
};

function loadDb() {
  try {
    const content = fs.readFileSync(dbFile, 'utf-8');
    db = JSON.parse(content);
  } catch (e) {
    console.error('读取 RBAC JSON 失败，将使用内存默认值：', e.message);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('写入 RBAC JSON 失败：', e.message);
  }
}

loadDb();

function findUser(username, password) {
  return db.users.find((u) => u.username === username && u.password === password);
}

function getRoleById(id) {
  return db.roles.find((r) => r.id === id);
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: '未授权' });
  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token 无效或已过期' });
  }
}

// ===== 接口 =====

// 登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = findUser(username, password);
  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }
  const role = getRoleById(user.roleId);
  // 检查角色是否存在且启用
  if (!role || role.status !== 'enabled') {
    return res.status(401).json({ message: '账户角色已被禁用，无法登录' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, roleId: user.roleId, permissions: role.permissions },
    JWT_SECRET,
    { expiresIn: '4h' }
  );

  res.json({
    token,
  });
});

// 获取当前用户信息（含权限）
app.get('/api/user/info', authMiddleware, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  const role = getRoleById(user.roleId);
  
  // 返回用户信息时包含头像字段
  res.json({
    id: user.id,
    username: user.username,
    email: user.email || '',
    phone: user.phone || '',
    avatar: user.avatar || '',
    role,
  });
});

// 更新用户个人信息（包括头像）
app.post('/api/user/profile', authMiddleware, (req, res) => {
  const { email, phone, avatar } = req.body;
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  // 更新用户信息
  if (email !== undefined) db.users[userIndex].email = email;
  if (phone !== undefined) db.users[userIndex].phone = phone;
  if (avatar !== undefined) db.users[userIndex].avatar = avatar;
  
  saveDb();
  
  // 返回更新后的用户信息
  const updatedUser = db.users[userIndex];
  const role = getRoleById(updatedUser.roleId);
  
  res.json({
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email || '',
    phone: updatedUser.phone || '',
    avatar: updatedUser.avatar || '',
    role,
    message: '用户信息更新成功'
  });
});

// 用户修改自己的密码
app.post('/api/user/change-password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  // 验证参数
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: '旧密码和新密码不能为空' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: '新密码长度不能少于6位' });
  }
  
  // 查找用户
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  // 验证旧密码
  if (db.users[userIndex].password !== oldPassword) {
    return res.status(400).json({ message: '旧密码不正确' });
  }
  
  // 更新密码
  db.users[userIndex].password = newPassword;
  saveDb();
  
  // 返回成功消息，告知前端需要重新登录
  res.json({ 
    message: '密码修改成功，请重新登录',
    requireRelogin: true 
  });
});

// 获取动态菜单 / 路由，根据权限过滤
app.get('/api/menus', authMiddleware, (req, res) => {
  const { permissions, roleId } = req.user;

  // 管理员可以看到所有菜单
  if (roleId === 'admin') {
    res.json(db.menus);
    return;
  }

  const filterMenus = (list) => {
    if (!Array.isArray(list)) return [];
    
    return list
      .filter((m) => m && (!m.permission || permissions.includes(m.permission)))
      .map((m) => ({
        ...m,
        children: m.children && Array.isArray(m.children) ? filterMenus(m.children) : [],
      }));
  };

  res.json(filterMenus(db.menus));
});

// 简单权限校验示例（页面或按钮）
app.post('/api/check-permission', authMiddleware, (req, res) => {
  const { code } = req.body;
  const { permissions } = req.user;
  res.json({
    allowed: permissions.includes(code),
  });
});

// 管理端：获取 / 更新 RBAC 配置（仅管理员权限，可根据需要调整）
app.get('/api/admin/rbac', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('menu:edit')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  res.json(db);
});

app.post('/api/admin/rbac', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('menu:edit')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  const { roles, menus } = req.body;
  if (Array.isArray(roles)) db.roles = roles;
  if (Array.isArray(menus)) db.menus = menus;
  saveDb();
  res.json({ message: '保存成功', db });
});

// 菜单管理相关API
app.get('/api/admin/menus', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('menu:edit')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  res.json({ menus: db.menus });
});

// 获取单个菜单详情
app.get('/api/admin/menus/:id', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('menu:edit')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  
  const { id } = req.params;
  
  const findMenu = (menus, id) => {
    for (let menu of menus) {
      if (menu.id.toString() === id.toString()) {
        return menu;
      }
      if (menu.children) {
        const found = findMenu(menu.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  const menu = findMenu(db.menus, id);
  if (menu) {
    res.json(menu);
  } else {
    res.status(404).json({ message: '菜单不存在' });
  }
});

// 生成下一个可用的菜单ID
const getNextMenuId = (menus) => {
  const extractIds = (menuList) => {
    let ids = [];
    menuList.forEach(menu => {
      if (menu.id && !isNaN(parseInt(menu.id))) {
        ids.push(parseInt(menu.id));
      }
      if (menu.children && menu.children.length > 0) {
        ids = ids.concat(extractIds(menu.children));
      }
    });
    return ids;
  };
  
  const existingIds = extractIds(menus);
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  return (maxId + 1).toString();
};

app.post('/api/admin/menus', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('menu:edit')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  
  const { title, path, icon, component, permission, type, parentId } = req.body;
  const newMenu = {
    id: getNextMenuId(db.menus),
    title,
    path: path || '',
    icon: icon || '',
    component: component || '',
    permission: permission || '',
    type: type || 'menu'
  };
  
  if (parentId) {
    const addToParent = (menus, parentId, newMenu) => {
      for (let menu of menus) {
        if (menu.id === parentId) {
          if (!menu.children) menu.children = [];
          menu.children.push(newMenu);
          return true;
        }
        if (menu.children && addToParent(menu.children, parentId, newMenu)) {
          return true;
        }
      }
      return false;
    };
    addToParent(db.menus, parentId, newMenu);
  } else {
    db.menus.push(newMenu);
  }
  
  saveDb();
  res.json(newMenu);
});

app.put('/api/admin/menus/:id', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('menu:edit')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  
  const { id } = req.params;
  const updateData = req.body;
  
  const updateMenu = (menus, id, updateData) => {
    for (let menu of menus) {
      if (menu.id.toString() === id.toString()) {
        Object.assign(menu, updateData);
        return true;
      }
      if (menu.children && updateMenu(menu.children, id, updateData)) {
        return true;
      }
    }
    return false;
  };
  
  const updated = updateMenu(db.menus, id, updateData);
  if (updated) {
    saveDb();
    res.json({ message: '更新成功' });
  } else {
    res.status(404).json({ message: '菜单不存在' });
  }
});

app.delete('/api/admin/menus/:id', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('menu:edit')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  
  const { id } = req.params;
  
  const deleteMenu = (menus, id) => {
    for (let i = 0; i < menus.length; i++) {
      if (menus[i].id.toString() === id.toString()) {
        menus.splice(i, 1);
        return true;
      }
      if (menus[i].children && deleteMenu(menus[i].children, id)) {
        return true;
      }
    }
    return false;
  };
  
  const deleted = deleteMenu(db.menus, id);
  if (deleted) {
    saveDb();
    res.json({ message: '删除成功' });
  } else {
    res.status(404).json({ message: '菜单不存在' });
  }
});

// 角色管理相关API
app.get('/api/admin/roles', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('page:role')) {
    return res.status(403).json({ message: '无角色管理权限' });
  }
  res.json({ roles: db.roles });
});

// 获取下一个可用的角色ID
function getNextRoleId() {
  // 过滤出非admin的角色并提取数字部分
  const userRoleIds = db.roles
    .filter(role => role.id !== 'admin')
    .map(role => {
      // 尝试解析ID中的数字部分
      const match = role.id.match(/^(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(id => !isNaN(id));
  
  // 如果没有用户角色，从1开始
  if (userRoleIds.length === 0) {
    return '1';
  }
  
  // 找到最大ID并加1
  const maxId = Math.max(...userRoleIds);
  return (maxId + 1).toString();
}

app.post('/api/admin/roles', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('role:add')) {
    return res.status(403).json({ message: '无角色新增权限' });
  }
  
  const { id, name, description, permissions } = req.body;
  
  // 检查角色ID是否已存在
  const roleId = id || getNextRoleId();
  const existingRole = db.roles.find(role => role.id === roleId);
  if (existingRole) {
    return res.status(400).json({ message: '角色ID已存在' });
  }
  
  const newRole = {
    id: roleId,
    name,
    description: description || '',
    permissions: permissions || [],
    createTime: new Date().toLocaleDateString(),
    status: 'enabled'
  };
  
  db.roles.push(newRole);
  saveDb();
  res.json({ message: '角色创建成功', role: newRole });
});

app.put('/api/admin/roles/:id', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('role:edit')) {
    return res.status(403).json({ message: '无角色编辑权限' });
  }
  
  const { id } = req.params;
  const { name, description, permissions, status } = req.body;
  
  const roleIndex = db.roles.findIndex(role => role.id.toString() === id.toString());
  if (roleIndex === -1) {
    return res.status(404).json({ message: '角色不存在' });
  }
  
  // 防止编辑admin角色的基本信息
  if (id === 'admin' && (name !== '管理员' || description)) {
    return res.status(400).json({ message: '不能修改管理员角色的基本信息' });
  }
  
  // 检查是否要禁用角色，且该角色是最后一个管理员角色
  if (status === 'disabled' && id === '1') {
    // 查找其他启用的管理员角色
    const otherEnabledAdminRoles = db.roles.filter((role, index) => 
      role.id === '1' && index !== roleIndex && role.status === 'enabled'
    );
    
    // 如果没有其他启用的管理员角色，则拒绝禁用
    if (otherEnabledAdminRoles.length === 0) {
      return res.status(400).json({ message: '系统必须至少保留一个启用的管理员角色' });
    }
  }
  
  // 检查角色名称是否已被其他角色使用
  if (name) {
    const existingRole = db.roles.find((r, index) => r.name === name && index !== roleIndex);
    if (existingRole) {
      return res.status(400).json({ message: '角色名称已存在' });
    }
  }
  
  // 更新角色信息
  if (name) db.roles[roleIndex].name = name;
  if (description !== undefined) db.roles[roleIndex].description = description;
  if (Array.isArray(permissions)) db.roles[roleIndex].permissions = permissions;
  if (status) db.roles[roleIndex].status = status;
  
  saveDb();
  res.json({ message: '角色更新成功', role: db.roles[roleIndex] });
});

app.delete('/api/admin/roles/:id', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('role:delete')) {
    return res.status(403).json({ message: '无角色删除权限' });
  }
  
  const { id } = req.params;
  
  // 防止删除admin角色
  if (id === 'admin') {
    return res.status(400).json({ message: '不能删除管理员角色' });
  }
  
  const roleIndex = db.roles.findIndex(role => role.id.toString() === id.toString());
  
  if (roleIndex === -1) {
    return res.status(404).json({ message: '角色不存在' });
  }
  
  // 检查是否有用户正在使用此角色
  const usersWithThisRole = db.users.filter(user => user.roleId === id);
  if (usersWithThisRole.length > 0) {
    return res.status(400).json({ message: '有用户正在使用此角色，不能删除' });
  }
  
  db.roles.splice(roleIndex, 1);
  saveDb();
  res.json({ message: '角色删除成功' });
});

// 切换角色状态
app.put('/api/admin/roles/:id/status', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('role:edit')) {
    return res.status(403).json({ message: '无角色编辑权限' });
  }
  
  const { id } = req.params;
  const { status } = req.body;
  
  const roleIndex = db.roles.findIndex(role => role.id.toString() === id.toString());
  if (roleIndex === -1) {
    return res.status(404).json({ message: '角色不存在' });
  }
  
  // 防止禁用admin角色
  if (id === 'admin' && status === 'disabled') {
    return res.status(400).json({ message: '不能禁用管理员角色' });
  }
  
  // 检查是否要禁用角色，且该角色是最后一个启用的管理员角色
  if (status === 'disabled' && id === '1') {
    // 查找其他启用的管理员角色
    const otherEnabledAdminRoles = db.roles.filter((role, index) => 
      role.id === '1' && index !== roleIndex && role.status === 'enabled'
    );
    
    // 如果没有其他启用的管理员角色，则拒绝禁用
    if (otherEnabledAdminRoles.length === 0) {
      return res.status(400).json({ message: '系统必须至少保留一个启用的管理员角色' });
    }
  }
  
  db.roles[roleIndex].status = status;
  saveDb();
  res.json({ message: '角色状态更新成功', role: db.roles[roleIndex] });
});

// 获取权限树数据（用于权限配置）
app.get('/api/admin/permissions', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('page:role')) {
    return res.status(403).json({ message: '无角色管理权限' });
  }
  
  // 构建页面权限树数据
  const pagePermissions = db.menus.map(menu => {
    // 处理有子菜单的情况
    if (menu.children && menu.children.length > 0) {
      return {
        id: menu.permission,
        title: menu.title,
        children: menu.children.map(child => ({
          id: child.permission,
          title: child.title
        }))
      };
    } else {
      return {
        id: menu.permission,
        title: menu.title
      };
    }
  });
  
  // 构建按钮权限树数据
  const buttonPermissions = [
    {
      id: 'user_operations',
      title: '用户管理操作',
      children: [
        { id: 'user:add', title: '新增用户' },
        { id: 'user:edit', title: '编辑用户' },
        { id: 'user:delete', title: '删除用户' },
        { id: 'user:view', title: '查看用户' }
      ]
    },
    {
      id: 'role_operations',
      title: '角色管理操作',
      children: [
        { id: 'role:add', title: '新增角色' },
        { id: 'role:edit', title: '编辑角色' },
        { id: 'role:delete', title: '删除角色' },
        { id: 'role:assign', title: '分配权限' },
        { id: 'role:view', title: '查看角色' }
      ]
    },
    {
      id: 'menu_operations',
      title: '菜单管理操作',
      children: [
        { id: 'menu:add', title: '新增菜单' },
        { id: 'menu:edit', title: '编辑菜单' },
        { id: 'menu:delete', title: '删除菜单' },
        { id: 'menu:view', title: '查看菜单' }
      ]
    },
    {
      id: 'personal_operations',
      title: '个人资料操作',
      children: [
        { id: 'personal:edit', title: '编辑个人资料' },
        { id: 'personal:view', title: '查看个人资料' }
      ]
    },
    {
      id: 'dashboard_operations',
      title: '仪表盘操作',
      children: [
        { id: 'dashboard:view', title: '查看仪表盘' }
      ]
    }
  ];
  
  const permissionTree = [
    {
      id: 'page',
      title: '页面权限',
      children: pagePermissions
    },
    {
      id: 'operation',
      title: '按钮权限',
      children: buttonPermissions
    }
  ];
  
  res.json(permissionTree);
});

// 用户管理相关API
app.get('/api/admin/users', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('page:user')) {
    return res.status(403).json({ message: '无用户管理权限' });
  }
  
  const usersWithRoles = db.users.map(user => {
    const role = getRoleById(user.roleId);
    return {
      ...user,
      roleName: role ? role.name : '未知角色',
      roleId: user.roleId
    };
  });
  
  res.json({ users: usersWithRoles });
});

// 获取下一个可用的用户ID
function getNextUserId() {
  // 提取所有用户的数字ID
  const userIds = db.users
    .map(user => {
      // 尝试解析ID中的数字部分
      const match = user.id.toString().match(/^(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(id => !isNaN(id));
  
  // 如果没有用户，从1开始
  if (userIds.length === 0) {
    return '1';
  }
  
  // 找到最大ID并加1
  const maxId = Math.max(...userIds);
  return (maxId + 1).toString();
}

app.post('/api/admin/users', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('user:add')) {
    return res.status(403).json({ message: '无新增用户权限' });
  }
  
  const { username, password, roleId } = req.body;
  
  // 检查用户名是否已存在
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ message: '用户名已存在' });
  }
  
  // 检查角色是否存在
  const role = getRoleById(roleId);
  if (!role) {
    return res.status(400).json({ message: '角色不存在' });
  }
  
  const newUser = {
    id: getNextUserId(),
    username,
    password,
    roleId
  };
  
  db.users.push(newUser);
  saveDb();
  res.json({ message: '用户创建成功', user: newUser });
});

app.put('/api/admin/users/:id', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('user:edit')) {
    return res.status(403).json({ message: '无编辑用户权限' });
  }
  
  const { id } = req.params;
  const { username, password, roleId } = req.body;
  
  const userIndex = db.users.findIndex(user => user.id.toString() === id.toString());
  if (userIndex === -1) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  // 检查是否要修改角色，且该用户是最后一个管理员用户
  if (roleId && db.users[userIndex].roleId === '1') {
    // 查找其他管理员用户
    const otherAdminUsers = db.users.filter((user, index) => 
      user.roleId === '1' && index !== userIndex
    );
    
    // 如果没有其他管理员用户，且要将此用户改为非管理员角色，则拒绝操作
    if (otherAdminUsers.length === 0 && roleId !== '1') {
      return res.status(400).json({ message: '系统必须至少保留一个管理员用户' });
    }
  }
  
  // 检查用户名是否已被其他用户使用
  if (username && db.users.find((u, index) => u.username === username && index !== userIndex)) {
    return res.status(400).json({ message: '用户名已存在' });
  }
  
  // 检查角色是否存在
  if (roleId) {
    const role = getRoleById(roleId);
    if (!role) {
      return res.status(400).json({ message: '角色不存在' });
    }
  }
  
  // 更新用户信息
  if (username) db.users[userIndex].username = username;
  if (password) db.users[userIndex].password = password;
  if (roleId) db.users[userIndex].roleId = roleId;
  
  saveDb();
  res.json({ message: '用户更新成功', user: db.users[userIndex] });
});

app.delete('/api/admin/users/:id', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('user:delete')) {
    return res.status(403).json({ message: '无删除用户权限' });
  }
  
  const { id } = req.params;
  const userIndex = db.users.findIndex(user => user.id.toString() === id.toString());
  
  if (userIndex === -1) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  // 检查是否是管理员用户
  if (db.users[userIndex].roleId === '1') {
    // 查找其他管理员用户
    const otherAdminUsers = db.users.filter((user, index) => 
      user.roleId === '1' && index !== userIndex
    );
    
    // 如果没有其他管理员用户，则拒绝删除
    if (otherAdminUsers.length === 0) {
      return res.status(400).json({ message: '系统必须至少保留一个管理员用户' });
    }
  }
  
  // 防止删除admin用户
  if (db.users[userIndex].username === 'admin') {
    return res.status(400).json({ message: '不能删除管理员用户' });
  }
  
  db.users.splice(userIndex, 1);
  saveDb();
  res.json({ message: '用户删除成功' });
});

// 头像上传接口
app.post('/api/upload/avatar', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '请上传文件' });
  }
  
  // 保存头像路径到用户信息中
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  // 保存相对路径到数据库
  const avatarPath = '/uploads/' + req.file.filename;
  db.users[userIndex].avatar = avatarPath;
  saveDb();
  
  res.json({ 
    url: avatarPath,
    message: '头像上传成功' 
  });
});

// 静态文件服务，提供上传的文件访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`RBAC backend server running at http://localhost:${PORT}`);
});


