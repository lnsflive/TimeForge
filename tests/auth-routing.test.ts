import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { describe, expect, test } from 'vitest'

interface RouteInput {
  path: string
  query: Record<string, string>
}

type Middleware = (route: RouteInput) => Promise<unknown>

function compileMiddleware(context: vm.Context): Middleware {
  const source = readFileSync(new URL('../middleware/auth.global.ts', import.meta.url), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  vm.runInNewContext(output, context)
  const exported = context.exports
  if (typeof exported !== 'object' || exported === null || !('default' in exported)) {
    throw new Error('Middleware default export was not compiled')
  }
  const middleware = exported.default
  if (typeof middleware !== 'function') throw new Error('Middleware default export is not callable')
  return middleware
}

describe('authentication routing', () => {
  test('uses the canonical API host for the OAuth broker', () => {
    const source = readFileSync(new URL('../utils/shared-accounts.ts', import.meta.url), 'utf8')
    expect(source).toMatch(/sdk\.create\(\{ app: 'timeforge', apiBase, brokerBase: apiBase \}\)/)
    expect(source).not.toContain('strapi.jaimegonzalezjr.com')
  })

  test('bypasses the session guard for either callback directory spelling', async () => {
    const context = vm.createContext({
      exports: {},
      defineNuxtRouteMiddleware: (middleware: Middleware) => middleware,
      require: () => ({
        useUserStore() { throw new Error('Callback must bypass the TimeForge session guard') },
      }),
    })
    const middleware = compileMiddleware(context)

    for (const path of ['/auth/google', '/auth/google/']) {
      await expect(middleware({ path, query: { app: 'blackjack' } })).resolves.toBeUndefined()
    }
  })

  for (const path of ['/login', '/login/']) {
    test(`redirects a restored session away from ${path}`, async () => {
      const store = {
        sessionChecked: false,
        isLoggedIn: false,
        timeforgeProfile: null,
        setUser(user: unknown) {
          this.isLoggedIn = Boolean(user)
          this.sessionChecked = true
        },
      }
      const context = vm.createContext({
        exports: {},
        defineNuxtRouteMiddleware: (middleware: Middleware) => middleware,
        require: () => ({ useUserStore: () => store, isUnauthorizedError: () => false }),
        useNuxtApp: () => ({
          $strapi: {
            async restoreUser() { return { id: 31 } },
            getTimeForgeProfile() { throw new Error('Redirect must happen first') },
          },
        }),
        navigateTo: (destination: string, options?: { replace?: boolean }) => ({
          path: destination,
          replace: options?.replace,
        }),
      })
      const middleware = compileMiddleware(context)
      const result = await middleware({ path, query: { auth: 'error' } })

      expect(result).toEqual({ path: '/', replace: true })
    })
  }
})
