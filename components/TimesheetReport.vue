<template>
  <div class="report-content">
    <section class="summary-grid" aria-label="Timesheet summary">
      <article><v-icon icon="mdi-clock-outline" /><div><strong>{{ formatDuration(report.summary.totalHours) }}</strong><span>Total hours</span></div></article>
      <article><v-icon icon="mdi-cash-multiple" /><div><strong>${{ report.summary.totalPay.toFixed(2) }}</strong><span>Estimated pay</span></div></article>
      <article><v-icon icon="mdi-map-marker-distance" /><div><strong>{{ report.summary.totalMiles }}</strong><span>Miles · ${{ report.summary.mileageReimbursement.toFixed(2) }} reimb.</span></div></article>
    </section>

    <section class="entries-panel">
      <v-tabs v-model="activeTab" grow color="primary" slider-color="primary">
        <v-tab>Daily</v-tab>
        <v-tab>Weekly</v-tab>
        <v-tab>Monthly</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item
          v-for="tab in tabs"
          :key="tab.kind"
        >
          <div v-if="tab.items.length === 0" class="empty-state">
            <v-icon icon="mdi-calendar-blank-outline" size="40" />
            <strong>No time entries</strong>
            <span>Clock in for a shift or choose a different date range.</span>
          </div>
          <v-data-table
            v-else
            :headers="tab.headers"
            :items="tab.items"
            :items-per-page="7"
            class="timesheet-table desktop-table"
            :sort-by="[{ key: 'sortKey', order: 'desc' }]"
            :items-per-page-options="[7, 10, 25, 50]"
          >
            <template #[`item.hours`]="{ item }">
              {{ formatDuration(item.hours) }}
            </template>
            <template #[`item.pay`]="{ item }">
              <span class="text-success">${{ (item.hours * payRate).toFixed(2) }}</span>
            </template>
            <template #[`item.actions`]="{ item }">
              <v-btn
                icon="mdi-delete"
                size="small"
                color="error"
                variant="text"
                aria-label="Delete entry"
                @click="confirmDelete(item.deleteTarget)"
              />
            </template>
          </v-data-table>
          <div v-if="tab.items.length" class="mobile-entry-list">
            <article v-for="item in tab.items" :key="item.sortKey" class="mobile-entry">
              <div class="mobile-entry__heading">
                <strong>{{ item.period }}</strong>
                <v-btn icon="mdi-delete-outline" size="small" color="error" variant="text" aria-label="Delete entry" @click="confirmDelete(item.deleteTarget)" />
              </div>
              <dl>
                <div><dt>Hours</dt><dd>{{ formatDuration(item.hours) }}</dd></div>
                <div><dt>Miles</dt><dd>{{ item.miles }}</dd></div>
                <div><dt>Pay</dt><dd>${{ (item.hours * payRate).toFixed(2) }}</dd></div>
                <div v-if="item.daysWorked !== undefined"><dt>Days</dt><dd>{{ item.daysWorked }}</dd></div>
              </dl>
            </article>
          </div>
        </v-window-item>
      </v-window>
    </section>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="rounded-lg">
        <v-card-title class="text-h5">Delete Entry</v-card-title>
        <v-card-text>
          Are you sure you want to delete this timesheet entry? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deleteEntry">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  formatDateRange,
  formatDuration,
  generateTimesheetReport,
  type TimesheetEntry,
} from '~/utils/timesheet'

type DeleteTarget =
  | { kind: 'daily'; date: string }
  | { kind: 'weekly'; startDate: string; endDate: string }
  | { kind: 'monthly'; month: string }

interface TableHeader {
  title: string
  key: string
  sortable: boolean
  align?: 'end'
}

interface ReportRow {
  sortKey: string
  period: string
  hours: number
  miles: number
  pay: number
  daysWorked?: number
  deleteTarget: DeleteTarget
}

interface ReportTab {
  kind: DeleteTarget['kind']
  headers: TableHeader[]
  items: ReportRow[]
}

const props = withDefaults(defineProps<{
  entries: TimesheetEntry[]
  payRate?: number
}>(), { payRate: 0 })
const emit = defineEmits<{ 'entries-deleted': [] }>()
const nuxtApp = useNuxtApp()
const activeTab = ref(0)
const deleteDialog = ref(false)
const deleteTarget = ref<DeleteTarget | null>(null)

const report = computed(() => generateTimesheetReport(props.entries, { payRate: props.payRate }))
const commonHeaders: TableHeader[] = [
  { title: 'Hours', key: 'hours', sortable: true },
  { title: 'Miles', key: 'miles', sortable: true },
  { title: 'Pay', key: 'pay', sortable: true },
]
const actionHeader: TableHeader = { title: 'Actions', key: 'actions', sortable: false, align: 'end' }

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatMonth(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long',
  })
}

function weekEnd(startDate: string): string {
  const date = new Date(`${startDate}T00:00:00`)
  date.setDate(date.getDate() + 6)
  return date.toISOString().slice(0, 10)
}

const tabs = computed<ReportTab[]>(() => [
  {
    kind: 'daily',
    headers: [{ title: 'Date', key: 'period', sortable: true }, ...commonHeaders, actionHeader],
    items: Object.entries(report.value.daily).map(([date, data]) => ({
      sortKey: date,
      period: formatDate(date),
      hours: data.totalHours,
      miles: data.totalMiles,
      pay: data.totalHours * props.payRate,
      deleteTarget: { kind: 'daily', date },
    })),
  },
  {
    kind: 'weekly',
    headers: [{ title: 'Week', key: 'period', sortable: true }, ...commonHeaders, { title: 'Days Worked', key: 'daysWorked', sortable: true }, actionHeader],
    items: Object.entries(report.value.weekly).map(([startDate, data]) => {
      const endDate = weekEnd(startDate)
      return {
        sortKey: startDate,
        period: formatDateRange(startDate, endDate),
        hours: data.totalHours,
        miles: data.totalMiles,
        pay: data.totalHours * props.payRate,
        daysWorked: data.uniqueDays.length,
        deleteTarget: { kind: 'weekly', startDate, endDate },
      }
    }),
  },
  {
    kind: 'monthly',
    headers: [{ title: 'Month', key: 'period', sortable: true }, ...commonHeaders, { title: 'Days Worked', key: 'daysWorked', sortable: true }, actionHeader],
    items: Object.entries(report.value.monthly).map(([month, data]) => ({
      sortKey: month,
      period: formatMonth(month),
      hours: data.totalHours,
      miles: data.totalMiles,
      pay: data.totalHours * props.payRate,
      daysWorked: data.uniqueDays.length,
      deleteTarget: { kind: 'monthly', month },
    })),
  },
])

function confirmDelete(target: DeleteTarget): void {
  deleteTarget.value = target
  deleteDialog.value = true
}

function matchesTarget(entry: TimesheetEntry, target: DeleteTarget): boolean {
  switch (target.kind) {
    case 'daily': return entry.date === target.date
    case 'weekly': return entry.date >= target.startDate && entry.date <= target.endDate
    case 'monthly': return entry.date.startsWith(target.month)
    default: {
      const exhaustive: never = target
      return exhaustive
    }
  }
}

async function deleteEntry(): Promise<void> {
  const target = deleteTarget.value
  if (!target) return

  try {
    for (const entry of props.entries.filter((item) => matchesTarget(item, target))) {
      await nuxtApp.$axios.delete(`/timesheets/${entry.id}`)
    }
    nuxtApp.$alerter.showMessage({ content: 'Timesheet entries deleted successfully', value: 'success' })
    emit('entries-deleted')
  } catch {
    nuxtApp.$alerter.showMessage({ content: 'Failed to delete entries', value: 'error' })
  } finally {
    deleteDialog.value = false
    deleteTarget.value = null
  }
}
</script>

<style scoped>
.report-content { padding: clamp(1rem, 3vw, 2rem); }
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.summary-grid article { min-width: 0; display: flex; align-items: center; gap: .9rem; padding: 1.1rem; border: 1px solid var(--tf-border); border-radius: 1rem; background: var(--tf-surface-raised); }
.summary-grid .v-icon { flex: 0 0 auto; color: var(--tf-primary); }
.summary-grid article div { min-width: 0; display: grid; gap: .15rem; }
.summary-grid strong { overflow: hidden; font-size: clamp(1.25rem, 3vw, 1.75rem); font-weight: 400; text-overflow: ellipsis; }
.summary-grid span { overflow: hidden; color: var(--tf-muted); font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
.entries-panel { overflow: hidden; border: 1px solid var(--tf-border); border-radius: 1rem; background: var(--tf-surface-raised); }
.timesheet-table { background: transparent !important; }
.timesheet-table :deep(th) { color: var(--tf-muted) !important; font-size: .78rem; font-weight: 500 !important; text-transform: uppercase; letter-spacing: .06em; }
.timesheet-table :deep(tbody tr:hover) { background: rgba(117, 103, 255, .07) !important; }
.empty-state { min-height: 320px; display: grid; place-items: center; align-content: center; gap: .7rem; padding: 2rem; color: var(--tf-muted); text-align: center; }
.empty-state strong { color: var(--tf-text); }
.mobile-entry-list { display: none; }
@media (max-width: 780px) {
  .summary-grid { grid-template-columns: 1fr; gap: .65rem; }
  .summary-grid article { padding: .85rem 1rem; }
  .desktop-table { display: none; }
  .mobile-entry-list { display: grid; gap: .7rem; padding: .8rem; }
  .mobile-entry { padding: 1rem; border: 1px solid var(--tf-border); border-radius: .8rem; background: rgba(11, 16, 32, .45); }
  .mobile-entry__heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .8rem; }
  .mobile-entry__heading strong { font-size: .9rem; font-weight: 500; }
  .mobile-entry dl { display: grid; grid-template-columns: repeat(2, 1fr); gap: .7rem; margin: 0; }
  .mobile-entry dl div { display: grid; gap: .15rem; }
  .mobile-entry dt { color: var(--tf-muted); font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; }
  .mobile-entry dd { margin: 0; font-size: .95rem; }
}
</style>
