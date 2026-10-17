import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { describe, expect, test } from 'vitest'
import { createAuthClient, isUnauthorizedError } from '../utils/auth-client'
import type { SharedAccountsClient } from '../types/accounts'

function accountsClient(overrides: Partial<SharedAccountsClient> = {}): SharedAccountsClient {
  return {
    async initialize() {},
    async headers() { return {} },
    async login() { return { id: 7, username: 'test', email: 'test@example.com' } },
    async register() { return { confirmationRequired: true } },
    async restore() { return null },
    async logout() {},
    async updateProfile(data) { return { id: 7, username: 'test', email: 'test@example.com', ...data } },
    async startGoogle() { return 'https://accounts.example/start' },
    async completeGoogle() { return 'https://app.example/' },
    ...overrides,
  }
}

interface ProfileHarness {
  client: ReturnType<typeof createAuthClient>
  calls: InternalAxiosRequestConfig[]
}

function profileClient(responses: unknown[]): ProfileHarness {
  const calls: InternalAxiosRequestConfig[] = []
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config)
    const data = responses.shift()
    if (data instanceof Error) throw data
    return { data, status: 200, statusText: 'OK', headers: {}, config }
  }
  const client = createAuthClient(
    'https://api.example',
    async () => accountsClient({ async headers() { return { Authorization: 'Bearer isolated-session' } } }),
    adapter
  )
  return { client, calls }
}

describe('auth client', () => {
  test('delegates account actions and exposes a typed unauthorized error', async () => {
    const calls: Array<readonly [string, string] | 'logout'> = []
    const accounts = accountsClient({
      async login(identifier, password) {
        calls.push([identifier, password])
        return { id: 7, username: identifier, email: 'test@example.com' }
      },
      async logout() { calls.push('logout') },
    })
    const client = createAuthClient('https://api.example', async () => accounts)

    await expect(client.login({ identifier: 'test', password: 'fixture' })).resolves.toEqual({
      user: { id: 7, username: 'test', email: 'test@example.com' },
    })
    expect(calls[0]).toEqual(['test', 'fixture'])
    await expect(client.register({})).resolves.toEqual({ confirmationRequired: true })
    await expect(client.restoreUser()).rejects.toSatisfy(isUnauthorizedError)
    await client.logout()
    expect(calls[1]).toBe('logout')
  })

  test('provisions a missing profile and saves through its owned ID', async () => {
    const { client, calls } = profileClient([[], { id: 7, payRate: null }, [{ id: 7, payRate: null }], { id: 7, payRate: 19 }])
    await expect(client.getTimeForgeProfile()).resolves.toEqual({ payRate: null })
    expect(calls[1]?.method).toBe('post')
    expect(JSON.parse(String(calls[1]?.data))).toEqual({ payRate: null })
    await expect(client.updateTimeForgeProfile(19)).resolves.toEqual({ payRate: 19 })
    expect(calls[3]?.url).toBe('/timeforgeprofiles/7')
    expect(calls[3]?.headers.Authorization).toBe('Bearer isolated-session')
  })

  test('reuses an existing profile after a simultaneous first-use conflict', async () => {
    const conflict = Object.assign(new Error('exists'), { response: { status: 409 } })
    const { client, calls } = profileClient([[], conflict, [{ id: 9, payRate: null }], { id: 9, payRate: 25 }])
    await expect(client.updateTimeForgeProfile(25)).resolves.toEqual({ payRate: 25 })
    expect(calls[3]?.url).toBe('/timeforgeprofiles/9')
  })

  test('surfaces profile failures and keeps existing profiles', async () => {
    const failure = Object.assign(new Error('database failure'), { response: { status: 500 } })
    await expect(profileClient([[], failure]).client.getTimeForgeProfile()).rejects.toThrow('database failure')
    const existing = profileClient([[{ id: 3, payRate: 55.29 }]])
    await expect(existing.client.getTimeForgeProfile()).resolves.toEqual({ payRate: 55.29 })
    expect(existing.calls).toHaveLength(1)
  })
})
