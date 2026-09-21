import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'
import { createAuthClient } from '~/utils/auth-client.js'

export default defineNuxtPlugin(() => ({
  provide: {
    strapi: createAuthClient(useRuntimeConfig().public.apiBaseUrl, window.localStorage)
  }
}))
