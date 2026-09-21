<template>
  <v-container>
    <p>{{ error || 'Completing Google sign-in…' }}</p>
    <NuxtLink v-if="error" to="/login">Return to sign in</NuxtLink>
  </v-container>
</template>

<script setup lang="ts">
import { completeGoogleLogin, startGoogleLogin } from '~/utils/auth-client.js'

const error = ref('')
const client = useNuxtApp().$strapi
// Remove credentials from the visible URL/history before making any API request.
const search = window.location.search
window.history.replaceState(null, '', window.location.pathname)
onMounted(async () => {
  try {
    const query = new URLSearchParams(search)
    const app = query.get('app')
    const isReturn = query.has('access_token') || query.has('state') || query.has('error')
    const destination = app && !isReturn
      ? await startGoogleLogin(app, window.sessionStorage, client)
      : await completeGoogleLogin(search, window.sessionStorage, client)
    window.location.replace(destination)
  } catch {
    error.value = 'Google sign-in could not be completed. Please start sign-in again.'
  }
})
</script>
