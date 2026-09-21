<template>
  <v-app class="timeforge-shell" theme="dark">
    <header class="app-header">
      <NuxtLink class="app-title" to="/" aria-label="TimeForge home">TimeForge</NuxtLink>
      <v-menu v-if="userStore.isLoggedIn" location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" class="account-toggle" :aria-label="'Account: ' + userStore.displayName">
            <v-icon icon="mdi-account-circle" />
            <span class="account-name">{{ userStore.displayName }}</span>
            <v-icon icon="mdi-chevron-down" size="18" />
          </v-btn>
        </template>
        <v-list class="account-menu" aria-label="Your account">
          <div class="account-identity">
            <strong>{{ userStore.displayName }}</strong>
            <span>{{ userStore.user?.email }}</span>
          </div>
          <v-divider />
          <v-list-item title="Home" prepend-icon="mdi-home" to="/" exact />
          <v-list-item title="Dashboard" prepend-icon="mdi-view-dashboard" to="/dashboard" />
          <v-list-item title="Profile" prepend-icon="mdi-account-edit" to="/profile" />
          <v-list-item title="Sign out" prepend-icon="mdi-logout" @click="logout" />
        </v-list>
      </v-menu>
    </header>
    <main class="main-content"><slot /></main>
    <footer class="app-footer">
      <span>&copy; {{ new Date().getFullYear() }} TimeForge. All Rights Reserved</span>
    </footer>
  </v-app>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
const userStore = useUserStore()
const nuxtApp = useNuxtApp()
const logout = async () => {
  try { await nuxtApp.$strapi.logout() }
  catch {
    nuxtApp.$alerter?.showMessage?.({content:'Sign out failed. Please retry.',value:'error'})
    return
  }
  userStore.setUser(null)
  await navigateTo('/login')
}
</script>

<style scoped>
.timeforge-shell { background: #0f1424; color: #fff; font-family: 'Rubik', sans-serif; }
.timeforge-shell :deep(.v-application__wrap) { height: 100vh; height: 100dvh; min-height: 0; display: flex; flex-direction: column; }
.app-header { flex: 0 0 66px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0 1rem; background: #5847eb; }
.app-title { min-width: 0; color: inherit; text-decoration: none; font-size: clamp(1.1rem, 4vw, 1.5rem); line-height: 1.3; font-weight: 500; }
.app-title:focus-visible { outline: 2px solid white; outline-offset: 5px; border-radius: 2px; }
.account-toggle { flex-shrink: 0; text-transform: none; }
.account-name { max-width: 10rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0 .4rem; }
.main-content { flex: 1 1 0; min-height: 0; overflow: auto; background: #0f1424; }
.app-footer { flex: 0 0 44px; height: 44px; min-height: 44px; max-height: 44px; display: flex; align-items: center; justify-content: center; padding: 0 .5rem; background: #5847eb; font-size: .75rem; }
.account-menu { background: #1c1f4a !important; color: #fff; min-width: 240px; max-width: calc(100vw - 24px); border: 1px solid #404679; border-radius: .75rem !important; }
.account-identity { display: grid; gap: .35rem; padding: .75rem 1rem 1rem; cursor: default; overflow-wrap: anywhere; }
.account-identity strong { font-weight: 500; }
.account-identity span { color: #bdc1ff; font-size: .85rem; }
@media (max-width: 600px) { .account-name { display: none; } }
</style>
