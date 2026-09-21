import axios from 'axios'
import { defineNuxtPlugin, useRuntimeConfig, navigateTo } from 'nuxt/app'
import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(() => {
  const client = axios.create({
    baseURL: useRuntimeConfig().public.apiBaseUrl as string,
    withCredentials: true,
    headers: { Accept: 'application/json' }
  })
  client.interceptors.response.use(response => response, error => {
    if (error.response?.status === 401) {
      useUserStore().setUser(null)
      navigateTo('/login')
    }
    return Promise.reject(error)
  })
  return { provide: { axios: client } }
})
