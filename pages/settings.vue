<template>
  <v-container>
    <v-dialog v-model="payDialogue">
      <v-form ref="uploadForm" class="pa-4 primary pb-16" @submit.prevent="changeRate">
        <v-text-field
          v-model="newRate"
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
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useNuxtApp } from 'nuxt/app'

interface AlertMessage {
  content: string
  value: string
}

interface StrapiUser {
  id: number
  username: string
  email: string
  payRate?: number
  image?: {
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
}

interface NuxtAppPlugins {
  $strapi: {
    getUser(): Promise<StrapiUser>
  }
  $axios: {
    post(url: string, data: any): Promise<any>
    put(url: string, data: any): Promise<any>
  }
  $alerter: {
    showMessage(message: AlertMessage): void
  }
}

const nuxtApp = useNuxtApp() as unknown as {
  $strapi: NuxtAppPlugins['$strapi']
  $axios: NuxtAppPlugins['$axios']
  $alerter: NuxtAppPlugins['$alerter']
}
const userStore = useUserStore()

const payDialogue = ref(false)
const payRate = ref(0)
const newRate = ref<number | null>(null)
const errors = ref('')

onMounted(async () => {
  try {
    const userData = await nuxtApp.$strapi.getUser()
    userStore.setUser(userData)
    payRate.value = userData.payRate || 0
  } catch (e: any) {
    errors.value = e.response?.data?.message || 'Failed to load user data'
    nuxtApp.$alerter.showMessage({ content: errors.value, value: 'error' })
  }
})

const changeRate = async () => {
  errors.value = ''
  payDialogue.value = false

  try {
    await nuxtApp.$axios.put('/users/' + userStore.loggedInUser?.id, {
      payRate: newRate.value
    })
    location.reload()
    const success = 'Your pay rate was changed'
    nuxtApp.$alerter.showMessage({ content: success, value: 'success' })
  } catch (e: any) {
    errors.value =
      e.response?.data?.message?.[0]?.messages?.[0]?.message || 'Failed to update pay rate'
    nuxtApp.$alerter.showMessage({ content: errors.value, value: 'error' })
  }
}
</script>

<style scoped>
.float-right {
  float: right;
}
</style>
