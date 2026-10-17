<template>
  <v-container class="profile-page">
    <header class="profile-header">
      <p>Account & preferences</p>
      <h1>Profile settings</h1>
      <span>Manage the details used across TimeForge.</span>
    </header>
    <v-row class="profile-grid">
      <v-col cols="12" md="6">
        <v-card class="profile-card" height="100%">
          <div class="card-heading"><v-icon icon="mdi-account-outline" /><div><h2>Your account</h2><p>Shared across your apps</p></div></div>
          <v-form @submit.prevent="saveProfile">
            <v-text-field v-model="fullName" label="Display name" autocomplete="name" maxlength="120" variant="outlined" />
            <v-text-field :model-value="userStore.user?.username" label="Username" readonly variant="outlined" />
            <v-text-field :model-value="userStore.user?.email" label="Email" readonly variant="outlined" />
            <p class="field-help">Your display name is shared across your apps. Username and email identify your account.</p>
            <v-btn class="save-button" type="submit" color="primary" :loading="profileBusy" :disabled="!fullName.trim()">Save profile</v-btn>
            <p v-if="profileMessage" class="form-message" role="status">{{ profileMessage }}</p>
          </v-form>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="profile-card" height="100%">
          <div class="card-heading"><v-icon icon="mdi-cash-clock" /><div><h2>Pay preferences</h2><p>Used in report estimates</p></div></div>
          <v-form @submit.prevent="saveRate">
            <v-text-field v-model="newRate" type="number" min="0" step="0.01" label="Hourly pay rate" placeholder="Not set" variant="outlined" />
            <p class="field-help">This rate is private to your TimeForge profile and does not change payroll.</p>
            <v-btn class="save-button" type="submit" color="primary" :loading="rateBusy">Save pay rate</v-btn>
            <p v-if="rateMessage" class="form-message" role="status">{{ rateMessage }}</p>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { useUserStore, type TimeForgeProfileState, type User } from '~/stores/user'
import { authErrorMessage } from '~/utils/auth-client'
const userStore = useUserStore()
const { $strapi } = useNuxtApp()
const fullName = ref(userStore.user?.fullName || userStore.user?.username || '')
const newRate = ref<number | string | null>(userStore.timeforgeProfile?.payRate ?? null)
const profileBusy = ref(false)
const rateBusy = ref(false)
const profileMessage = ref('')
const rateMessage = ref('')

watch((): User | null => userStore.user, (user: User | null) => { fullName.value = user?.fullName || user?.username || '' })
watch((): TimeForgeProfileState | null => userStore.timeforgeProfile, (profile: TimeForgeProfileState | null) => { newRate.value = profile?.payRate ?? null })

async function saveProfile() {
  if (profileBusy.value) return
  profileBusy.value = true
  profileMessage.value = ''
  try {
    userStore.setUser(await $strapi.updateProfile({ fullName: fullName.value.trim() }))
    profileMessage.value = 'Your profile was saved.'
  } catch (error: unknown) {
    profileMessage.value = authErrorMessage(error, 'Unable to save your profile. Please retry.')
  } finally {
    profileBusy.value = false
  }
}

async function saveRate() {
  if (rateBusy.value) return
  const value = newRate.value === null || newRate.value === '' ? null : Number(newRate.value)
  if (value !== null && (!Number.isFinite(value) || value < 0)) {
    rateMessage.value = 'Enter a non-negative pay rate.'
    return
  }
  rateBusy.value = true
  rateMessage.value = ''
  try {
    userStore.setTimeForgeProfile(await $strapi.updateTimeForgeProfile(value))
    rateMessage.value = 'Your pay rate was saved.'
  } catch (error: unknown) {
    rateMessage.value = authErrorMessage(error, 'Unable to save your pay rate. Please retry.')
  } finally {
    rateBusy.value = false
  }
}
</script>

<style scoped>
.profile-page { max-width: 1120px; padding: clamp(1rem, 4vw, 3rem); }
.profile-header { margin-bottom: 1.5rem; }
.profile-header > p { margin: 0 0 .45rem; color: var(--tf-primary); font-size: .72rem; font-weight: 500; letter-spacing: .13em; text-transform: uppercase; }
.profile-header h1 { margin: 0; font-size: clamp(1.8rem, 4vw, 2.7rem); font-weight: 400; letter-spacing: -.035em; }
.profile-header span { display: block; margin-top: .55rem; color: var(--tf-muted); }
.profile-grid { margin: -.5rem; }
.profile-grid > .v-col { padding: .5rem; }
.profile-card { padding: clamp(1.25rem, 3vw, 2rem); border: 1px solid var(--tf-border); border-radius: 1.2rem !important; background: rgba(21, 27, 49, .92) !important; }
.card-heading { display: flex; align-items: center; gap: .85rem; margin-bottom: 1.5rem; }
.card-heading > .v-icon { width: 2.6rem; height: 2.6rem; border-radius: .75rem; background: var(--tf-primary-soft); color: var(--tf-primary); }
.card-heading h2, .card-heading p { margin: 0; }
.card-heading h2 { font-size: 1.1rem; font-weight: 500; }
.card-heading p { margin-top: .15rem; color: var(--tf-muted); font-size: .78rem; }
.field-help { margin: -.25rem 0 1.25rem; color: var(--tf-muted); font-size: .8rem; line-height: 1.55; }
.save-button { min-width: 9rem; text-transform: none; }
.form-message { margin: 1rem 0 0; color: var(--tf-success); font-size: .85rem; }
@media (max-width: 600px) {
  .profile-page { padding: 1rem .85rem; }
  .save-button { width: 100%; }
}
</style>
