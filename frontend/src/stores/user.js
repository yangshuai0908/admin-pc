import { defineStore } from 'pinia'
import axios from '../utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    menus: [],
    _menusFetched: false, // 添加缓存标志
    unreadCount: 0, // 添加未读消息数量状态
  }),
  actions: {
    setToken(token) {
      this.token = token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },
    async restoreToken() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
      }
    },
    async login(form) {
      const res = await axios.post('/api/login', form)
      this.setToken(res.token)
    },
    async fetchUserInfo() {
      if (!this.token) return
      const res = await axios.get('/api/user/info')
      this.userInfo = res
    },
    async fetchMenus(force = false) {
      if (!this.token) return []
      // 如果已经获取过菜单且不强制刷新，直接返回缓存的数据
      if (!force && this._menusFetched && this.menus.length > 0) {
        return this.menus
      }
      const res = await axios.get('/api/menus')
      this.menus = res
      this._menusFetched = true
      return res
    },
    async refreshUserInfo() {
      if (this.token) {
        await this.fetchUserInfo()
        await this.fetchMenus(true) // 强制刷新菜单
      }
    },
    hasPermission(code) {
      if (!this.userInfo || !this.userInfo.role) return false
      return this.userInfo.role.permissions.includes(code)
    },
    async fetchUnreadCount() {
      if (!this.token) return
      try {
        const response = await fetch('/api/messages/unread-count', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
        const data = await response.json()
        if (response.ok) {
          this.unreadCount = data.unreadCount
        }
      } catch (error) {
        console.error('获取未读消息数量失败:', error)
      }
    },
    logout() {
      this.setToken('')
      this.userInfo = null
      this.menus = []
      this._menusFetched = false // 重置缓存标志
      this.unreadCount = 0 // 重置未读数量
    },
  },
})