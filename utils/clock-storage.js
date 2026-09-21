export function createClockStorage(storage, userId) {
  if (!userId) throw new Error('A signed-in account is required for clock state')
  const prefix = `timeforge:${userId}:`
  return {
    getItem(key) { return storage.getItem(prefix + key) },
    setItem(key, value) { storage.setItem(prefix + key, String(value)) },
    removeItem(key) { storage.removeItem(prefix + key) },
    clear() {
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i)
        if (key?.startsWith(prefix)) storage.removeItem(key)
      }
    }
  }
}
