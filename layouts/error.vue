<template>
  <v-app dark>
    <h1>{{ title }}</h1>
    <NuxtLink to="/">
      Home page
    </NuxtLink>
  </v-app>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const title = computed(() => props.error.statusCode === 404 ? '404 Not Found' : 'An error occurred')
useHead({ title })
</script>

<style scoped>
h1 {
  font-size: 20px;
}
</style>
