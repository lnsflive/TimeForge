<template>
  <div class="d-flex flex-column">
    <!-- Summary Cards -->
    <v-card class="mb-2 primary rounded-lg">
      <v-card-title class="text-h6 py-2">Summary</v-card-title>
      <v-card-text class="pa-2">
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <v-card height="80" class="rounded-lg" variant="outlined">
              <v-card-text class="d-flex flex-column align-center justify-center fill-height py-2">
                <div class="text-h5">{{ formatDuration(report.summary.totalHours) }}</div>
                <div class="text-subtitle-2 text-medium-emphasis">Total Hours</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-card height="80" class="rounded-lg" variant="outlined">
              <v-card-text class="d-flex flex-column align-center justify-center fill-height py-2">
                <div class="text-h5">${{ report.summary.totalPay.toFixed(2) }}</div>
                <div class="text-subtitle-2 text-medium-emphasis">Total Pay</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-card height="80" class="rounded-lg" variant="outlined">
              <v-card-text class="d-flex flex-column align-center justify-center fill-height py-2">
                <div class="text-h5">{{ report.summary.totalMiles }}</div>
                <div class="text-subtitle-2 text-medium-emphasis">Total Miles</div>
                <div class="text-caption text-medium-emphasis">
                  ${{ report.summary.mileageReimbursement.toFixed(2) }} reimbursement
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabs and Tables -->
    <v-card class="flex-grow-1 d-flex flex-column">
      <v-tabs v-model="activeTab" grow color="primary" slider-color="primary" height="36">
        <v-tab>Daily</v-tab>
        <v-tab>Weekly</v-tab>
        <v-tab>Monthly</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="flex-grow-1">
        <v-window-item
          v-for="(items, index) in [dailyItems, weeklyItems, monthlyItems]"
          :key="index"
          class="h-100"
        >
          <v-data-table
            v-model:page="tablePagination[index].page"
            :headers="[headers, weeklyHeaders, monthlyHeaders][index]"
            :items="items"
            :items-per-page="tablePagination[index].itemsPerPage"
            class="h-100 w-100 timesheet-table"
            :sort-by="[
              { key: index === 0 ? 'date' : index === 1 ? 'startDate' : 'month', order: 'desc' }
            ]"
            :items-per-page-options="[7, 10, 25, 50]"
          >
            <template #[`item.date`]="{ item }">
              {{ formatDate(item.date) }}
            </template>
            <template #[`item.dateRange`]="{ item }">
              {{ formatDateRange(item.startDate, item.endDate) }}
            </template>
            <template #[`item.month`]="{ item }">
              {{ formatMonth(item.month) }}
            </template>
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
                @click="
                  confirmDelete(
                    index === 0 ? item.date : index === 1 ? item.startDate : item.month,
                    index === 1 ? item.endDate : null
                  )
                "
              />
            </template>
          </v-data-table>
        </v-window-item>
      </v-window>
    </v-card>

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

<script>
import { generateTimesheetReport, formatDuration, formatDateRange } from '@/utils/timesheet'

export default {
  props: {
    entries: {
      type: Array,
      required: true,
      default: () => []
    },
    payRate: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      activeTab: 0,
      deleteDialog: false,
      deleteTarget: null,
      deleteType: null,
      tablePagination: [
        { page: 1, itemsPerPage: 7 },
        { page: 1, itemsPerPage: 7 },
        { page: 1, itemsPerPage: 7 }
      ],
      headers: [
        { title: 'Date', key: 'date', sortable: true },
        { title: 'Hours', key: 'hours', sortable: true },
        { title: 'Miles', key: 'miles', sortable: true },
        { title: 'Pay', key: 'pay', sortable: true },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
      ],
      weeklyHeaders: [
        { title: 'Week', key: 'dateRange', sortable: true },
        { title: 'Hours', key: 'hours', sortable: true },
        { title: 'Miles', key: 'miles', sortable: true },
        { title: 'Pay', key: 'pay', sortable: true },
        { title: 'Days Worked', key: 'daysWorked', sortable: true },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
      ],
      monthlyHeaders: [
        { title: 'Month', key: 'month', sortable: true },
        { title: 'Hours', key: 'hours', sortable: true },
        { title: 'Miles', key: 'miles', sortable: true },
        { title: 'Pay', key: 'pay', sortable: true },
        { title: 'Days Worked', key: 'daysWorked', sortable: true },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
      ]
    }
  },
  computed: {
    report() {
      return generateTimesheetReport(this.entries, { payRate: this.payRate })
    },
    dailyItems() {
      if (!this.report?.daily) return []
      return Object.entries(this.report.daily).map(([date, data]) => ({
        date,
        hours: data.totalHours || 0,
        miles: data.totalMiles || 0,
        pay: (data.totalHours || 0) * this.payRate
      }))
    },
    weeklyItems() {
      if (!this.report?.weekly) return []
      return Object.entries(this.report.weekly).map(([startDate, data]) => ({
        startDate,
        endDate: this.getWeekEndDate(startDate),
        dateRange: `${startDate} - ${this.getWeekEndDate(startDate)}`,
        hours: data.totalHours || 0,
        miles: data.totalMiles || 0,
        pay: (data.totalHours || 0) * this.payRate,
        daysWorked: data.uniqueDays?.length || 0
      }))
    },
    monthlyItems() {
      if (!this.report?.monthly) return []
      return Object.entries(this.report.monthly).map(([month, data]) => ({
        month,
        hours: data.totalHours || 0,
        miles: data.totalMiles || 0,
        pay: (data.totalHours || 0) * this.payRate,
        daysWorked: data.uniqueDays?.length || 0
      }))
    }
  },
  methods: {
    formatDuration,
    formatDateRange,
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    formatMonth(monthStr) {
      const [year, month] = monthStr.split('-')
      return new Date(year, month - 1).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    },
    getWeekEndDate(startDate) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + 6)
      return date.toISOString().split('T')[0]
    },
    confirmDelete(target, endDate = null) {
      this.deleteDialog = true
      this.deleteTarget = target
      this.deleteType = this.activeTab === 0 ? 'daily' : this.activeTab === 1 ? 'weekly' : 'monthly'
      if (endDate) {
        this.deleteTarget = { start: target, end: endDate }
      }
    },
    async deleteEntry() {
      try {
        const entriesToDelete = this.entries.filter((entry) => {
          if (this.deleteType === 'daily') {
            return entry.date === this.deleteTarget
          } else if (this.deleteType === 'weekly') {
            const entryDate = new Date(entry.date)
            const startDate = new Date(this.deleteTarget.start)
            const endDate = new Date(this.deleteTarget.end)
            return entryDate >= startDate && entryDate <= endDate
          } else {
            // monthly
            return entry.date.startsWith(this.deleteTarget)
          }
        })

        // Delete each entry
        for (const entry of entriesToDelete) {
          await this.$nuxt.$axios.delete(`/timesheets/${entry.id}`)
        }

        this.$nuxt.$alerter.showMessage({
          content: 'Timesheet entries deleted successfully',
          value: 'success'
        })

        // Emit event to parent to refresh data
        this.$emit('entries-deleted')
      } catch (error) {
        console.error('Error deleting entries:', error)
        this.$nuxt.$alerter.showMessage({
          content: 'Failed to delete entries',
          value: 'error'
        })
      } finally {
        this.deleteDialog = false
        this.deleteTarget = null
      }
    }
  }
}
</script>

<style scoped>
.h-100 {
  height: 100% !important;
}

.w-100 {
  width: 100% !important;
}

.timesheet-table {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.timesheet-table :deep(.v-table) {
  height: 100% !important;
}

.timesheet-table :deep(.v-table__wrapper) {
  height: 100% !important;
  overflow: hidden !important;
}

.timesheet-table :deep(table) {
  height: 100% !important;
  width: 100% !important;
  table-layout: fixed !important;
}

.timesheet-table :deep(thead) {
  position: sticky !important;
  top: 0 !important;
  z-index: 2 !important;
  background: rgb(87, 70, 234) !important;
}

.timesheet-table :deep(tbody) {
  height: 100% !important;
  overflow-y: auto !important;
}

.timesheet-table :deep(th) {
  background: rgb(87, 70, 234) !important;
  color: white !important;
}

.timesheet-table :deep(.v-data-table-header th) {
  padding: 8px !important;
  font-size: 0.875rem !important;
}

.timesheet-table :deep(.v-data-table-footer) {
  background: rgb(87, 70, 234) !important;
  color: white !important;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  padding: 4px 16px;
  min-height: 44px;
}

/* Fix pagination dropdown styling */
.timesheet-table :deep(.v-data-table-footer__select) {
  background-color: rgb(87, 70, 234) !important;
  border-radius: 4px;
  margin: 0 8px;
}

.timesheet-table :deep(.v-data-table-footer__select .v-select__selection),
.timesheet-table :deep(.v-data-table-footer__select .v-field__input) {
  color: white !important;
}

.timesheet-table :deep(.v-data-table-footer__select .v-field) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-radius: 4px;
}

/* Fix dropdown menu styling */
:deep(.v-overlay__content .v-list) {
  background-color: rgb(87, 70, 234) !important;
  color: white !important;
  border-radius: 4px;
  padding: 4px;
}

:deep(.v-overlay__content .v-list-item) {
  color: white !important;
  min-height: 32px !important;
  border-radius: 4px;
}

:deep(.v-overlay__content .v-list-item--active) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

/* Fix pagination buttons */
.timesheet-table :deep(.v-data-table-footer .v-pagination__item) {
  color: white !important;
  background: transparent !important;
}

.timesheet-table :deep(.v-data-table-footer .v-pagination__item--active) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

.timesheet-table :deep(.v-data-table-footer .v-pagination__navigation) {
  background: transparent !important;
}

.timesheet-table :deep(.v-data-table-footer .v-pagination__navigation .v-icon) {
  color: white !important;
}

/* Table row styling */
.timesheet-table :deep(tbody tr) {
  background: transparent !important;
  transition: background-color 0.2s ease;
}

.timesheet-table :deep(tbody tr:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}
</style>
