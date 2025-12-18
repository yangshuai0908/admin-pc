import { defineStore } from 'pinia'

const THEME_KEY = 'theme-mode'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: localStorage.getItem(THEME_KEY) || 'light', // light | dark
  }),
  actions: {
    init() {
      this.applyTheme(this.mode)
    },
    toggle() {
      this.mode = this.mode === 'light' ? 'dark' : 'light'
      localStorage.setItem(THEME_KEY, this.mode)
      this.applyTheme(this.mode)
    },
    applyTheme(mode) {
      const root = document.documentElement
      if (mode === 'dark') {
        root.setAttribute('data-theme', 'dark')
      } else {
        root.setAttribute('data-theme', 'light')
      }
    },
  },
})


