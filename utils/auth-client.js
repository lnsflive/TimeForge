import axios from 'axios'

export function createAuthClient(baseURL, storage, adapter) {
  // Legacy tokens must never override the server-managed cookie session.
  storage?.removeItem('strapi_jwt')
  const client = axios.create({ baseURL, withCredentials: true, adapter })
  return {
    async login(data) {
      storage?.removeItem('strapi_jwt')
      await client.post('/portfolio/auth/local', data)
      return { user: await this.getUser() }
    },
    async register(data) {
      await client.post('/auth/local/register', data)
    },
    async logout() {
      await client.post('/portfolio/auth/logout')
      storage?.removeItem('strapi_jwt')
    },
    async restoreUser() {
      await client.get('/portfolio/session')
      return this.getUser()
    },
    async getUser() {
      return (await client.get('/users/me')).data
    },
    async getTimeForgeProfile() {
      return (await client.get('/portfolio/timeforge/profile')).data
    },
    async updateTimeForgeProfile(payRate) {
      return (await client.put('/portfolio/timeforge/profile', { payRate })).data
    },
    googleLoginUrl() {
      return new URL('/portfolio/auth/start?app=timeforge', baseURL).href
    }
  }
}

export function authErrorMessage(error, fallback) {
  const data = error?.response?.data
  const message = data?.error?.message || data?.message?.[0]?.messages?.[0]?.message || data?.message
  return typeof message === 'string' ? message : fallback
}
