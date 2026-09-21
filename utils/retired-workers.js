export function isTimeForgeWorker(registration, origin, basePath) {
  const base = new URL(basePath, origin)
  const scope = new URL(registration.scope)
  if (scope.origin === base.origin && scope.pathname.startsWith(base.pathname)) return true
  // The old TimeForge plugin explicitly attempted this root-level script.
  const legacy = new URL('/sw-custom.js', origin).href
  return [registration.active,registration.waiting,registration.installing].some(worker => worker?.scriptURL === legacy)
}
export async function retireTimeForgeWorkers(serviceWorker, origin, basePath) {
  if (!serviceWorker) return
  for (const registration of await serviceWorker.getRegistrations()) {
    if (isTimeForgeWorker(registration, origin, basePath)) await registration.unregister()
  }
}
