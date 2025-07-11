import type { VitePWAOptions } from 'vite-plugin-pwa'

export const pwaConfig: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  manifest: {
    name: 'TimeForge - Time Tracking',
    short_name: 'TimeForge',
    description: 'Professional time tracking and timesheet management',
    theme_color: '#5746ea',
    background_color: '#0d1323',
    display: 'standalone',
    start_url: '/',
    lang: 'en',
    categories: ['productivity', 'business'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  },
  strategies: 'injectManifest',
  injectManifest: {
    swSrc: 'static/sw-custom.js',
    swDest: 'sw.js',
    injectionPoint: undefined
  },
  includeAssets: ['favicon.png', 'icon-192x192.png', 'icon-512x512.png'],
  devOptions: {
    enabled: process.env.NODE_ENV === 'development',
    type: 'module'
  }
}
