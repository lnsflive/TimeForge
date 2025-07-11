<template>
  <div class="fill-height d-flex px-4 my-4">
    <v-card width="1200px" max-width="100%" class="mx-auto d-flex flex-column">
      <v-card-title
        class="d-flex justify-space-between align-center px-6 py-4 primary flex-shrink-0"
      >
        <span>Timesheet Report</span>
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
            <v-btn text v-bind="props">
              <v-icon left> mdi-calendar </v-icon>
              {{ dateRangeText }}
            </v-btn>
          </template>
          <v-date-picker v-model="dateRange" range no-title @update:model-value="onDateSelect" />
        </v-menu>
      </v-card-title>

      <v-divider class="flex-shrink-0" />

      <div class="flex-grow-1 overflow-hidden">
        <timesheet-report
          class="h-100"
          :entries="filteredEntries"
          :pay-rate="payRate"
          @entries-deleted="fetchTimesheets"
        />
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useAlertStore } from '~/stores/alert'
import { useNuxtApp } from 'nuxt/app'
import TimesheetReport from '@/components/TimesheetReport.vue'

interface TimesheetEntry {
  id: number
  date: string
  startTime: string
  endTime: string
  startLunch?: string | null
  endLunch?: string | null
  startMiles?: number | null
  endMiles?: number | null
  owner: string
}

interface NuxtApp {
  $axios: {
    get(url: string, config?: any): Promise<{ data: TimesheetEntry[] }>
  }
}

const nuxtApp = useNuxtApp() as unknown as NuxtApp
const userStore = useUserStore()
const alertStore = useAlertStore()

const entries = ref<TimesheetEntry[]>([])
const dateRange = ref<string[]>([])
const menuOpen = ref(false)
const loading = ref(false)
const error = ref('')

const payRate = computed(() => userStore.loggedInUser?.payRate || 0)

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
  } catch (e: any) {
    const errorMessage = e.response?.data?.message || 'Failed to fetch timesheets'
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

<style>
.v-card {
  border-radius: 12px !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.v-card-title {
  color: white !important;
}

/* Reduce table header padding */
:deep(.v-data-table-header th) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}
</style>
