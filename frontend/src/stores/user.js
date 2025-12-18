import { defineStore } from 'pinia'
import axios from '../utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    menus: [],
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
    async fetchMenus() {
      if (!this.token) return []
      const res = await axios.get('/api/menus')
      this.menus = res
      return res
    },
    hasPermission(code) {
      if (!this.userInfo || !this.userInfo.role) return false
      return this.userInfo.role.permissions.includes(code)
    },
    logout() {
      this.setToken('')
      this.userInfo = null
      this.menus = []
    },
  },
})


