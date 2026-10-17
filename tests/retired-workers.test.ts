import { describe, expect, test } from 'vitest'
import { retireTimeForgeWorkers, type WorkerRegistration } from '../utils/retired-workers'

describe('retired service workers', () => {
  test('removes only TimeForge workers and leaves unrelated site workers intact', async () => {
    const origin = 'https://jaimegonzalezjr.com'
    const removed: number[] = []
    const fixtures = [
      ['/Projects/TimeForge/', '/Projects/TimeForge/sw.js'],
      ['/', '/sw-custom.js'],
      ['/games/memory/', '/games/memory/sw.js'],
      ['/', '/other-site-worker.js'],
    ]
    const records: WorkerRegistration[] = fixtures.map(([scope, scriptURL], index) => ({
      scope: origin + scope,
      active: { scriptURL: origin + scriptURL },
      async unregister() { removed.push(index) },
    }))

    await retireTimeForgeWorkers(
      { async getRegistrations() { return records } },
      origin,
      '/Projects/TimeForge/'
    )
    expect(removed).toEqual([0, 1])
  })
})
