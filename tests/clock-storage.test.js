import test from 'node:test'
import assert from 'node:assert/strict'
import { createClockStorage } from '../utils/clock-storage.js'

test('clock drafts are per account and clearing them preserves other apps and users', () => {
  const data = new Map([['startTime', 'legacy'], ['other-app', 'retained']])
  const storage = {
    get length() { return data.size },
    key(i) { return [...data.keys()][i] },
    getItem(k) { return data.get(k) ?? null },
    setItem(k, v) { data.set(k, v) },
    removeItem(k) { data.delete(k) }
  }
  const first = createClockStorage(storage, 1)
  const second = createClockStorage(storage, 2)
  assert.equal(first.getItem('startTime'), null)
  first.setItem('startTime', 'first draft')
  second.setItem('startTime', 'second draft')
  first.clear()
  assert.equal(first.getItem('startTime'), null)
  assert.equal(second.getItem('startTime'), 'second draft')
  assert.equal(data.get('other-app'), 'retained')
  assert.equal(data.get('startTime'), 'legacy')
})
