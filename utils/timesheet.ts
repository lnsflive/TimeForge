export interface TimesheetEntry {
  id: number
  date: string
  startTime: string
  endTime: string
  startLunch?: string | null
  endLunch?: string | null
  startMiles?: number | string | null
  endMiles?: number | string | null
  owner: string
}

export type TimesheetGrouping = 'daily' | 'weekly' | 'monthly'

export interface TimesheetGroup {
  entries: TimesheetEntry[]
  totalHours: number
  totalMiles: number
  averageHoursPerDay: number
  uniqueDays: string[]
}

export interface TimesheetReport {
  summary: {
    totalHours: number
    totalMiles: number
    totalDays: number
    averageHoursPerDay: number
    totalPay: number
    mileageReimbursement: number
  }
  daily: Record<string, TimesheetGroup>
  weekly: Record<string, TimesheetGroup>
  monthly: Record<string, TimesheetGroup>
}

interface ReportOptions {
  startDate?: string
  endDate?: string
  payRate?: number
}

export function calculateHoursWorked(entry: Pick<TimesheetEntry, 'startTime' | 'endTime' | 'startLunch' | 'endLunch'>): number {
  if (!entry.startTime || !entry.endTime) return 0

  const totalMinutes = (Date.parse(entry.endTime) - Date.parse(entry.startTime)) / 60_000
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return 0

  if (entry.startLunch && entry.endLunch) {
    const lunchMinutes = (Date.parse(entry.endLunch) - Date.parse(entry.startLunch)) / 60_000
    if (!Number.isFinite(lunchMinutes) || lunchMinutes < 0) return totalMinutes / 60
    return Math.max(0, totalMinutes - lunchMinutes) / 60
  }

  return totalMinutes / 60
}

export function calculateMilesDriven(entry: Pick<TimesheetEntry, 'startMiles' | 'endMiles'>): number {
  if (entry.startMiles == null || entry.endMiles == null) return 0
  const start = Number(entry.startMiles)
  const end = Number(entry.endMiles)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0
  return end - start
}

function groupKey(entry: TimesheetEntry, grouping: TimesheetGrouping): string | undefined {
  const date = new Date(`${entry.date}T00:00:00`)
  if (!Number.isFinite(date.getTime())) return undefined

  if (grouping === 'daily') return entry.date
  if (grouping === 'monthly') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return monday.toISOString().slice(0, 10)
}

export function groupTimesheetEntries(
  entries: TimesheetEntry[],
  grouping: TimesheetGrouping = 'daily'
): Record<string, TimesheetGroup> {
  const groups = new Map<string, Omit<TimesheetGroup, 'uniqueDays'> & { uniqueDays: Set<string> }>()

  for (const entry of entries) {
    const key = groupKey(entry, grouping)
    if (!key) continue
    const group = groups.get(key) ?? {
      entries: [],
      totalHours: 0,
      totalMiles: 0,
      averageHoursPerDay: 0,
      uniqueDays: new Set<string>(),
    }
    group.entries.push(entry)
    group.totalHours += calculateHoursWorked(entry)
    group.totalMiles += calculateMilesDriven(entry)
    group.uniqueDays.add(entry.date)
    groups.set(key, group)
  }

  return Object.fromEntries(
    [...groups].map(([key, group]) => [
      key,
      {
        ...group,
        averageHoursPerDay: group.totalHours / group.uniqueDays.size,
        uniqueDays: [...group.uniqueDays],
      },
    ])
  )
}

export function generateTimesheetReport(
  entries: TimesheetEntry[],
  options: ReportOptions = {}
): TimesheetReport {
  const { startDate, endDate, payRate = 0 } = options
  const filteredEntries = startDate && endDate
    ? entries.filter((entry) => entry.date >= startDate && entry.date <= endDate)
    : entries
  const totalHours = filteredEntries.reduce((sum, entry) => sum + calculateHoursWorked(entry), 0)
  const totalMiles = filteredEntries.reduce((sum, entry) => sum + calculateMilesDriven(entry), 0)
  const uniqueDays = new Set(filteredEntries.map((entry) => entry.date)).size

  return {
    summary: {
      totalHours: Number(totalHours.toFixed(2)),
      totalMiles,
      totalDays: uniqueDays,
      averageHoursPerDay: uniqueDays ? Number((totalHours / uniqueDays).toFixed(2)) : 0,
      totalPay: Number((totalHours * payRate).toFixed(2)),
      mileageReimbursement: Number((totalMiles * 0.655).toFixed(2)),
    },
    daily: groupTimesheetEntries(filteredEntries, 'daily'),
    weekly: groupTimesheetEntries(filteredEntries, 'weekly'),
    monthly: groupTimesheetEntries(filteredEntries, 'monthly'),
  }
}

export function formatDuration(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  if (wholeHours === 0) return `${minutes}m`
  return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`
}

export function formatDateRange(startDate: string, endDate: string): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
}
