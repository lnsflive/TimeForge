import { defineStore } from 'pinia'
import { useRuntimeConfig } from 'nuxt/app'

interface User {
  id: number
  username: string
  email: string
  payRate?: number
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
  loggedIn: boolean
  user: User | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
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

    avatarImage(): string {
      console.log('User store - Getting avatar image:', {
        user: this.user,
        imageUrl: this.user?.image?.url
      })

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
      console.log('User store - Setting user:', user)
      this.user = user
      this.loggedIn = !!user
    },

    logout() {
      this.user = null
      this.loggedIn = false
    }
  }
})
