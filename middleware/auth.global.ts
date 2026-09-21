import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.replace(/\/+$/, '') || '/'
  if (path === '/auth/google') return
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
  if (store.isLoggedIn && to.query._auth_return) {
    const { _auth_return, ...query } = to.query
    return navigateTo({ path: to.path, query, hash: to.hash }, { replace: true })
  }
  if (store.isLoggedIn && path === '/login') return navigateTo('/', { replace: true })
  if (store.isLoggedIn && !store.timeforgeProfile && path !== '/login') {
    try {
      store.setTimeForgeProfile(await useNuxtApp().$strapi.getTimeForgeProfile())
    } catch (error: any) {
      if (error.response?.status === 401) {
        store.setUser(null)
        return navigateTo('/login')
      }
      throw createError({ statusCode: 503, statusMessage: 'Unable to load your TimeForge profile. Please retry.' })
    }
  }
  if (!store.isLoggedIn && to.query.auth === 'error' && path !== '/login') {
    return navigateTo('/login?auth=error')
  }
  if (!store.isLoggedIn && path !== '/login') return navigateTo('/login')
})
