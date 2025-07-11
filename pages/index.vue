<template>
  <v-container class="d-flex justify-center fill-height pa-0">
    <v-row class="text-center align-center fill-height ma-0">
      <v-col class="d-flex flex-column justify-space-between fill-height py-8">
        <div class="mb-8">
          <div class="text-subtitle-1">
            {{ datestamp }}
          </div>
          <div class="text-h2">
            {{ timestamp }}
          </div>
          <div class="text-body-1">{{ statusMessage }}</div>
        </div>

        <div class="mb-8">
          <v-btn
            v-if="clockedIn"
            fab
            large
            width="188"
            height="188"
            color="error"
            :disabled="!canClockOut"
            rounded="circle"
            @click="clockOut"
          >
            <div class="d-flex flex-column align-center">
              <v-icon size="56" class="mb-4">mdi-alarm</v-icon>
              <span>Clock Out</span>
            </div>
          </v-btn>
          <v-btn
            v-else
            fab
            large
            width="188"
            height="188"
            color="success"
            :disabled="!canClockIn"
            rounded="circle"
            @click="clockIn"
          >
            <div class="d-flex flex-column align-center">
              <v-icon size="56" class="mb-4">mdi-alarm</v-icon>
              <span>Clock In</span>
            </div>
          </v-btn>
        </div>

        <div>
          <v-row>
            <v-col cols="12" class="d-flex justify-center">
              <v-btn
                rounded
                :class="['ma-2', isOnBreak ? 'orange darken-2' : 'orange']"
                :disabled="!clockedIn || isOnLunch"
                height="76"
                min-width="200"
                max-width="424"
                style="width: calc(100% - 16px)"
                @click="toggleBreak"
              >
                <v-icon left size="32">mdi-coffee</v-icon>
                <span class="text-h6">{{ isOnBreak ? 'End Break' : 'Take Break' }}</span>
              </v-btn>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" class="d-flex justify-center">
              <v-btn
                rounded
                :class="['ma-2', isOnLunch ? 'success darken-2' : 'success']"
                :disabled="!clockedIn || isOnBreak"
                height="76"
                min-width="200"
                max-width="424"
                style="width: calc(100% - 16px)"
                @click="toggleLunch"
              >
                <v-icon left size="32">mdi-food</v-icon>
                <span class="text-h6">{{ isOnLunch ? 'End Lunch' : 'Take Lunch' }}</span>
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <div>
          <v-row class="pa-0 ma-0">
            <v-col cols="12" class="d-flex flex-wrap justify-center">
              <v-btn
                v-for="(btn, index) in buttons"
                :key="index"
                min-width="200"
                height="66"
                :class="['ma-2', getButtonActive(btn) ? 'green' : 'white']"
                :disabled="btn.disabled || isOnBreak"
                :to="btn.route || undefined"
                @click="btn.handler ? handleButtonClick(btn) : undefined"
              >
                <div class="d-flex align-center justify-start" style="width: 100%; padding: 0 16px">
                  <v-icon :class="['rounded-lg', btn.iconColor || 'green']" class="pa-2" size="32">
                    {{ btn.icon }}
                  </v-icon>
                  <span class="black--text ml-4 text-body-1">{{ btn.text }}</span>
                </div>
              </v-btn>
            </v-col>
          </v-row>
        </div>
      </v-col>
      <!-- <v-col>
        <v-progress-circular
          rotate="270"
          size="160"
          width="10"
          :value="counter"
          color="teal"
        >
          <h1>{{ hours }} Hrs</h1>
        </v-progress-circular>
      </v-col> -->
    </v-row>
    <v-navigation-drawer
      v-model="milesActive"
      absolute
      bottom
      color="primary"
      class="rounded-t-lg mb-n10 pa-4"
      temporary
    >
      <v-text-field v-model="startMiles" label="Mileage Start" type="text" class="dataInput mt-8" />
      <v-text-field v-model="endMiles" label="Mileage End" type="text" class="dataInput mt-8" />
    </v-navigation-drawer>

    <!-- Break Timer Modal -->
    <v-dialog v-model="isOnBreak" persistent max-width="400px" overlay-opacity="0.9">
      <v-card :class="breakCardColor">
        <v-card-title class="text-center d-block">
          <v-icon size="48" class="mb-2">mdi-coffee</v-icon>
          <div class="text-h4">Break Time</div>
        </v-card-title>

        <v-card-text class="text-center">
          <div class="text-h2 mb-4">{{ breakTimeFormatted }}</div>
          <div class="text-subtitle-1">{{ breakStatus }}</div>

          <v-progress-circular
            :value="breakProgress"
            :color="breakColor"
            size="200"
            width="15"
            class="ma-4"
          >
            <span class="text-h5">{{ Math.round(breakProgress) }}%</span>
          </v-progress-circular>
        </v-card-text>

        <v-card-actions class="justify-center pb-6">
          <v-btn color="error" large @click="toggleBreak"> End Break </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { useNuxtApp, navigateTo } from 'nuxt/app'

interface AlertMessage {
  content: string
  value: 'success' | 'error' | 'info' | 'warning'
}

interface TimerState {
  clockedIn: boolean
  startTime: string | null
  endTime: string | null
  startLunch: string | null
  endLunch: string | null
  isOnBreak: boolean
  isOnLunch: boolean
}

interface BreakState {
  startTime: string | null
}

interface Button {
  text: string
  icon: string
  route?: string
  handler?: string
  iconColor?: string
  activeKey?: string
  disabled: boolean
}

interface NuxtAppPlugins {
  $alerter: {
    showMessage(message: AlertMessage): void
  }
  $timerService: {
    sendTimerState(state: TimerState): void
    sendBreakState(state: BreakState | null): void
    scheduleBreakReminders(startTime: string): void
  }
  $fetch: <T = any>(url: string, options?: any) => Promise<T>
}

const nuxtApp = useNuxtApp() as unknown as NuxtAppPlugins
const userStore = useUserStore()

const lunchActive = ref(false)
const milesActive = ref(false)
const errors = ref<string | null>(null)
const datestamp = ref('')
const timestamp = ref('')
const success = ref<string | null>(null)
const clockedIn = ref(false)
const startTime = ref<string | null>(null)
const endTime = ref<string | null>(null)
const startLunch = ref<string | null>(null)
const endLunch = ref<string | null>(null)
const startMiles = ref<string | null>(null)
const endMiles = ref<string | null>(null)
const breakStartTime = ref<Date | null>(null)
const breakDuration = ref(0)
const breakHistory = ref<any[]>([])
const counter = ref(0)
const hours = ref(0)
const today = ref('')
const isOnBreak = ref(false)
const isOnLunch = ref(false)
const breakElapsed = ref(0)
const breakInterval = ref<ReturnType<typeof setInterval> | null>(null)

const buttons: Button[] = [
  {
    text: 'Timesheet',
    icon: 'mdi-newspaper',
    route: '/dashboard',
    iconColor: 'green',
    disabled: false
  },
  {
    text: 'Mileage',
    icon: 'mdi-car',
    handler: 'toggleMileage',
    iconColor: 'green',
    activeKey: 'milesActive',
    disabled: false
  }
]

// Computed properties
const canTakeLunch = computed(() => clockedIn.value && !endTime.value && !endLunch.value)
const statusMessage = computed(() => {
  if (!clockedIn.value) return 'Not clocked in'
  if (isOnBreak.value) return `On break (${breakTimeFormatted.value})`
  if (isOnLunch.value) return 'On lunch break'
  return 'Clocked in'
})
const canClockIn = computed(() => !clockedIn.value && !startTime.value)
const canClockOut = computed(
  () => clockedIn.value && !endTime.value && !isOnBreak.value && !isOnLunch.value
)
const currentBreakDuration = computed(() => {
  if (!breakStartTime.value) return 0
  const now = new Date().getTime()
  const start = new Date(breakStartTime.value).getTime()
  return Math.round((now - start) / 60000)
})
const breakTimeFormatted = computed(() => {
  const minutes = Math.floor(breakElapsed.value / 60)
  const seconds = breakElapsed.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
const breakProgress = computed(() => Math.min(100, (breakElapsed.value / (15 * 60)) * 100))
const breakColor = computed(() => {
  if (breakElapsed.value >= 15 * 60) return 'error'
  if (breakElapsed.value >= 14 * 60) return 'warning'
  return 'success'
})
const breakStatus = computed(() => {
  if (breakElapsed.value >= 15 * 60) return 'Break time exceeded!'
  if (breakElapsed.value >= 14 * 60) return 'Break ending soon!'
  return 'Enjoy your break'
})
const breakCardColor = computed(() => ({
  'warning-bg': breakElapsed.value >= 14 * 60 && breakElapsed.value < 15 * 60,
  'error-bg': breakElapsed.value >= 15 * 60
}))

// Watch effects
watch(clockedIn, (newValue) => {
  localStorage.clockStatus = JSON.stringify(newValue)
})
watch(startTime, (newTime) => {
  localStorage.startTime = newTime
})
watch(endTime, (newTime) => {
  localStorage.endTime = newTime
})
watch(startLunch, (newTime) => {
  localStorage.startLunch = newTime
})
watch(endLunch, (newTime) => {
  localStorage.endLunch = newTime
})
watch(startMiles, (newTime) => {
  localStorage.startMiles = newTime
})
watch(endMiles, (newTime) => {
  localStorage.endMiles = newTime
})
watch(breakDuration, (newDuration) => {
  localStorage.breakDuration = newDuration
})
watch(breakHistory, (newHistory) => {
  localStorage.breakHistory = JSON.stringify(newHistory)
})
watch(isOnBreak, (newVal) => {
  if (newVal) {
    nuxtApp.$alerter.showMessage({
      content: 'Break started - Take a moment to relax!',
      value: 'info'
    })
  }
})

// Lifecycle hooks
onMounted(() => {
  syncTimerStateWithServiceWorker()
  const tmpDate = new Date()
  getDateTime()
  today.value = tmpDate.toISOString().slice(0, 10)

  if (localStorage.clockStatus) {
    clockedIn.value = JSON.parse(localStorage.clockStatus)
  }
  if (localStorage.startTime) {
    startTime.value = localStorage.startTime
    clockedIn.value = true
  }
  if (localStorage.endTime) {
    endTime.value = localStorage.endTime
    clockedIn.value = false
  }
  if (localStorage.startLunch) {
    startLunch.value = localStorage.startLunch
  }
  if (localStorage.endLunch) {
    endLunch.value = localStorage.endLunch
  }
  if (localStorage.startMiles) {
    startMiles.value = localStorage.startMiles
  }
  if (localStorage.endMiles) {
    endMiles.value = localStorage.endMiles
  }
  if (localStorage.breakDuration) {
    breakDuration.value = Number(localStorage.breakDuration)
  }
  if (localStorage.breakHistory) {
    breakHistory.value = JSON.parse(localStorage.breakHistory)
  }

  // Restore break state
  const savedBreak = localStorage.getItem('breakState')
  if (savedBreak) {
    try {
      const { startTime } = JSON.parse(savedBreak)
      if (startTime) {
        const now = new Date().getTime()
        const start = new Date(startTime).getTime()
        // Calculate elapsed time including time while away
        breakElapsed.value = Math.floor((now - start) / 1000)
        breakStartTime.value = new Date(startTime)
        isOnBreak.value = true
        startBreakTimer()
      }
    } catch (e) {
      localStorage.removeItem('breakState')
    }
  }
})

onBeforeUnmount(() => {
  clearBreakTimer()
})

// Methods
function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
}

function updateBreakDuration() {
  if (breakStartTime.value) {
    counter.value++
  }
}

function toggleBreak(): void {
  if (isOnBreak.value) {
    nuxtApp.$timerService.sendBreakState(null)
    const finalDuration = breakTimeFormatted.value
    isOnBreak.value = false
    clearBreakTimer()
    localStorage.removeItem('breakState')
    nuxtApp.$alerter.showMessage({
      content: `Break ended - Duration: ${finalDuration}`,
      value: 'success'
    })
  } else {
    const now = new Date()
    breakStartTime.value = now
    const breakState = { startTime: now.toISOString() }
    nuxtApp.$timerService.sendBreakState(breakState)
    nuxtApp.$timerService.scheduleBreakReminders(now.toISOString())
    isOnBreak.value = true
    breakElapsed.value = 0
    startBreakTimer()
    localStorage.setItem(
      'breakState',
      JSON.stringify({
        startTime: now.toISOString()
      })
    )
    nuxtApp.$alerter.showMessage({
      content: 'Break started',
      value: 'info'
    })
  }
}

function startBreakTimer(): void {
  if (breakInterval.value) return
  breakInterval.value = setInterval(() => {
    if (!breakStartTime.value) return
    const now = new Date().getTime()
    const start = breakStartTime.value.getTime()
    breakElapsed.value = Math.floor((now - start) / 1000)
    localStorage.setItem(
      'breakState',
      JSON.stringify({
        startTime: breakStartTime.value.toISOString()
      })
    )
  }, 1000)
}

function clearBreakTimer(): void {
  if (breakInterval.value) {
    clearInterval(breakInterval.value)
    breakInterval.value = null
  }
  breakStartTime.value = null
  breakElapsed.value = 0
}

function getDateTime() {
  const today = new Date()
  const month = today.toLocaleString('en-us', { month: 'long' })
  const hour = today.getHours()
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hours = ((hour + 11) % 12) + 1
  let strMonth = '' + today.getMinutes()
  if (strMonth.length === 1) {
    strMonth = '0' + strMonth
  }
  const date = month + ' ' + today.getDate() + ', ' + today.getFullYear()
  const time = hours + ':' + strMonth + suffix
  datestamp.value = date
  timestamp.value = time
}

function getTimeStamp(): string {
  return new Date().toISOString()
}

function lunch() {
  if (!canTakeLunch.value) {
    nuxtApp.$alerter.showMessage({
      content: 'You must be clocked in to take lunch',
      value: 'error'
    })
    return
  }

  if (!startLunch.value) {
    startLunch.value = getTimeStamp()
    nuxtApp.$alerter.showMessage({
      content: 'Lunch break started',
      value: 'success'
    })
  } else if (!endLunch.value) {
    endLunch.value = getTimeStamp()
    nuxtApp.$alerter.showMessage({
      content: 'Lunch break ended',
      value: 'success'
    })
  } else {
    nuxtApp.$alerter.showMessage({
      content: 'You have already taken your lunch break',
      value: 'error'
    })
  }
}

function mileage() {
  if (startMiles.value == null && endMiles.value == null) {
    startMiles.value = prompt('Enter your Start Miles')
    milesActive.value = true
  } else if (endMiles.value == null) {
    endMiles.value = prompt('Enter your End Miles')
  } else {
    nuxtApp.$alerter.showMessage({
      content: 'Already entered mileage',
      value: 'error'
    })
  }
}

function clockIn() {
  if (!canClockIn.value) {
    nuxtApp.$alerter.showMessage({
      content: 'You are already clocked in',
      value: 'error'
    })
    return
  }
  syncTimerStateWithServiceWorker()

  clockedIn.value = true
  startTime.value = getTimeStamp()
  breakDuration.value = 0
  breakHistory.value = []
  nuxtApp.$alerter.showMessage({
    content: 'Successfully clocked in',
    value: 'success'
  })
}

function clockOut() {
  if (isOnBreak.value) {
    nuxtApp.$alerter.showMessage({
      content: 'Please end your break before clocking out',
      value: 'error'
    })
    return
  }
  if (!canClockOut.value) {
    nuxtApp.$alerter.showMessage({
      content: 'Cannot clock out: You are not clocked in',
      value: 'error'
    })
    return
  }

  if (breakStartTime.value) {
    toggleBreak()
  }

  clockedIn.value = false
  endTime.value = getTimeStamp()
  postTime()
}

async function postTime(): Promise<void> {
  errors.value = null
  try {
    const { $fetch } = nuxtApp
    await $fetch('/api/timesheets', {
      method: 'POST',
      body: {
        startTime: startTime.value,
        endTime: endTime.value,
        startLunch: null,
        endLunch: null,
        startMiles: startMiles.value,
        endMiles: endMiles.value,
        date: today.value,
        owner: userStore.username
      }
    })
    success.value = 'Time entry submitted successfully'
    nuxtApp.$alerter.showMessage({ content: success.value, value: 'success' })
    clearLocalStorage()
    navigateTo('/dashboard')
  } catch (e: unknown) {
    const error = e as { response?: { data?: { message?: string[] } } }
    errors.value = error.response?.data?.message?.[0] || 'An error occurred'
    nuxtApp.$alerter.showMessage({ content: errors.value, value: 'error' })
  }
}

function clearLocalStorage() {
  localStorage.clear()
}

function getButtonActive(btn: Button): boolean {
  if (btn.text === 'Break') {
    return !!breakStartTime.value
  }
  return false
}

function handleButtonClick(btn: Button): void {
  if (btn.disabled) {
    nuxtApp.$alerter.showMessage({
      content: 'This action is not available right now',
      value: 'warning'
    })
    return
  }

  if (btn.handler === 'toggleMileage') {
    toggleMileage()
  }
}

function toggleMileage(): void {
  milesActive.value = !milesActive.value
}

function toggleLunch(): void {
  if (!clockedIn.value) {
    nuxtApp.$alerter.showMessage({
      content: 'You must be clocked in to take lunch',
      value: 'error'
    })
    return
  }

  if (!startLunch.value) {
    startLunch.value = getTimeStamp()
    isOnLunch.value = true
    nuxtApp.$alerter.showMessage({
      content: 'Lunch break started',
      value: 'success'
    })
  } else if (!endLunch.value) {
    endLunch.value = getTimeStamp()
    isOnLunch.value = false
    nuxtApp.$alerter.showMessage({
      content: 'Lunch break ended',
      value: 'success'
    })
  } else {
    nuxtApp.$alerter.showMessage({
      content: 'You have already taken your lunch break',
      value: 'error'
    })
  }
}

function syncTimerStateWithServiceWorker() {
  const { $timerService } = nuxtApp
  if ($timerService) {
    const timerState = {
      clockedIn: clockedIn.value,
      startTime: startTime.value,
      endTime: endTime.value,
      startLunch: startLunch.value,
      endLunch: endLunch.value,
      isOnBreak: isOnBreak.value,
      isOnLunch: isOnLunch.value
    }

    $timerService.sendTimerState(timerState)
  }
}
</script>

<style scoped>
.v-btn.orange {
  background-color: #ff9800 !important;
  color: white !important;
}

.v-btn.orange.darken-2 {
  background-color: #f57c00 !important;
}

.v-btn.success {
  background-color: #4caf50 !important;
  color: white !important;
}

.v-btn.success.darken-2 {
  background-color: #388e3c !important;
}

.v-btn.error {
  background-color: #f44336 !important;
  color: white !important;
}

.v-btn.error.darken-2 {
  background-color: #d32f2f !important;
}

.v-btn.white {
  background-color: #ffffff !important;
  color: rgba(0, 0, 0, 0.87) !important;
}

.v-btn.green {
  background-color: #4caf50 !important;
  color: white !important;
}

.warning-bg {
  background-color: #fff3e0 !important;
}

.error-bg {
  background-color: #ffebee !important;
}

.text-h2 {
  font-size: 3.75rem !important;
  font-weight: 300;
  line-height: 3.75rem;
  letter-spacing: -0.0083333333em !important;
}

.text-h4 {
  font-size: 2.125rem !important;
  font-weight: 400;
  line-height: 2.5rem;
  letter-spacing: 0.0073529412em !important;
}

.text-h5 {
  font-size: 1.5rem !important;
  font-weight: 400;
  line-height: 2rem;
  letter-spacing: 0em !important;
}

.text-h6 {
  font-size: 1.25rem !important;
  font-weight: 500;
  line-height: 2rem;
  letter-spacing: 0.0125em !important;
}

.text-subtitle-1 {
  font-size: 1rem !important;
  font-weight: 400;
  line-height: 1.75rem;
  letter-spacing: 0.009375em !important;
}

.text-body-1 {
  font-size: 1rem !important;
  font-weight: 400;
  line-height: 1.5rem;
  letter-spacing: 0.03125em !important;
}

.fill-height {
  height: 100% !important;
}

.d-flex {
  display: flex !important;
}

.flex-column {
  flex-direction: column !important;
}

.flex-wrap {
  flex-wrap: wrap !important;
}

.justify-center {
  justify-content: center !important;
}

.justify-space-between {
  justify-content: space-between !important;
}

.align-center {
  align-items: center !important;
}

.text-center {
  text-align: center !important;
}

.ma-2 {
  margin: 8px !important;
}

.ma-4 {
  margin: 16px !important;
}

.mb-2 {
  margin-bottom: 8px !important;
}

.mb-4 {
  margin-bottom: 16px !important;
}

.ml-4 {
  margin-left: 16px !important;
}

.pa-2 {
  padding: 8px !important;
}

.pa-4 {
  padding: 16px !important;
}

.py-16 {
  padding-top: 64px !important;
  padding-bottom: 64px !important;
}

.rounded-lg {
  border-radius: 4px !important;
}

.mb-n10 {
  margin-bottom: -40px !important;
}

.mt-8 {
  margin-top: 32px !important;
}

.black--text {
  color: rgba(0, 0, 0, 0.87) !important;
}
</style>
