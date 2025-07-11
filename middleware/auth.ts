import { useUserStore } from '~/stores/user'
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const userStore = useUserStore()

  // Skip middleware if going to login page to avoid redirect loop
  if (to.path === '/login') {
    return
  }

  // Check if user is authenticated
  if (!userStore.isLoggedIn) {
    return navigateTo('/login')
  }
})
