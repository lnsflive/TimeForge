<template>
  <v-app class="d-flex flex-column fill-height overflow-hidden" theme="dark">
    <v-app-bar height="66" color="primary" class="flex-shrink-0">
      <template #prepend>
        <v-app-bar-nav-icon>
          <v-icon x-large @click.stop="drawer = !drawer">mdi-menu</v-icon>
        </v-app-bar-nav-icon>
      </template>

      <v-app-bar-title class="app-title">TimeForge</v-app-bar-title>
      <template #append>
        <v-menu v-if="userStore.isLoggedIn">
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" class="account-toggle" :aria-label="'Account: ' + userStore.displayName">
              <v-icon icon="mdi-account-circle" />
              <span class="account-name">{{ userStore.displayName }}</span>
            </v-btn>
          </template>
          <v-list aria-label="Your account">
            <v-list-item :title="userStore.displayName" :subtitle="userStore.user?.email" />
            <v-list-item title="Profile" prepend-icon="mdi-account-edit" to="/profile" />
            <v-list-item title="Sign out" prepend-icon="mdi-logout" @click="logout" />
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-main class="flex-grow-1">
      <div class="main-content">
        <slot />
      </div>
    </v-main>

    <v-footer color="primary" class="flex-shrink-0" height="44">
      <v-row no-gutters justify="center" align="center">
        <v-col cols="12" class="text-center">
          <span class="text-caption"
            >&copy; {{ new Date().getFullYear() }} TimeForge. All Rights Reserved</span
          >
        </v-col>
      </v-row>
    </v-footer>

    <v-navigation-drawer
      v-model="drawer"
      absolute
      bottom
      color="primary"
      class="rounded-none"
      temporary
    >
      <v-list nav>
        <VListGroup v-model="group" class="text-center" active-class="black--text font-weight-bold">
          <VListItem v-for="(item, i) in items" :key="i" :to="item.to" :value="item">
            <VListItemTitle>{{ item.title }}</VListItemTitle>
          </VListItem>
          <VListItem @click="logout">
            <VListItemTitle>Logout</VListItemTitle>
          </VListItem>
        </VListGroup>
      </v-list>
    </v-navigation-drawer>
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { useRouter } from 'vue-router'
import { useNuxtApp } from 'nuxt/app'

interface NuxtApp {
  $strapi: { logout(): Promise<void> }
  $alerter?: {
    showMessage(message: { content: string; value: string }): void
  }
}

const router = useRouter()
const userStore = useUserStore()
const nuxtApp = useNuxtApp() as unknown as NuxtApp

const drawer = ref(false)
const group = ref(null)

const items = ref([
  {
    title: 'Home',
    to: '/'
  },
  {
    title: 'Dashboard',
    to: '/dashboard'
  },
  {
    title: 'Profile',
    to: '/profile'
  }
])

// Close drawer when group changes
watch(group, () => {
  drawer.value = false
})

const reloadPage = () => {
  window.location.reload()
}

const logout = async () => {
  try {
    await nuxtApp.$strapi.logout()
  } catch {
    nuxtApp.$alerter?.showMessage?.({ content: 'Sign out failed. Please retry.', value: 'error' })
    return
  }
  await userStore.logout()
  router.push('/login')
  nuxtApp.$alerter?.showMessage?.({ content: 'You have been logged out', value: 'success' })
}
</script>

<style>
.app-title { min-width: 0; font-size: clamp(1.1rem, 4vw, 1.5rem); line-height: 1.3; font-weight: 600; }
.account-toggle { flex-shrink: 0; }
.account-name { max-width: 10rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: .4rem; }
@media (max-width: 600px) { .account-name { display: none; } }

.v-application {
  font-family: 'Rubik', sans-serif !important;
  background-color: rgb(13, 19, 35) !important;
}

/* Override Vuetify defaults */
.v-main {
  overflow: hidden !important;
}

.v-main > .v-main__wrap {
  overflow: hidden !important;
}

.v-footer {
  overflow: hidden !important;
}

.main-content {
  background-color: #0d1323;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.h-100 {
  height: 100% !important;
}

.v-navigation-drawer {
  background-color: rgb(87, 70, 234) !important;
}

.v-list {
  background-color: transparent !important;
}

.v-list-item {
  color: white !important;
  margin: 8px;
  border-radius: 8px;
}

.v-list-item--active {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.v-list-item:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.v-btn {
  text-transform: none !important;
  letter-spacing: 0.0892857143em !important;
}

.text-h3 {
  font-size: 1.75rem !important;
  font-weight: 500;
  line-height: 2.25rem;
  letter-spacing: 0.0073529412em !important;
}

.rounded-b-lg {
  border-bottom-left-radius: 8px !important;
  border-bottom-right-radius: 8px !important;
}

.rounded-t-lg {
  border-top-left-radius: 8px !important;
  border-top-right-radius: 8px !important;
}

.rounded-r-lg {
  border-top-right-radius: 8px !important;
  border-bottom-right-radius: 8px !important;
}
</style>
