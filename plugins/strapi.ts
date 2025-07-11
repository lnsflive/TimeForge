import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'
import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

interface StrapiUser {
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

interface StrapiAuthResponse {
  jwt: string
  user: StrapiUser
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  console.log('Strapi Plugin Initialized with baseURL:', baseURL)

  const strapiAxios = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Add token to requests if it exists
  strapiAxios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('strapi_jwt')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('Making Strapi request to:', baseURL + (config.url || ''))
    return config
  })

  const strapi = {
    async login(data: { identifier: string; password: string }): Promise<StrapiAuthResponse> {
      console.log('Attempting login at:', baseURL + '/auth/local')
      const response = await strapiAxios.post('/auth/local', data)
      if (response.data.jwt) {
        localStorage.setItem('strapi_jwt', response.data.jwt)
      }
      return response.data
    },

    async register(data: {
      username: string
      email: string
      password: string
    }): Promise<StrapiAuthResponse> {
      console.log('Attempting registration at:', baseURL + '/auth/local/register')
      const response = await strapiAxios.post('/auth/local/register', data)
      if (response.data.jwt) {
        localStorage.setItem('strapi_jwt', response.data.jwt)
      }
      return response.data
    },

    async logout() {
      localStorage.removeItem('strapi_jwt')
    },

    async getUser(): Promise<StrapiUser> {
      console.log('Fetching user data from:', baseURL + '/users/me')
      const response = await strapiAxios.get('/users/me')
      return response.data
    }
  }

  return {
    provide: {
      strapi
    }
  }
})
