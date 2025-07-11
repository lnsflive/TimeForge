// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { defineNuxtPlugin } from 'nuxt/app'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'dark',
      themes: {
        dark: {
          colors: {
            primary: '#5746ea',
            accent: '#787dbf',
            secondary: '#0d1323',
            info: '#56c2e6',
            warning: '#f1c75b',
            error: '#ff5e7d',
            success: '#4bcf83'
          }
        }
      }
    }
  })
  app.vueApp.use(vuetify)
})
