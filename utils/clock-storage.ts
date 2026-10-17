export interface ClockStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string | number | boolean | null): void
  removeItem(key: string): void
  clear(): void
}

type StoragePort = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>

export function createClockStorage(storage: StoragePort, userId: number | string): ClockStorage {
  if (!userId) throw new Error('A signed-in account is required for clock state')
  const prefix = `timeforge:${userId}:`

  return {
    getItem(key) {
      return storage.getItem(prefix + key)
    },
    setItem(key, value) {
      storage.setItem(prefix + key, String(value))
    },
    removeItem(key) {
      storage.removeItem(prefix + key)
    },
    clear() {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index)
        if (key?.startsWith(prefix)) storage.removeItem(key)
      }
    },
  }
}
