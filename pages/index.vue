<template>
  <v-container class="clock-page">
    <section class="clock-workspace" aria-labelledby="clock-heading">
      <div class="clock-card">
        <div class="clock-copy">
          <p class="eyebrow">{{ datestamp }}</p>
          <h1 id="clock-heading">{{ timestamp }}</h1>
          <div class="status-line" :class="{ active: clockedIn }">
            <span class="status-dot" />{{ statusMessage }}
          </div>
        </div>

        <v-btn
          class="clock-button"
          :class="{ 'clock-button--out': clockedIn }"
          :disabled="clockedIn ? !canClockOut : !canClockIn"
          rounded="circle"
          :aria-label="clockedIn ? 'Clock out' : 'Clock in'"
          @click="clockedIn ? clockOut() : clockIn()"
        >
          <v-icon :icon="clockedIn ? 'mdi-stop' : 'mdi-play'" size="36" />
          <strong>{{ clockedIn ? 'Clock out' : 'Clock in' }}</strong>
        </v-btn>

        <p class="clock-hint">
          {{ clockedIn ? 'Finish breaks and lunch before clocking out.' : 'Start your shift when you are ready.' }}
        </p>
      </div>

      <aside class="action-card" aria-label="Shift actions">
        <div>
          <p class="eyebrow">Shift controls</p>
          <h2>What do you need?</h2>
        </div>

        <div class="shift-actions">
          <v-btn
            class="shift-action"
            variant="tonal"
            :disabled="!clockedIn || isOnLunch"
            @click="toggleBreak"
          >
            <v-icon icon="mdi-coffee-outline" />
            <span><strong>{{ isOnBreak ? 'End break' : 'Take a break' }}</strong><small>15 minute timer</small></span>
          </v-btn>
          <v-btn
            class="shift-action"
            variant="tonal"
            :disabled="!clockedIn || isOnBreak"
            @click="toggleLunch"
          >
            <v-icon icon="mdi-food-outline" />
            <span><strong>{{ isOnLunch ? 'End lunch' : 'Take lunch' }}</strong><small>Track lunch time</small></span>
          </v-btn>
        </div>

        <div class="quick-links">
          <v-btn to="/dashboard" variant="outlined" prepend-icon="mdi-chart-box-outline">View reports</v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-car-outline" :disabled="isOnBreak" @click="toggleMileage">Mileage</v-btn>
        </div>
      </aside>
    </section>

    <v-dialog v-model="milesActive" max-width="680px">
      <v-card class="mileage-dialog">
        <div class="mileage-form">
          <div><p class="eyebrow">Optional</p><h2>Trip mileage</h2></div>
          <v-text-field v-model="startMiles" label="Starting odometer" type="number" variant="outlined" />
          <v-text-field v-model="endMiles" label="Ending odometer" type="number" variant="outlined" />
          <v-btn color="primary" @click="milesActive = false">Done</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isOnBreak" persistent max-width="420px" overlay-opacity="0.9">
      <v-card class="break-dialog" :class="breakCardColor">
        <v-card-text>
          <v-icon icon="mdi-coffee-outline" size="42" />
          <p class="eyebrow">Break in progress</p>
          <div class="break-time">{{ breakTimeFormatted }}</div>
          <p>{{ breakStatus }}</p>
          <v-progress-linear :model-value="breakProgress" :color="breakColor" height="8" rounded />
          <v-btn color="error" block size="large" @click="toggleBreak">End break</v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { createClockStorage } from '~/utils/clock-storage'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { useNuxtApp, navigateTo } from 'nuxt/app'

const nuxtApp = useNuxtApp()
const userStore = useUserStore()
const userId = userStore.loggedInUser?.id
if (!userId) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
const clockStorage = createClockStorage(localStorage, userId)

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
const today = ref('')
const isOnBreak = ref(false)
const isOnLunch = ref(false)
const breakElapsed = ref(0)
const breakInterval = ref<ReturnType<typeof setInterval> | null>(null)

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
  clockStorage.setItem('clockStatus', JSON.stringify(newValue))
})
watch(startTime, (newTime) => {
  clockStorage.setItem('startTime', newTime)
})
watch(endTime, (newTime) => {
  clockStorage.setItem('endTime', newTime)
})
watch(startLunch, (newTime) => {
  clockStorage.setItem('startLunch', newTime)
})
watch(endLunch, (newTime) => {
  clockStorage.setItem('endLunch', newTime)
})
watch(startMiles, (newTime) => {
  clockStorage.setItem('startMiles', newTime)
})
watch(endMiles, (newTime) => {
  clockStorage.setItem('endMiles', newTime)
})
onMounted(() => {
  const tmpDate = new Date()
  getDateTime()
  today.value = tmpDate.toISOString().slice(0, 10)

  const storedClockStatus = clockStorage.getItem('clockStatus')
  if (storedClockStatus) {
    clockedIn.value = JSON.parse(storedClockStatus)
  }
  if (clockStorage.getItem('startTime')) {
    startTime.value = clockStorage.getItem('startTime')
    clockedIn.value = true
  }
  if (clockStorage.getItem('endTime')) {
    endTime.value = clockStorage.getItem('endTime')
    clockedIn.value = false
  }
  if (clockStorage.getItem('startLunch')) {
    startLunch.value = clockStorage.getItem('startLunch')
  }
  if (clockStorage.getItem('endLunch')) {
    endLunch.value = clockStorage.getItem('endLunch')
  }
  if (clockStorage.getItem('startMiles')) {
    startMiles.value = clockStorage.getItem('startMiles')
  }
  if (clockStorage.getItem('endMiles')) {
    endMiles.value = clockStorage.getItem('endMiles')
  }
  // Restore break state
  const savedBreak = clockStorage.getItem('breakState')
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
      clockStorage.removeItem('breakState')
    }
  }
  syncTimerState()
})

onBeforeUnmount(() => {
  clearBreakTimer()
})

function toggleBreak(): void {
  if (isOnBreak.value) {
    nuxtApp.$timerService.sendBreakState(null)
    const finalDuration = breakTimeFormatted.value
    isOnBreak.value = false
    clearBreakTimer()
    clockStorage.removeItem('breakState')
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
    clockStorage.setItem(
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
    clockStorage.setItem(
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

function clockIn() {
  if (!canClockIn.value) {
    nuxtApp.$alerter.showMessage({
      content: 'You are already clocked in',
      value: 'error'
    })
    return
  }
  clockedIn.value = true
  startTime.value = getTimeStamp()
  syncTimerState()
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
  syncTimerState()
  postTime()
}

async function postTime(): Promise<void> {
  errors.value = null
  try {
    await nuxtApp.$axios.post('/timesheets', {
      startTime: startTime.value,
      endTime: endTime.value,
      startLunch: startLunch.value,
      endLunch: endLunch.value,
      startMiles: startMiles.value,
      endMiles: endMiles.value,
      date: today.value,
      owner: userStore.username
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
  clockStorage.clear()
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
    syncTimerState()
    nuxtApp.$alerter.showMessage({
      content: 'Lunch break started',
      value: 'success'
    })
  } else if (!endLunch.value) {
    endLunch.value = getTimeStamp()
    isOnLunch.value = false
    syncTimerState()
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

function syncTimerState() {
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
.clock-page { max-width: 1180px; min-height: 100%; padding: clamp(1rem, 4vw, 3rem); }
.clock-workspace { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(19rem, .75fr); gap: clamp(1rem, 3vw, 2rem); }
.clock-card, .action-card { min-width: 0; border: 1px solid var(--tf-border); border-radius: 1.4rem; background: rgba(21, 27, 49, .92); box-shadow: 0 24px 60px rgba(0, 0, 0, .18); }
.clock-card { display: grid; justify-items: center; align-content: center; min-height: min(650px, calc(100dvh - 180px)); padding: clamp(2rem, 6vw, 4.5rem); text-align: center; }
.clock-copy h1 { margin: .25rem 0 .8rem; font-size: clamp(3rem, 8vw, 5.6rem); font-weight: 300; line-height: 1; letter-spacing: -.06em; }
.eyebrow { margin: 0; color: var(--tf-muted); font-size: .72rem; font-weight: 500; letter-spacing: .13em; text-transform: uppercase; }
.status-line { display: inline-flex; align-items: center; gap: .55rem; color: var(--tf-muted); font-size: .92rem; }
.status-dot { width: .55rem; height: .55rem; border-radius: 50%; background: var(--tf-muted); }
.status-line.active { color: var(--tf-success); }
.status-line.active .status-dot { background: var(--tf-success); box-shadow: 0 0 0 .3rem rgba(84, 214, 148, .12); }
.clock-button { width: clamp(10rem, 21vw, 12.5rem) !important; height: clamp(10rem, 21vw, 12.5rem) !important; margin: clamp(2rem, 5vw, 3.5rem) 0 1.5rem; color: #0b1020 !important; background: var(--tf-success) !important; box-shadow: 0 20px 50px rgba(84, 214, 148, .22); }
.clock-button--out { color: #fff !important; background: var(--tf-danger) !important; box-shadow: 0 20px 50px rgba(255, 120, 144, .2); }
.clock-button :deep(.v-btn__content) { display: grid; justify-items: center; gap: .65rem; text-transform: none; }
.clock-button strong { font-size: 1.05rem; }
.clock-hint { max-width: 27rem; margin: 0; color: var(--tf-muted); font-size: .86rem; line-height: 1.6; }
.action-card { align-self: center; display: grid; gap: 1.75rem; padding: clamp(1.4rem, 3vw, 2rem); }
.action-card h2 { margin: .4rem 0 0; font-size: clamp(1.45rem, 3vw, 2rem); font-weight: 400; }
.shift-actions { display: grid; gap: .8rem; }
.shift-action { min-height: 76px !important; justify-content: flex-start; padding: 0 1rem !important; border: 1px solid var(--tf-border); border-radius: .85rem !important; text-transform: none; }
.shift-action :deep(.v-btn__content) { width: 100%; justify-content: flex-start; gap: .8rem; }
.shift-action .v-icon { color: var(--tf-warning); }
.shift-action span { display: grid; gap: .12rem; text-align: left; }
.shift-action small { color: var(--tf-muted); font-weight: 400; }
.quick-links { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }
.quick-links .v-btn { min-width: 0; text-transform: none; }
.mileage-dialog { border: 1px solid var(--tf-border); border-radius: 1.25rem !important; background: var(--tf-surface-raised) !important; }
.mileage-form { width: min(100%, 680px); display: grid; grid-template-columns: 1fr 1fr auto; align-items: end; gap: 1rem; margin: auto; padding: 1.5rem; }
.mileage-form > div:first-child { grid-column: 1 / -1; }
.mileage-form h2 { margin: .35rem 0 0; }
.break-dialog { border: 1px solid var(--tf-border); border-radius: 1.25rem !important; background: var(--tf-surface-raised) !important; text-align: center; }
.break-dialog .v-card-text { display: grid; justify-items: center; gap: 1.25rem; padding: 2rem; }
.break-time { font-size: clamp(3rem, 12vw, 4.5rem); font-weight: 300; letter-spacing: -.05em; }
.break-dialog .v-progress-linear { width: 100%; }
.warning-bg { border-color: var(--tf-warning); }
.error-bg { border-color: var(--tf-danger); }
@media (max-width: 900px) {
  .clock-workspace { grid-template-columns: 1fr; }
  .clock-card { min-height: auto; padding-block: 3rem; }
  .action-card { width: 100%; }
  .shift-actions { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .clock-page { padding: .85rem; }
  .clock-card, .action-card { border-radius: 1rem; }
  .clock-card { padding: 2rem 1.25rem; }
  .clock-copy h1 { font-size: clamp(2.75rem, 16vw, 4rem); }
  .clock-button { width: 9.5rem !important; height: 9.5rem !important; margin-block: 1.75rem 1.15rem; }
  .action-card { gap: 1.25rem; padding: 1.2rem; }
  .shift-actions { grid-template-columns: 1fr; }
  .quick-links { grid-template-columns: 1fr; }
  .mileage-form { grid-template-columns: 1fr; }
  .mileage-form > div:first-child { grid-column: auto; }
}
</style>
