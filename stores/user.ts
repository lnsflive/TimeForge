import { defineStore } from 'pinia'
import { useRuntimeConfig } from 'nuxt/app'

interface User {
  id: number
  username: string
  fullName?: string
  email: string
  image?: {
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
}

interface UserState {
  timeforgeProfile: { payRate: number | null } | null
  sessionChecked: boolean
  loggedIn: boolean
  user: User | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    timeforgeProfile: null,
    sessionChecked: false,
    loggedIn: false,
    user: null
  }),

  getters: {
    isLoggedIn(): boolean {
      return this.loggedIn
    },

    loggedInUser(): User | null {
      return this.user
    },

    username(): string | undefined {
      return this.user?.username
    },

    displayName(): string { return this.user?.fullName || this.user?.username || 'Account' },

    avatarImage(): string {
      const config = useRuntimeConfig()
      const baseUrl = config.public.apiBaseUrl

      if (this.user?.image?.url) {
        // Try to use thumbnail or small format first for better performance
        const thumbnailUrl = this.user.image.formats?.thumbnail?.url
        const smallUrl = this.user.image.formats?.small?.url
        const imageUrl = thumbnailUrl || smallUrl || this.user.image.url

        // Ensure URL is properly constructed with base URL
        if (imageUrl.startsWith('http')) {
          return imageUrl
        }
        return `${baseUrl}${imageUrl}`
      }

      return '/default-avatar.png'
    }
  },

  actions: {
    setUser(user: User | null) {
      if (this.user?.id !== user?.id || !user) this.timeforgeProfile = null
      this.sessionChecked = true
      this.user = user
      this.loggedIn = !!user
    },

    setTimeForgeProfile(profile: { payRate: number | null }) {
      this.timeforgeProfile = { payRate: profile.payRate }
    },

    logout() {
      this.timeforgeProfile = null
      this.user = null
      this.loggedIn = false
    }
  }
})
