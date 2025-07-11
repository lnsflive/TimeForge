import { defineNuxtPlugin } from 'nuxt/app'
import { useAlertStore } from '~/stores/alert'

interface AlertMessage {
  content: string
  value: 'success' | 'error' | 'info' | 'warning'
}

export default defineNuxtPlugin((nuxtApp) => {
  const alertStore = useAlertStore()

  const alerter = {
    showMessage(message: AlertMessage) {
      // Update the alert store
      alertStore.showMessage(message)

      // Log to console
      const { content, value } = message
      console.log(`[${value}] ${content}`)

      // Example: Use browser notifications if available
      if (process.client && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('TimeForge', {
          body: content,
          icon: '/favicon.png'
        })
      }
    }
  }

  return {
    provide: {
      alerter
    }
  }
})
