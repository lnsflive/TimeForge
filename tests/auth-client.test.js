import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthClient, authErrorMessage } from '../utils/auth-client.js'

function setup(responses = []) {
  const calls = []
  const removed = []
  const client = createAuthClient('https://api.jaimegonzalezjr.com', {
    removeItem(key) { removed.push(key) },
    getItem() { throw new Error('Never read the stale JWT') }
  }, async config => {
    calls.push(config)
    const next = responses.shift()
    if (next instanceof Error) throw next
    return { data: next, status: 200, statusText: 'OK', headers: {}, config }
  })
  return { client, calls, removed }
}

test('local login ignores stale JWT and relies on credentialed cookie transport', async () => {
  const user = { id: 12, username: 'existing' }
  const { client, calls, removed } = setup([{ user }, user])
  assert.deepEqual(await client.login({ identifier: 'existing', password: 'example' }), { user })
  assert.equal(calls[0].url, '/portfolio/auth/local')
  assert.equal(calls[0].withCredentials, true)
  assert.equal(calls[0].headers.Authorization, undefined)
  assert.deepEqual(removed, ['strapi_jwt', 'strapi_jwt'])
})

test('restores identity from the API cookie and signs out server-side', async () => {
  const { client, calls } = setup([{ user: { id: 12 } }, { id: 12, payRate: 20 }, {}])
  assert.deepEqual(await client.restoreUser(), { id: 12, payRate: 20 })
  await client.logout()
  assert.deepEqual(calls.map(c => [c.url, c.method, c.withCredentials]), [
    ['/portfolio/session', 'get', true], ['/users/me', 'get', true], ['/portfolio/auth/logout', 'post', true]
  ])
})

test('does not disguise a failed logout as success', async () => {
  const { client } = setup([new Error('offline')])
  await assert.rejects(client.logout(), /offline/)
})

test('Google uses fixed registered application id and no client supplied return URL', () => {
  assert.equal(setup().client.googleLoginUrl(), 'https://api.jaimegonzalezjr.com/portfolio/auth/start?app=timeforge')
})

test('registration never persists or returns browser tokens', async () => {
  const { client, calls } = setup([{ jwt: 'discard', user: { id: 12 } }])
  assert.equal(await client.register({ username: 'new', email: 'new@example.com', password: 'example' }), undefined)
  assert.equal(calls[0].url, '/auth/local/register')
})

test('local provider errors explain confirmation or invalid credentials', () => {
  assert.equal(authErrorMessage({response: {data: {message: [{messages: [{message: 'Email is not confirmed'}]}]}}}, 'fallback'), 'Email is not confirmed')
  assert.equal(authErrorMessage({response: {data: {message: {unexpected: true}}}}, 'Try again'), 'Try again')
})
