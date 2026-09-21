import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
test('shared Google callback bypasses application session guard with either directory spelling', async () => {
  const source = readFileSync(new URL('../middleware/auth.global.ts', import.meta.url), 'utf8')
  const output = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
  const context = {exports:{}, defineNuxtRouteMiddleware: fn => fn, require: () => ({useUserStore(){throw new Error('Callback must bypass TimeForge session guard')}})}
  vm.runInNewContext(output, context)
  for (const path of ['/auth/google', '/auth/google/']) assert.equal(await context.exports.default({path,query:{app:'blackjack'}}), undefined)
})
