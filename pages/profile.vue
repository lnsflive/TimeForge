<template>
  <v-container class="py-4" style="max-width:1000px">
    <h1 class="text-h5 mb-4">Profile</h1>
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-5" height="100%">
          <h2 class="text-h6 mb-4">Your shared account</h2>
          <v-form @submit.prevent="saveProfile">
            <v-text-field v-model="fullName" label="Display name" autocomplete="name" maxlength="120" variant="outlined" />
            <v-text-field :model-value="userStore.user?.username" label="Username" readonly variant="outlined" />
            <v-text-field :model-value="userStore.user?.email" label="Email" readonly variant="outlined" />
            <p class="text-body-2 mb-4">Your display name is shared across your apps. Username and email identify your account.</p>
            <v-btn type="submit" color="primary" :loading="profileBusy" :disabled="!fullName.trim()">Save profile</v-btn>
            <p v-if="profileMessage" class="mt-3" role="status">{{ profileMessage }}</p>
          </v-form>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-5" height="100%">
          <h2 class="text-h6 mb-4">TimeForge settings</h2>
          <v-form @submit.prevent="saveRate">
            <v-text-field v-model="newRate" type="number" min="0" step="0.01" label="Hourly pay rate" placeholder="Not set" variant="outlined" />
            <p class="text-body-2 mb-4">This rate belongs to your TimeForge profile.</p>
            <v-btn type="submit" color="primary" :loading="rateBusy">Save pay rate</v-btn>
            <p v-if="rateMessage" class="mt-3" role="status">{{ rateMessage }}</p>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { authErrorMessage } from '~/utils/auth-client.js'
const userStore=useUserStore()
const {$strapi}=useNuxtApp()
const fullName=ref(userStore.user?.fullName || userStore.user?.username || '')
const newRate=ref<number|string|null>(userStore.timeforgeProfile?.payRate ?? null)
const profileBusy=ref(false), rateBusy=ref(false)
const profileMessage=ref(''), rateMessage=ref('')
watch(()=>userStore.user, user=>{fullName.value=user?.fullName || user?.username || ''})
watch(()=>userStore.timeforgeProfile, profile=>{newRate.value=profile?.payRate ?? null})
async function saveProfile(){
 if(profileBusy.value)return
 profileBusy.value=true;profileMessage.value=''
 try {userStore.setUser(await $strapi.updateProfile({fullName:fullName.value.trim()}));profileMessage.value='Your profile was saved.'}
 catch(error){profileMessage.value=authErrorMessage(error,'Unable to save your profile. Please retry.')}
 finally{profileBusy.value=false}
}
async function saveRate(){
 if(rateBusy.value)return
 const value=newRate.value===null||newRate.value===''?null:Number(newRate.value)
 if(value!==null&&(!Number.isFinite(value)||value<0)){rateMessage.value='Enter a non-negative pay rate.';return}
 rateBusy.value=true;rateMessage.value=''
 try {userStore.setTimeForgeProfile(await $strapi.updateTimeForgeProfile(value));rateMessage.value='Your pay rate was saved.'}
 catch(error){rateMessage.value=authErrorMessage(error,'Unable to save your pay rate. Please retry.')}
 finally{rateBusy.value=false}
}
</script>
