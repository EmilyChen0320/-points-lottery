import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    initialized: false,
    testMode: false,
    userId: '',
    profile: null,
    friendship: { friendFlag: false },
    environment: {},
  }),
  actions: {
    setUserSession(payload) {
      this.initialized = true
      this.testMode = Boolean(payload.testMode)
      this.userId = payload.userId ?? ''
      this.profile = payload.profile ?? null
      this.friendship = payload.friendship ?? { friendFlag: false }
      this.environment = payload.environment ?? {}
    },
  },
})
