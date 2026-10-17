interface WorkerReference {
  scriptURL: string
}

export interface WorkerRegistration {
  scope: string
  active?: WorkerReference | null
  waiting?: WorkerReference | null
  installing?: WorkerReference | null
  unregister(): Promise<boolean | void>
}

export interface ServiceWorkerPort {
  getRegistrations(): Promise<readonly WorkerRegistration[]>
}

export function isTimeForgeWorker(
  registration: WorkerRegistration,
  origin: string,
  basePath: string
): boolean {
  const base = new URL(basePath, origin)
  const scope = new URL(registration.scope)
  if (scope.origin === base.origin && scope.pathname.startsWith(base.pathname)) return true

  const legacy = new URL('/sw-custom.js', origin).href
  return [registration.active, registration.waiting, registration.installing].some(
    (worker) => worker?.scriptURL === legacy
  )
}

export async function retireTimeForgeWorkers(
  serviceWorker: ServiceWorkerPort | undefined,
  origin: string,
  basePath: string
): Promise<void> {
  if (!serviceWorker) return
  for (const registration of await serviceWorker.getRegistrations()) {
    if (isTimeForgeWorker(registration, origin, basePath)) await registration.unregister()
  }
}
