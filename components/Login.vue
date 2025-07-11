<template>
  <v-container style="height: 100%" class="d-flex align-center justify-center">
    <v-card style="background: #1d204b; width: 300px; padding: 20px">
      <v-form ref="form" v-model="valid" @submit.prevent="checkSend">
        <h3 class="text-center text-h3 my-8">TimeForge</h3>
        <v-divider />
        <v-card-text style="font-size: 35px" class="text-center pb-8 accent--text">
          {{ status }}
        </v-card-text>
        <v-text-field
          v-model="username"
          prepend-inner-icon="mdi-account"
          autocomplete="username"
          autofocus
          label="Username"
          type="text"
          name="username"
          placeholder="Enter your username"
          persistent-placeholder
          outlined
          clearable
          rounded
          required
          :rules="[(v) => !!v || 'Username is required']"
          tabindex="1"
        />
        <v-text-field
          v-if="registered"
          v-model="email"
          :rules="emailRules"
          prepend-inner-icon="mdi-email"
          autocomplete="email"
          label="E-mail"
          type="email"
          name="email"
          placeholder="Enter your email"
          persistent-placeholder
          outlined
          clearable
          rounded
          required
          tabindex="2"
        />
        <v-text-field
          v-model="password"
          :rules="passwordRules"
          prepend-inner-icon="mdi-key"
          autocomplete="current-password"
          label="Password"
          name="password"
          placeholder="Enter your password"
          persistent-placeholder
          outlined
          clearable
          rounded
          type="password"
          required
          tabindex="3"
        />
        <v-btn
          block
          :disabled="!valid"
          color="success"
          style="height: 50px; margin-top: 10px"
          type="submit"
          @click="checkSend"
        >
          {{ btnStatus }}
        </v-btn>
        <v-btn
          block
          color="warning"
          style="width: 100%; height: 50px; margin-top: 20px"
          @click="clear"
        >
          reset
        </v-btn>
        <v-btn text plain class="float-right" @click="toggleRegister">
          {{ btnRegister }}
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { navigateTo } from '#app'

interface StrapiAuthResponse {
  user: {
    id: number
    username: string
    email: string
  }
  jwt: string
}

interface StrapiPlugin {
  login(data: { identifier: string; password: string }): Promise<StrapiAuthResponse>
  register(data: { username: string; email: string; password: string }): Promise<StrapiAuthResponse>
}

interface AlertMessage {
  content: string
  value: 'success' | 'error' | 'info' | 'warning'
}

interface AlerterPlugin {
  showMessage(message: AlertMessage): void
}

interface NuxtAppPlugins {
  $strapi: StrapiPlugin
  $alerter: AlerterPlugin
}

const userStore = useUserStore()
const { $strapi, $alerter } = useNuxtApp() as unknown as NuxtAppPlugins

const form = ref<any>(null)
const username = ref('')
const email = ref('')
const password = ref('')
const valid = ref(false)
const registered = ref(false)
const error = ref('')

const status = ref('Login')
const btnStatus = ref('Submit')
const btnRegister = ref('Register')

const emailRules = [
  (v: string) => !!v || 'E-mail is required',
  (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid'
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => (v && v.length >= 6) || 'Password must be at least 6 characters'
]

const clear = () => {
  form.value?.reset()
  username.value = ''
  email.value = ''
  password.value = ''
}

const toggleRegister = () => {
  if (!registered.value) {
    status.value = 'Register'
    btnStatus.value = 'Register'
    btnRegister.value = 'Already a User'
    registered.value = true
  } else {
    status.value = 'Login'
    btnStatus.value = 'Submit'
    btnRegister.value = 'Register'
    registered.value = false
  }
  clear()
}

const login = async () => {
  error.value = ''
  try {
    console.log('Attempting login with:', { identifier: username.value, password: '***' })
    const response = await $strapi.login({
      identifier: username.value,
      password: password.value
    })

    console.log('Login successful:', { userId: response.user.id, username: response.user.username })

    // Update user store with complete user object
    await userStore.setUser(response.user)

    $alerter.showMessage({
      content: 'Welcome ' + response.user.username,
      value: 'success'
    })

    // Navigate to home page
    await navigateTo('/')
  } catch (e: any) {
    console.error('Login error:', e)
    error.value = e.response?.data?.error?.message || e.message || 'Login failed'
    $alerter.showMessage({ content: error.value, value: 'error' })
  }
}

const register = async () => {
  error.value = ''
  try {
    console.log('Attempting registration with:', { username: username.value, email: email.value })
    const response = await $strapi.register({
      username: username.value,
      email: email.value,
      password: password.value
    })

    console.log('Registration successful:', {
      userId: response.user.id,
      username: response.user.username
    })
    $alerter.showMessage({ content: 'Registration successful! Please log in.', value: 'success' })
    clear()
    toggleRegister()
  } catch (e: any) {
    console.error('Registration error:', e)
    error.value = e.response?.data?.error?.message || e.message || 'Registration failed'
    $alerter.showMessage({ content: error.value, value: 'error' })
  }
}

const checkSend = async (event: Event) => {
  event.preventDefault()
  console.log('Form submitted:', { registered: registered.value, username: username.value })

  if (!username.value || !password.value || (registered.value && !email.value)) {
    $alerter.showMessage({ content: 'Please fill in all required fields', value: 'error' })
    return
  }

  if (registered.value) {
    await register()
  } else {
    await login()
  }
}

onMounted(() => {
  // Check if already logged in
  if (userStore.isLoggedIn) {
    navigateTo('/')
  }
})
</script>

<style>
.v-input input:invalid,
input:-webkit-autofill {
  border: none;
  -webkit-text-fill-color: #787dbf;
  box-shadow: 0 0 0px 1000px #1d204b inset;
  -webkit-box-shadow: 0 0 0px 1000px #1d204b inset;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
