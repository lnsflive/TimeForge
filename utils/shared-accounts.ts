import type {
  AccountFormControls,
  AccountUser,
  SharedAccountsClient,
  SharedAccountsSdk,
} from '~/types/accounts'

const defaultApiBase = 'https://api.jaimegonzalezjr.com'
let clientPromise: Promise<SharedAccountsClient> | undefined

async function loadLibrary(apiBase: string): Promise<SharedAccountsSdk> {
  if (window.SharedAccounts) return window.SharedAccounts

  if (!window.__sharedAccountsScript) {
    window.__sharedAccountsScript = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      const fail = () => {
        clearTimeout(timer)
        script.remove()
        window.__sharedAccountsScript = null
        reject(new Error('Account service unavailable. Please retry.'))
      }
      const timer = window.setTimeout(fail, 15_000)

      script.src = `${apiBase.replace(/\/$/, '')}/auth/client.v1.js`
      script.async = true
      script.onerror = fail
      script.onload = () => {
        const sdk = window.SharedAccounts
        if (!sdk) {
          fail()
          return
        }
        clearTimeout(timer)
        resolve(sdk)
      }
      document.head.appendChild(script)
    })
  }

  return window.__sharedAccountsScript
}

export async function getAccounts(apiBase = defaultApiBase): Promise<SharedAccountsClient> {
  if (!clientPromise) {
    clientPromise = loadLibrary(apiBase)
      .then(async (sdk) => {
        const client = sdk.create({ app: 'timeforge', apiBase, brokerBase: apiBase })
        await client.initialize()
        return client
      })
      .catch((error: unknown) => {
        clientPromise = undefined
        throw error
      })
  }
  return clientPromise
}

export async function startGoogleLogin(): Promise<string> {
  return (await getAccounts()).startGoogle()
}

export async function completeGoogleLogin(search: string): Promise<string> {
  return (await getAccounts()).completeGoogle(search)
}

export async function mountAccountForm(
  element: HTMLElement,
  onSignedIn: (user: AccountUser) => void | Promise<void>
): Promise<AccountFormControls> {
  const client = await getAccounts()
  const sdk = window.SharedAccounts
  if (!sdk) throw new Error('Account service unavailable. Please retry.')
  return sdk.mount(element, { client, onSignedIn })
}
