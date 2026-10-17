import { describe, expect, test } from 'vitest'
import { createClockStorage } from '../utils/clock-storage'

describe('clock storage', () => {
  test('scopes drafts by account and preserves other apps and users', () => {
    const data = new Map<string, string>([['startTime', 'legacy'], ['other-app', 'retained']])
    const storage = {
      get length() { return data.size },
      key(index: number) { return [...data.keys()][index] ?? null },
      getItem(key: string) { return data.get(key) ?? null },
      setItem(key: string, value: string) { data.set(key, value) },
      removeItem(key: string) { data.delete(key) },
    }
    const first = createClockStorage(storage, 1)
    const second = createClockStorage(storage, 2)

    expect(first.getItem('startTime')).toBeNull()
    first.setItem('startTime', 'first draft')
    second.setItem('startTime', 'second draft')
    first.clear()

    expect(first.getItem('startTime')).toBeNull()
    expect(second.getItem('startTime')).toBe('second draft')
    expect(data.get('other-app')).toBe('retained')
    expect(data.get('startTime')).toBe('legacy')
  })
})
