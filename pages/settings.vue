<template>
  <v-container>
    <v-dialog v-model="payDialogue">
      <v-form ref="uploadForm" class="pa-4 primary pb-16" @submit.prevent="changeRate">
        <v-text-field
          v-model="newRate"
          type="number"
          min="0"
          step="0.01"
          persistent-placeholder
          prepend-icon="mdi-cash"
          label="Set Pay Rate"
          :placeholder="String(payRate)"
        />
        <v-btn type="submit" class="float-right primary"> Submit </v-btn>
      </v-form>
    </v-dialog>

    <v-list subheader color="primary" rounded>
      <VListSubheader>Settings</VListSubheader>
      <VListItem>
        <template #prepend>
          <VAvatar>
            <VImg :src="userStore.avatarImage" />
          </VAvatar>
        </template>
        <VListItemTitle>Profile Picture</VListItemTitle>
        <VListItemSubtitle>Photo uploads are temporarily unavailable.</VListItemSubtitle>
        <template #append>
          <VIcon>mdi-pencil</VIcon>
        </template>
      </VListItem>
      <VListItem @click="payDialogue = !payDialogue">
        <template #prepend>
          <VAvatar>
            <VIcon x-large color="success">mdi-cash</VIcon>
          </VAvatar>
        </template>
        <VListItemTitle>Change Pay Rate</VListItemTitle>
        <template #append>
          <VIcon>mdi-pencil</VIcon>
        </template>
      </VListItem>
    </v-list>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { authErrorMessage } from '~/utils/auth-client.js'

const nuxtApp = useNuxtApp()
const userStore = useUserStore()
const payDialogue = ref(false)
const payRate = computed(() => userStore.timeforgeProfile?.payRate ?? 0)
const newRate = ref<number | string | null>(null)

const changeRate = async () => {
  const value = newRate.value === null || newRate.value === '' ? null : Number(newRate.value)
  if (value !== null && (!Number.isFinite(value) || value < 0)) {
    nuxtApp.$alerter.showMessage({ content: 'Enter a non-negative pay rate.', value: 'error' })
    return
  }
  try {
    userStore.setTimeForgeProfile(await nuxtApp.$strapi.updateTimeForgeProfile(value))
    payDialogue.value = false
    nuxtApp.$alerter.showMessage({ content: 'Your pay rate was changed', value: 'success' })
  } catch (error) {
    nuxtApp.$alerter.showMessage({
      content: authErrorMessage(error, 'Failed to update pay rate'),
      value: 'error'
    })
  }
}
</script>

<style scoped>
.float-right {
  float: right;
}
</style>
