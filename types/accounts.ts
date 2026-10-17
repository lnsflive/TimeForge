export interface AccountUser {
  id: number
  username: string
  fullName?: string
  email: string
}

export interface AccountFormControls {
  destroy(): void
}

export interface SharedAccountsClient {
  initialize(): Promise<unknown>
  headers(): Promise<Record<string, string>>
  login(identifier: string, password: string): Promise<AccountUser>
  register(data: Record<string, unknown>): Promise<unknown>
  restore(): Promise<AccountUser | null>
  logout(): Promise<void>
  updateProfile(data: { fullName: string }): Promise<AccountUser>
  startGoogle(): Promise<string>
  completeGoogle(search: string): Promise<string>
}

export interface SharedAccountsSdk {
  create(options: {
    app: string
    apiBase: string
    brokerBase: string
  }): SharedAccountsClient
  mount(
    element: HTMLElement,
    options: {
      client: SharedAccountsClient
      onSignedIn(user: AccountUser): void | Promise<void>
    }
  ): Promise<AccountFormControls>
}

declare global {
  interface Window {
    SharedAccounts?: SharedAccountsSdk
    __sharedAccountsScript?: Promise<SharedAccountsSdk> | null
  }
}
