import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async (to) => {
  const store = useUserStore()
  if (!store.sessionChecked) {
    try {
      store.setUser(await useNuxtApp().$strapi.restoreUser())
    } catch (error: any) {
      if (error.response?.status !== 401) {
        throw createError({ statusCode: 503, statusMessage: 'Unable to check your session. Please retry.' })
      }
      store.setUser(null)
    }
  }
  if (to.query.auth === 'error' && to.path !== '/login') {
    return navigateTo('/login?auth=error')
  }
  if (!store.isLoggedIn && to.path !== '/login') return navigateTo('/login')
})
