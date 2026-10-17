<template>
  <v-container class="reports-page">
    <section class="reports-shell" aria-labelledby="reports-heading">
      <header class="reports-header">
        <div>
          <p class="eyebrow">Work history</p>
          <h1 id="reports-heading">Timesheet reports</h1>
          <p>Review your hours, mileage, and estimated earnings.</p>
        </div>
        <v-menu
          ref="menu"
          v-model="menuOpen"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          max-width="290px"
          min-width="290px"
        >
          <template #activator="{ props }">
            <v-btn class="date-filter" variant="outlined" v-bind="props">
              <v-icon start>mdi-calendar-outline</v-icon>
              {{ dateRangeText }}
            </v-btn>
          </template>
          <v-date-picker v-model="dateRange" range no-title @update:model-value="onDateSelect" />
        </v-menu>
      </header>
      <div v-if="loading" class="report-state" role="status">
        <v-progress-circular indeterminate color="primary" />
        <span>Loading your timesheets…</span>
      </div>
      <div v-else-if="error" class="report-state report-state--error" role="alert">
        <v-icon icon="mdi-alert-circle-outline" size="32" />
        <span>{{ error }}</span>
        <v-btn variant="outlined" @click="fetchTimesheets">Try again</v-btn>
      </div>
      <div v-else>
        <timesheet-report
          :entries="filteredEntries"
          :pay-rate="payRate"
          @entries-deleted="fetchTimesheets"
        />
      </div>
    </section>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useAlertStore } from '~/stores/alert'
import { useNuxtApp } from 'nuxt/app'
import TimesheetReport from '@/components/TimesheetReport.vue'
import type { TimesheetEntry } from '~/utils/timesheet'

const nuxtApp = useNuxtApp()
const userStore = useUserStore()
const alertStore = useAlertStore()

const entries = ref<TimesheetEntry[]>([])
const dateRange = ref<string[]>([])
const menuOpen = ref(false)
const loading = ref(false)
const error = ref('')

const payRate = computed(() => userStore.timeforgeProfile?.payRate ?? 0)

const dateRangeText = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    return 'All Time'
  }
  return `${dateRange.value[0]} to ${dateRange.value[1]}`
})

const filteredEntries = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    return entries.value
  }
  return entries.value.filter((entry) => {
    return entry.date >= dateRange.value[0] && entry.date <= dateRange.value[1]
  })
})

const onDateSelect = () => {
  if (dateRange.value?.length === 2) {
    menuOpen.value = false
  }
}

const fetchTimesheets = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await nuxtApp.$axios.get('/timesheets', {
      params: {
        owner: userStore.username
      }
    })
    entries.value = response.data
  } catch (e: unknown) {
    const requestError = e as { response?: { data?: { message?: string } } }
    const errorMessage = requestError.response?.data?.message || 'Failed to fetch timesheets'
    error.value = errorMessage
    alertStore.showMessage({ content: errorMessage, value: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchTimesheets()
})
</script>

<style scoped>
.reports-page { max-width: 1240px; padding: clamp(1rem, 4vw, 3rem); }
.reports-shell { overflow: hidden; border: 1px solid var(--tf-border); border-radius: 1.4rem; background: rgba(21, 27, 49, .92); box-shadow: 0 24px 60px rgba(0, 0, 0, .18); }
.reports-header { display: flex; align-items: center; justify-content: space-between; gap: 2rem; padding: clamp(1.25rem, 3vw, 2rem); border-bottom: 1px solid var(--tf-border); }
.eyebrow { margin: 0 0 .45rem; color: var(--tf-primary); font-size: .72rem; font-weight: 500; letter-spacing: .13em; text-transform: uppercase; }
.reports-header h1 { margin: 0; font-size: clamp(1.75rem, 4vw, 2.6rem); font-weight: 400; letter-spacing: -.035em; }
.reports-header p:last-child { margin: .55rem 0 0; color: var(--tf-muted); }
.date-filter { min-width: 11rem; text-transform: none; }
.report-state { min-height: 420px; display: grid; place-items: center; align-content: center; gap: 1rem; color: var(--tf-muted); }
.report-state--error { color: var(--tf-danger); }
@media (max-width: 700px) {
  .reports-page { padding: .85rem; }
  .reports-shell { border-radius: 1rem; }
  .reports-header { align-items: stretch; flex-direction: column; gap: 1.2rem; }
  .date-filter { width: 100%; }
}
</style>
