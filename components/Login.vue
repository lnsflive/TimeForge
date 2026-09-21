<template>
  <section class="login-card" aria-labelledby="login-title">
    <div class="login-brand">
      <svg class="login-clock" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" />
        <path d="M24 12v13l8 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div>
        <h1 id="login-title">TimeForge</h1>
        <p>Sign in to track your time.</p>
      </div>
    </div>
    <div class="login-controls">
      <div ref="accountForm" />
      <p v-if="error" class="login-error" role="alert">{{ error }}</p>
    </div>
  </section>
</template>
<script setup lang="ts">
import { mountAccountForm } from '~/utils/shared-accounts.js'
import { useUserStore } from '~/stores/user'
const accountForm = ref<HTMLElement | null>(null)
const error = ref('')
let controls: any
onMounted(async () => {
  try { controls = await mountAccountForm(accountForm.value, async (user: any) => {useUserStore().setUser(user);await navigateTo('/')}) }
  catch (err: any) {error.value = err.message}
})
onBeforeUnmount(() => controls?.destroy())
</script>

<style scoped>
/* Palette, Rubik weights and overlapping rounded panels follow the supplied
   time-tracking-dashboard-main reference and TimeForge's original navy card. */
.login-card {
  width: 100%;
  max-width: 26rem;
  border-radius: 1rem;
  background: #1c1f4a;
  color: #fff;
  --account-input-background: #1c1f4a;
  --account-input-color: #fff;
  --account-button-background: #1c1f4a;
  --account-button-color: #fff;
}
.login-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.75rem;
  border-radius: 1rem;
  background: #5847eb;
}
.login-clock { width: 3rem; height: 3rem; flex-shrink: 0; }
.login-brand h1 { font-size: clamp(1.75rem, 7vw, 2.25rem); font-weight: 300; line-height: 1.2; }
.login-brand p { margin: .5rem 0 0; color: #e4e1ff; font-size: .9rem; line-height: 1.5; }
.login-controls { padding: 1.75rem; }
.login-controls :deep(.shared-account-form) { max-width: none !important; gap: 1.1rem !important; }
.login-controls :deep(label) { gap: .5rem; color: #bdc1ff; font-size: .9rem; }
.login-controls :deep(input) {
  min-width: 0;
  width: 100%;
  min-height: 3rem;
  padding: .75rem 1rem !important;
  border: 1px solid #777fba !important;
  border-radius: .65rem !important;
  font-size: 1rem !important;
  line-height: 1.5;
}
.login-controls :deep(input:autofill) {
  -webkit-text-fill-color: #fff;
  box-shadow: 0 0 0 1000px #1c1f4a inset;
}
.login-controls :deep(button) {
  min-height: 3rem;
  border-radius: .65rem !important;
  border-color: #777fba !important;
  font-size: 1rem !important;
  line-height: 1.5;
}
.login-controls :deep(button[type="submit"]) { background: #5847eb !important; border-color: #5847eb !important; font-weight: 500; }
.login-controls :deep(button[type="submit"] + button) { border-color: transparent !important; color: #bdc1ff !important; font-size: .9rem !important; }
.login-controls :deep(button:hover:not(:disabled)) { background: #34397b !important; }
.login-controls :deep(button:disabled) { opacity: .6; cursor: wait !important; }
.login-controls :deep(input:focus-visible), .login-controls :deep(button:focus-visible) { outline: 2px solid #bbc0ff; outline-offset: 3px; }
.login-controls :deep([role="status"]:empty) { display: none; }
.login-controls :deep([role="status"]), .login-error { color: #ffbdac; line-height: 1.5; overflow-wrap: anywhere; }
@media (max-width: 360px) { .login-brand, .login-controls { padding: 1.25rem; } }
</style>
