import { describe, expect, test } from 'vitest'
import { calculateHoursWorked, calculateMilesDriven, formatDuration } from '../../utils/timesheet.js'

describe('timesheet calculations', () => {
  test('subtracts lunch from worked hours', () => {
    expect(calculateHoursWorked({
      startTime: '2026-10-16T08:00:00-05:00',
      endTime: '2026-10-16T17:00:00-05:00',
      startLunch: '2026-10-16T12:00:00-05:00',
      endLunch: '2026-10-16T12:30:00-05:00',
    })).toBe(8.5)
  })

  test('calculates mileage and formats fractional hours', () => {
    expect(calculateMilesDriven({ startMiles: '120', endMiles: '147' })).toBe(27)
    expect(formatDuration(8.5)).toBe('8h 30m')
  })
})
