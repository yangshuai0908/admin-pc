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

  if (to.meta.public) {
    return next()
  }

  if (!userStore.token) {
    await userStore.restoreToken()
  }

  if (!userStore.token) {
    return next({ path: '/login', replace: true })
  }

  try {
    if (!isDynamicRoutesAdded) {
      await userStore.fetchUserInfo()
      const menus = await userStore.fetchMenus()

      menus.forEach((menu) => {
        if (menu.component === 'User') {
          router.addRoute('Root', {
            path: menu.path.replace(/^\//, ''),
            name: 'User',
            component: () => import('../views/User.vue'),
            meta: { title: menu.title, permission: menu.permission },
          })
        } else if (menu.component === 'MenuManage') {
          router.addRoute('Root', {
            path: menu.path.replace(/^\//, ''),
            name: 'MenuManage',
            component: () => import('../views/MenuManage.vue'),
            meta: { title: menu.title, permission: menu.permission },
          })
        }
      })

      isDynamicRoutesAdded = true
      return next({ ...to, replace: true })
    }
  } catch (e) {
    // 如果后端挂了或接口报错，清空本地登录信息，强制回登录页
    userStore.logout()
    return next({ path: '/login', replace: true })
  }

  if (to.meta.permission && !userStore.hasPermission(to.meta.permission)) {
    return next('/dashboard')
  }

  next()
})

export default router


