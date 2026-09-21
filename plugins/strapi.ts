import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'
import { getAccounts } from '~/utils/shared-accounts.js'
import { createAuthClient } from '~/utils/auth-client.js'
export default defineNuxtPlugin(() => {
  const apiBase = useRuntimeConfig().public.apiBaseUrl
  return {provide:{strapi:createAuthClient(apiBase, () => getAccounts(apiBase))}}
})
