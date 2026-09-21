import axios from 'axios'

export const GOOGLE_CALLBACK = 'https://jaimegonzalezjr.com/Projects/TimeForge/auth/google'
function secureUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid application URL')
  return url
}

export async function startGoogleLogin(app, session, client, cryptoSource = globalThis.crypto) {
  const config = await client.getOAuthApplication(app)
  const callback = secureUrl(config.callbackUrl)
  secureUrl(config.returnUrl)
  const state = Array.from(cryptoSource.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('')
  session.setItem('strapi_google_state', state)
  session.setItem('strapi_google_app', config.key)
  session.removeItem('strapi_google_return')
  callback.searchParams.set('state', state)
  const start = new URL('https://strapi.jaimegonzalezjr.com/connect/google')
  start.searchParams.set('callback', callback.href)
  return start.href
}

export async function completeGoogleLogin(search, session, client) {
  const query = new URLSearchParams(search)
  const expected = session.getItem('strapi_google_state')
  const app = session.getItem('strapi_google_app')
  session.removeItem('strapi_google_state')
  session.removeItem('strapi_google_app')
  session.removeItem('strapi_google_return')
  if (!expected || !app || query.get('state') !== expected || !query.get('access_token')) {
    throw new Error('Google sign-in expired or did not match this browser. Please try again.')
  }
  await client.exchangeGoogleToken(query.get('access_token'))
  const config = await client.getOAuthApplication(app)
  return secureUrl(config.returnUrl).href
}

export function createAuthClient(baseURL, storage, adapter) {
  const client = axios.create({ baseURL, withCredentials: false, adapter })
  client.interceptors.request.use(config => {
    const token = storage?.getItem('strapi_jwt')
    if (token && !config.url.startsWith('/auth/') && config.url !== '/oauthapplications') config.headers.Authorization = 'Bearer ' + token
    return config
  })
  function acceptAuth(data) {
    if (!data?.jwt || !data?.user?.id) throw new Error('Invalid authentication response')
    storage.setItem('strapi_jwt', data.jwt)
    return { user: data.user }
  }
  return {
    async getOAuthApplication(key) {
      if (typeof key !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/.test(key)) throw new Error('Invalid application key')
      const configs = (await client.get('/oauthapplications', { params: { key } })).data
      if (!Array.isArray(configs) || configs.length !== 1 || configs[0].key !== key) {
        throw new Error('Application is unavailable')
      }
      return configs[0]
    },
    async login(data) {
      return acceptAuth((await client.post('/auth/local', data)).data)
    },
    async exchangeGoogleToken(token) {
      return acceptAuth((await client.get('/auth/google/callback', { params: { access_token: token } })).data)
    },
    async register(data) {
      await client.post('/auth/local/register', data)
    },
    async logout() {
      storage?.removeItem('strapi_jwt')
      try { await client.post('/auth/logout', {}, { withCredentials: true }) } catch { /* Native JWT is already cleared. */ }
    },
    async restoreUser() {
      if (!storage?.getItem('strapi_jwt')) {
        const error = new Error('Sign in required')
        error.response = { status: 401 }
        throw error
      }
      try { return await this.getUser() } catch (error) {
        if (error.response?.status === 401) storage.removeItem('strapi_jwt')
        throw error
      }
    },
    async getUser() {
      return (await client.get('/users/me')).data
    },
    async getTimeForgeProfile() {
      const profiles = (await client.get('/timeforgeprofiles')).data
      return { payRate: profiles[0]?.payRate ?? null }
    },
    async updateTimeForgeProfile(payRate) {
      const profiles = (await client.get('/timeforgeprofiles')).data
      const id = profiles[0]?.id
      const response = id == null
        ? await client.post('/timeforgeprofiles', { payRate })
        : await client.put('/timeforgeprofiles/' + encodeURIComponent(id), { payRate })
      return { payRate: response.data.payRate ?? null }
    },
    googleLoginUrl() {
      return GOOGLE_CALLBACK + '?app=timeforge'
    }
  }
}

export function authErrorMessage(error, fallback) {
  const data = error?.response?.data
  const message = data?.error?.message || data?.message?.[0]?.messages?.[0]?.message || data?.message
  return typeof message === 'string' ? message : fallback
}
