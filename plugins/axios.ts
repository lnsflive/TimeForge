import axios from 'axios'
import { defineNuxtPlugin, useRuntimeConfig, navigateTo } from 'nuxt/app'
import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(() => {
  const client = axios.create({
    baseURL: useRuntimeConfig().public.apiBaseUrl as string,
    withCredentials: false,
    headers: { Accept: 'application/json' }
  })
  client.interceptors.request.use(config => {
    const token = window.localStorage.getItem('strapi_jwt')
    if (token) config.headers.Authorization = 'Bearer ' + token
    return config
  })
  client.interceptors.response.use(response => response, error => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('strapi_jwt')
      useUserStore().setUser(null)
      navigateTo('/login')
    }
    return Promise.reject(error)
  })
  return { provide: { axios: client } }
})
