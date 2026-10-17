import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'
import { getAccounts } from '~/utils/shared-accounts'
import { createAuthClient } from '~/utils/auth-client'
export default defineNuxtPlugin(() => {
  const apiBase = useRuntimeConfig().public.apiBaseUrl
  return {provide:{strapi:createAuthClient(apiBase, () => getAccounts(apiBase))}}
})
