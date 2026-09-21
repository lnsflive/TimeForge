import axios from 'axios'
import { getAccounts } from '~/utils/shared-accounts.js'
import { defineNuxtPlugin, useRuntimeConfig, navigateTo } from 'nuxt/app'
import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(() => {
  const client = axios.create({
    baseURL: useRuntimeConfig().public.apiBaseUrl as string,
    withCredentials: false,
    headers: { Accept: 'application/json' }
  })
  client.interceptors.request.use(async config => {
    Object.assign(config.headers, await (await getAccounts()).headers())
    return config
  })
  client.interceptors.response.use(response => response, async error => {
    if (error.response?.status === 401) {
      await (await getAccounts()).logout()
      useUserStore().setUser(null)
      navigateTo('/login')
    }
    return Promise.reject(error)
  })
  return { provide: { axios: client } }
})
