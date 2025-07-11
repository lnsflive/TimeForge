import { defineNuxtPlugin } from 'nuxt/app'

interface TimerState {
  clockedIn: boolean
  startTime: string | null
  endTime: string | null
  startLunch: string | null
  endLunch: string | null
  isOnBreak: boolean
  isOnLunch: boolean
}

interface NotificationData {
  title: string
  body: string
  delay: number
  tag: string
}

interface BreakState {
  startTime: string | null
}

export default defineNuxtPlugin((nuxtApp) => {
  const timerService = {
    serviceWorker: null as ServiceWorkerRegistration | null,
    notificationPermission: 'default' as NotificationPermission,

    async init() {
      // Skip service worker registration in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Skipping service worker registration in development mode')
        return
      }

      if (process.client && 'serviceWorker' in navigator) {
        try {
          // Unregister any existing service workers first
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            await registration.unregister()
          }

          // Register the new service worker
          const registration = await navigator.serviceWorker.register('/sw-custom.js', {
            scope: '/',
            type: 'module'
          })
          console.log('Custom Service Worker registered:', registration)

          this.serviceWorker = registration
          await this.requestNotificationPermission()
          navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage)

          return registration
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }
    },

    async requestNotificationPermission() {
      if (process.client && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        this.notificationPermission = permission
        console.log('Notification permission:', permission)
        return permission
      }
      return 'denied' as NotificationPermission
    },

    sendTimerState(timerState: TimerState) {
      if (this.serviceWorker && this.serviceWorker.active) {
        this.serviceWorker.active.postMessage({
          type: 'TIMER_STATE_UPDATE',
          data: timerState
        })
      }
    },

    sendBreakState(breakState: BreakState | null) {
      if (this.serviceWorker && this.serviceWorker.active) {
        this.serviceWorker.active.postMessage({
          type: 'BREAK_STATE_UPDATE',
          data: breakState
        })
      }
    },

    scheduleNotification(notificationData: NotificationData) {
      if (this.serviceWorker && this.serviceWorker.active) {
        this.serviceWorker.active.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          data: notificationData
        })
      }
    },

    scheduleBreakReminders(breakStartTime: string) {
      const now = new Date().getTime()
      const breakStart = new Date(breakStartTime).getTime()

      // 14-minute warning
      const warningDelay = 14 * 60 * 1000 - (now - breakStart)
      if (warningDelay > 0) {
        this.scheduleNotification({
          title: 'Break Almost Over',
          body: 'Your break ends in 1 minute!',
          delay: warningDelay,
          tag: 'break-warning'
        })
      }

      // 15-minute notification
      const endDelay = 15 * 60 * 1000 - (now - breakStart)
      if (endDelay > 0) {
        this.scheduleNotification({
          title: 'Break Time Over',
          body: 'Your 15-minute break has ended.',
          delay: endDelay,
          tag: 'break-ended'
        })
      }
    },

    handleServiceWorkerMessage(event: MessageEvent) {
      console.log('Message from Service Worker:', event.data)
    }
  }

  if (process.client) {
    timerService.init()
  }

  return {
    provide: {
      timerService
    }
  }
})
