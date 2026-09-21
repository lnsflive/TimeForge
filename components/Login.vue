<template>
  <v-container class="d-flex align-center justify-center" style="min-height:70vh">
    <v-card class="pa-6" style="width:100%;max-width:420px;background:#1d204b;--account-input-background:#252953;--account-input-color:#fff;--account-button-background:#353b78;--account-button-color:#fff">
      <h1 class="text-h5 mb-6">Sign in</h1>
      <div ref="accountForm" />
      <p v-if="error" role="alert">{{ error }}</p>
    </v-card>
  </v-container>
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
