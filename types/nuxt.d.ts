declare module '#app' {
  import type { NavigateTo } from 'nuxt/app'
  export const defineNuxtRouteMiddleware: any
  export const navigateTo: NavigateTo
  export const useRuntimeConfig: () => {
    public: {
      apiBaseUrl: string
    }
  }
}
