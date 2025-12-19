import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Layout from '../layouts/Layout.vue'

const staticRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'Root',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘', permission: 'page:dashboard' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes,
})

let isDynamicRoutesAdded = false

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 公共页面直接放行
  if (to.meta.public) {
    // 如果已登录用户访问登录页，重定向到首页
    if (to.path === '/login' && userStore.token) {
      try {
        if (!userStore.userInfo) {
          await userStore.fetchUserInfo()
        }
        // 跳转到用户有权限的第一个页面
        if (userStore.hasPermission('page:dashboard')) {
          return next('/dashboard')
        } else if (userStore.hasPermission('page:personal')) {
          return next('/personal')
        }
      } catch (e) {
        // 获取用户信息失败，清除token重新登录
        userStore.logout()
        return next()
      }
    }
    return next()
  }

  // 没有 token 尝试恢复
  if (!userStore.token) {
    await userStore.restoreToken()
  }

  // 恢复失败跳登录页
  if (!userStore.token) {
    return next({ path: '/login', replace: true })
  }

  try {
    if (!isDynamicRoutesAdded) {
      await userStore.fetchUserInfo()
      const menus = await userStore.fetchMenus()

      /** 
       * 扁平化菜单 & 处理路径
       * @param {Array} menuList - 菜单数组
       */
      const flattenMenusWithPath = (menuList) => {
        const result = []

        const processMenu = (menu) => {
          // 使用菜单的完整路径，如果没有则以 / 开头
          const fullPath = menu.path.startsWith('/') ? menu.path : `/${menu.path}`

          // 有组件的才注册路由
          if (menu.component && menu.component !== '') {
            result.push({
              ...menu,
              fullPath
            })
          }

          // 处理子菜单
          if (menu.children && menu.children.length > 0) {
            menu.children.forEach(child => processMenu(child))
          }
        }

        menuList.forEach(menu => processMenu(menu))
        return result
      }

      const allMenus = flattenMenusWithPath(menus)

      // 动态注册路由
      allMenus.forEach((menu) => {
        // 去掉开头 / 作为路由 path
        const routePath = menu.fullPath.replace(/^\//, '')

        // 避免重复注册已存在的路由
        try {
          router.addRoute('Root', {
            path: routePath,
            name: menu.component,
            component: () => import(`../views/${menu.component}.vue`),
            meta: { title: menu.title, permission: menu.permission },
          })
        } catch (error) {
          console.warn(`路由 ${routePath} 已存在或注册失败:`, error.message)
        }
      })

      isDynamicRoutesAdded = true

      // 避免停留在未注册路由时报错
      return next({ ...to, replace: true })
    }
  } catch (e) {
    console.error('加载动态路由出错:', e)
    userStore.logout()
    return next({ path: '/login', replace: true })
  }

  // 权限校验 - 避免无限重定向
  if (to.meta.permission && !userStore.hasPermission(to.meta.permission)) {
    // 检查是否已经在尝试跳转到登录页，避免循环
    if (to.path !== '/login') {
      // 重定向到用户有权限的第一个页面
      if (userStore.hasPermission('page:personal')) {
        return next('/personal')
      } else if (userStore.hasPermission('page:dashboard')) {
        return next('/dashboard')
      } else {
        // 如果没有任何页面权限，重定向到登录页
        userStore.logout()
        return next('/login')
      }
    } else {
      // 如果已经在登录页，直接放行
      return next()
    }
  }

  next()
})

export default router