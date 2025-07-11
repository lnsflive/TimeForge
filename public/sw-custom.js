// Custom Service Worker for TimeForge Timer
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'TimeForge notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'explore',
        title: 'Open TimeForge'
      },
      {
        action: 'close',
        title: 'Close notification'
      }
    ]
  }

  event.waitUntil(self.registration.showNotification('TimeForge', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(self.clients.openWindow('/'))
  } else {
    event.waitUntil(self.clients.openWindow('/'))
  }
})

self.addEventListener('message', (event) => {
  const { type, data } = event.data

  switch (type) {
    case 'TIMER_STATE_UPDATE':
      console.log('Timer state updated:', data)
      break
    case 'BREAK_STATE_UPDATE':
      if (data && data.startTime) {
        scheduleBreakNotifications(data)
      }
      break
    case 'SCHEDULE_NOTIFICATION':
      scheduleNotification(data)
      break
  }
})

function scheduleBreakNotifications(breakState) {
  const breakStart = new Date(breakState.startTime)
  const now = new Date()

  // 14-minute warning
  const warningDelay = 14 * 60 * 1000 - (now - breakStart)
  if (warningDelay > 0) {
    setTimeout(() => {
      self.registration.showNotification('Break Almost Over', {
        body: 'Your break ends in 1 minute!',
        icon: '/icon-192x192.png'
      })
    }, warningDelay)
  }

  // 15-minute notification
  const endDelay = 15 * 60 * 1000 - (now - breakStart)
  if (endDelay > 0) {
    setTimeout(() => {
      self.registration.showNotification('Break Time Over', {
        body: 'Your 15-minute break has ended.',
        icon: '/icon-192x192.png'
      })
    }, endDelay)
  }
}

function scheduleNotification(notificationData) {
  const { delay, ...options } = notificationData

  setTimeout(() => {
    self.registration.showNotification(options.title, {
      body: options.body,
      icon: '/icon-192x192.png'
    })
  }, delay)
}
