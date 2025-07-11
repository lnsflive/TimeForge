// Custom Service Worker for TimeForge Timer
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName)
          })
        )
      })
    ])
  )
})

// Don't handle fetch events - let the browser handle them normally
self.addEventListener('fetch', (event) => {
  // Do nothing - let the browser handle the request
})

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'TimeForge notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
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
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
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
        icon: '/icon-192x192.png',
        tag: 'break-warning'
      })
    }, warningDelay)
  }

  // 15-minute notification
  const endDelay = 15 * 60 * 1000 - (now - breakStart)
  if (endDelay > 0) {
    setTimeout(() => {
      self.registration.showNotification('Break Time Over', {
        body: 'Your 15-minute break has ended.',
        icon: '/icon-192x192.png',
        tag: 'break-ended'
      })
    }, endDelay)
  }
}

function scheduleNotification(notificationData) {
  const { delay, title, body, tag } = notificationData

  setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      tag
    })
  }, delay)
}
