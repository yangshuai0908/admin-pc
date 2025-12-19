const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'demo-secret';

app.use(cors());
app.use(bodyParser.json());

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
  res.json({
    id: user.id,
    username: user.username,
    role,
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
  if (!req.user.permissions.includes('page:menu-manage')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  res.json(db);
});

app.post('/api/admin/rbac', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('page:menu-manage')) {
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
  if (!req.user.permissions.includes('page:menu-manage')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  res.json({ menus: db.menus });
});

app.post('/api/admin/menus', authMiddleware, (req, res) => {
  if (!req.user.permissions.includes('page:menu-manage')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  
  const { title, path, icon, component, permission, type, parentId } = req.body;
  const newMenu = {
    id: Date.now().toString(),
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
  if (!req.user.permissions.includes('page:menu-manage')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  
  const { id } = req.params;
  const updateData = req.body;
  
  const updateMenu = (menus, id, updateData) => {
    for (let menu of menus) {
      if (menu.id === id) {
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
  if (!req.user.permissions.includes('page:menu-manage')) {
    return res.status(403).json({ message: '无菜单管理权限' });
  }
  
  const { id } = req.params;
  
  const deleteMenu = (menus, id) => {
    for (let i = 0; i < menus.length; i++) {
      if (menus[i].id === id) {
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



app.listen(PORT, () => {
  console.log(`RBAC backend server running at http://localhost:${PORT}`);
});


