import { defineNuxtConfig } from 'nuxt/config'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,

  plugins: [
    '~/plugins/time-service.ts',
    '~/plugins/alerter.ts',
    '~/plugins/notifier.ts',
    '~/plugins/vuetify.ts',
    '~/plugins/axios.ts',
    '~/plugins/strapi.ts'
  ],

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/Projects/TimeForge/',
    head: {
      titleTemplate: '%s - TimeForge',
      title: 'TimeForge',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.png' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&display=swap'
        }
      ]
    }
  },

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // Initialize plugins array if it doesn't exist
        if (!config.plugins) {
          config.plugins = []
        }
        config.plugins.push(
          vuetify({ autoImport: true, styles: { configFile: 'assets/variables.scss' } })
        )
      })
    },
    '@pinia/nuxt'
  ],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || process.env.API_AUTH_URL || 'https://api.jaimegonzalezjr.com'
    }
  },

  build: {
    transpile: ['vuetify']
  },

  nitro: {
    prerender: { routes: ['/login', '/dashboard', '/settings'] },
    preset: 'node-server',
    compatibilityDate: '2025-07-11'
  },

  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/styles/main.css',
    '~/assets/variables.scss'
  ],

  vite: {
    define: {
      'process.env.DEBUG': false
    },
    vue: {
      template: {
        transformAssetUrls
      }
    }
  },

  experimental: {
    payloadExtraction: false
  }
})
