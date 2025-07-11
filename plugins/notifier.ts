import { defineNuxtPlugin } from 'nuxt/app'
import { useSnackbarStore } from '~/stores/snackbar'

interface NotificationMessage {
  title: string
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  timeout?: number
}

export default defineNuxtPlugin((nuxtApp) => {
  const snackbarStore = useSnackbarStore()

  const notifier = {
    notify(notification: NotificationMessage) {
      const { title, message, type = 'info', timeout = 5000 } = notification

      // Update the snackbar store
      snackbarStore.showMessage({
        content: `${title}: ${message}`,
        color: type,
        timeout
      })

      // Log to console
      console.log(`[${type}] ${title}: ${message}`)

      // Example: Use browser notifications if available
      if (process.client && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/favicon.png'
        })
      }
    }
  }

  return {
    provide: {
      notifier
    }
  }
})
