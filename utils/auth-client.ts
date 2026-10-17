import axios, { type AxiosAdapter, type AxiosError } from 'axios'
import type { AccountUser, SharedAccountsClient } from '~/types/accounts'

interface Credentials {
  identifier: string
  password: string
}

interface TimeForgeProfileRecord {
  id: number
  payRate: number | null
}

export interface TimeForgeProfile {
  payRate: number | null
}

class AuthRequiredError extends Error {
  readonly response = { status: 401 }
}

export function createAuthClient(
  baseURL: string,
  accounts: () => Promise<SharedAccountsClient>,
  adapter?: AxiosAdapter
) {
  const client = axios.create({ baseURL, withCredentials: false, adapter })
  client.interceptors.request.use(async (config) => {
    Object.assign(config.headers, await (await accounts()).headers())
    return config
  })

  async function ensureProfile(): Promise<TimeForgeProfileRecord> {
    let rows = (await client.get<TimeForgeProfileRecord[]>('/timeforgeprofiles')).data
    if (rows[0]) return rows[0]

    try {
      return (await client.post<TimeForgeProfileRecord>('/timeforgeprofiles', { payRate: null })).data
    } catch (error: unknown) {
      if (!hasResponseStatus(error, 409)) throw error
      rows = (await client.get<TimeForgeProfileRecord[]>('/timeforgeprofiles')).data
      if (!rows[0]) throw error
      return rows[0]
    }
  }

  return {
    async login(data: Credentials): Promise<{ user: AccountUser }> {
      return { user: await (await accounts()).login(data.identifier, data.password) }
    },
    async updateProfile(data: { fullName: string }): Promise<AccountUser> {
      return (await accounts()).updateProfile(data)
    },
    async register(data: Record<string, unknown>): Promise<unknown> {
      return (await accounts()).register(data)
    },
    async logout(): Promise<void> {
      return (await accounts()).logout()
    },
    async restoreUser(): Promise<AccountUser> {
      const user = await (await accounts()).restore()
      if (!user) throw new AuthRequiredError('Sign in required')
      return user
    },
    async getUser(): Promise<AccountUser> {
      return this.restoreUser()
    },
    async getTimeForgeProfile(): Promise<TimeForgeProfile> {
      const profile = await ensureProfile()
      return { payRate: profile.payRate ?? null }
    },
    async updateTimeForgeProfile(payRate: number | null): Promise<TimeForgeProfile> {
      const profile = await ensureProfile()
      const response = await client.put<TimeForgeProfileRecord>(
        `/timeforgeprofiles/${encodeURIComponent(profile.id)}`,
        { payRate }
      )
      return { payRate: response.data.payRate ?? null }
    },
  }
}

interface ErrorPayload {
  error?: { message?: unknown }
  message?: unknown
}

function messageFromPayload(payload: ErrorPayload): string | undefined {
  if (typeof payload.error?.message === 'string') return payload.error.message
  if (typeof payload.message === 'string') return payload.message
  if (!Array.isArray(payload.message)) return undefined

  const first = payload.message[0]
  if (typeof first !== 'object' || first === null || !('messages' in first)) return undefined
  const messages = first.messages
  if (!Array.isArray(messages)) return undefined
  const nested = messages[0]
  if (typeof nested !== 'object' || nested === null || !('message' in nested)) return undefined
  return typeof nested.message === 'string' ? nested.message : undefined
}

export function authErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ErrorPayload>(error)) {
    return error instanceof Error && error.message ? error.message : fallback
  }
  return error.response?.data ? messageFromPayload(error.response.data) ?? fallback : fallback
}

export function isAxiosErrorWithStatus(
  error: unknown,
  status: number
): error is AxiosError<unknown> {
  return axios.isAxiosError(error) && error.response?.status === status
}

function hasResponseStatus(error: unknown, status: number): boolean {
  if (!(error instanceof Error) || !('response' in error)) return false
  const response = error.response
  return typeof response === 'object' && response !== null && 'status' in response && response.status === status
}

export function isUnauthorizedError(error: unknown): boolean {
  return isAxiosErrorWithStatus(error, 401) || hasResponseStatus(error, 401)
}
