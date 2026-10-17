import { describe, expect, test } from 'vitest'
import {
  calculateHoursWorked,
  calculateMilesDriven,
  formatDuration,
  generateTimesheetReport,
  type TimesheetEntry,
} from '../../utils/timesheet'

const baseEntry: TimesheetEntry = {
  id: 1,
  date: '2026-10-16',
  startTime: '2026-10-16T08:00:00-05:00',
  endTime: '2026-10-16T17:00:00-05:00',
  owner: 'alex',
}

describe('timesheet calculations', () => {
  test('subtracts lunch from worked hours', () => {
    expect(calculateHoursWorked({
      ...baseEntry,
      startLunch: '2026-10-16T12:00:00-05:00',
      endLunch: '2026-10-16T12:30:00-05:00',
    })).toBe(8.5)
  })

  test('calculates mileage and formats fractional hours', () => {
    expect(calculateMilesDriven({ startMiles: '120', endMiles: '147' })).toBe(27)
    expect(formatDuration(8.5)).toBe('8h 30m')
  })

  test('accepts a zero odometer reading and rejects reversed values', () => {
    expect(calculateMilesDriven({ startMiles: 0, endMiles: 18.5 })).toBe(18.5)
    expect(calculateMilesDriven({ startMiles: 20, endMiles: 10 })).toBe(0)
  })

  test('does not return negative hours for invalid time ranges', () => {
    expect(calculateHoursWorked({
      ...baseEntry,
      startTime: '2026-10-16T17:00:00-05:00',
      endTime: '2026-10-16T08:00:00-05:00',
    })).toBe(0)
  })

  test('returns finite zero values for an empty report', () => {
    expect(generateTimesheetReport([]).summary).toMatchObject({
      totalHours: 0,
      totalMiles: 0,
      totalDays: 0,
      averageHoursPerDay: 0,
      totalPay: 0,
    })
  })
})
