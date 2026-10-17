<template>
  <v-app class="timeforge-shell" theme="dark">
    <header class="app-header">
      <NuxtLink class="app-title" to="/" aria-label="TimeForge home">
        <span class="brand-mark" aria-hidden="true"><v-icon icon="mdi-clock-outline" /></span>
        <span>TimeForge</span>
      </NuxtLink>
      <nav v-if="userStore.isLoggedIn" class="desktop-nav" aria-label="Primary navigation">
        <NuxtLink to="/" exact><v-icon icon="mdi-timer-outline" size="19" />Clock</NuxtLink>
        <NuxtLink to="/dashboard"><v-icon icon="mdi-chart-box-outline" size="19" />Reports</NuxtLink>
        <NuxtLink to="/profile"><v-icon icon="mdi-account-outline" size="19" />Profile</NuxtLink>
      </nav>
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
          <v-list-item title="Sign out" prepend-icon="mdi-logout" @click="logout" />
        </v-list>
      </v-menu>
    </header>
    <main class="main-content"><slot /></main>
    <nav v-if="userStore.isLoggedIn" class="mobile-nav" aria-label="Primary navigation">
      <NuxtLink to="/" exact><v-icon icon="mdi-timer-outline" /><span>Clock</span></NuxtLink>
      <NuxtLink to="/dashboard"><v-icon icon="mdi-chart-box-outline" /><span>Reports</span></NuxtLink>
      <NuxtLink to="/profile"><v-icon icon="mdi-account-outline" /><span>Profile</span></NuxtLink>
    </nav>
    <footer class="app-footer">
      <span>&copy; {{ new Date().getFullYear() }} TimeForge</span>
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
.timeforge-shell { background: var(--tf-bg); color: var(--tf-text); font-family: 'Rubik', sans-serif; }
.timeforge-shell :deep(.v-application__wrap) { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }
.app-header { position: sticky; top: 0; z-index: 20; flex: 0 0 72px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1.5rem; padding: 0 clamp(1rem, 4vw, 2.5rem); background: rgba(11, 16, 32, .9); border-bottom: 1px solid var(--tf-border); backdrop-filter: blur(18px); }
.app-title { min-width: 0; display: inline-flex; align-items: center; gap: .7rem; color: inherit; text-decoration: none; font-size: 1.2rem; line-height: 1.3; font-weight: 500; }
.brand-mark { width: 2.25rem; height: 2.25rem; display: grid; place-items: center; border-radius: .7rem; background: var(--tf-primary); box-shadow: 0 8px 24px rgba(117, 103, 255, .28); }
.app-title:focus-visible { outline: 2px solid white; outline-offset: 5px; border-radius: 2px; }
.desktop-nav { display: flex; align-items: center; gap: .3rem; padding: .3rem; border: 1px solid var(--tf-border); border-radius: .8rem; background: rgba(29, 36, 64, .72); }
.desktop-nav a { display: inline-flex; align-items: center; gap: .45rem; padding: .55rem .8rem; border-radius: .55rem; color: var(--tf-muted); text-decoration: none; font-size: .88rem; }
.desktop-nav a:hover, .desktop-nav a.router-link-active { background: var(--tf-primary-soft); color: #fff; }
.account-toggle { justify-self: end; flex-shrink: 0; text-transform: none; }
.account-name { max-width: 10rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0 .4rem; }
.main-content { flex: 1 0 auto; min-width: 0; background: radial-gradient(circle at 50% -10%, rgba(117, 103, 255, .13), transparent 38rem), var(--tf-bg); }
.app-footer { display: flex; align-items: center; justify-content: center; min-height: 52px; padding: 1rem; border-top: 1px solid var(--tf-border); color: var(--tf-muted); font-size: .75rem; }
.account-menu { background: var(--tf-surface-raised) !important; color: #fff; min-width: 240px; max-width: calc(100vw - 24px); border: 1px solid var(--tf-border); border-radius: .75rem !important; }
.account-identity { display: grid; gap: .35rem; padding: .75rem 1rem 1rem; cursor: default; overflow-wrap: anywhere; }
.account-identity strong { font-weight: 500; }
.account-identity span { color: var(--tf-muted); font-size: .85rem; }
.mobile-nav { display: none; }
@media (max-width: 760px) {
  .app-header { min-height: 64px; grid-template-columns: 1fr auto; padding-inline: 1rem; }
  .desktop-nav { display: none; }
  .account-name { display: none; }
  .main-content { padding-bottom: calc(64px + env(safe-area-inset-bottom)); }
  .mobile-nav { position: fixed; right: 0; bottom: 0; left: 0; z-index: 20; display: grid; grid-template-columns: repeat(3, 1fr); padding: .45rem max(.5rem, env(safe-area-inset-left)) max(.45rem, env(safe-area-inset-bottom)); border-top: 1px solid var(--tf-border); background: rgba(11, 16, 32, .94); backdrop-filter: blur(18px); }
  .mobile-nav a { display: grid; place-items: center; gap: .15rem; min-height: 50px; border-radius: .7rem; color: var(--tf-muted); text-decoration: none; font-size: .7rem; }
  .mobile-nav a.router-link-active { background: var(--tf-primary-soft); color: #fff; }
  .app-footer { display: none; }
}
</style>
