import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthClient, googleLoginUrl, completeGoogleLogin, GOOGLE_CALLBACK } from '../utils/auth-client.js'

function storage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
}
function setup(responses = [], token = 'existing') {
  const calls = []
  const store = storage(token ? { strapi_jwt: token } : {})
  const client = createAuthClient('https://api.jaimegonzalezjr.com', store, async config => {
    calls.push(config)
    const next = responses.shift()
    if (next instanceof Error) throw next
    return { data: next, status: 200, headers: {}, config }
  })
  return { client, calls, store }
}

test('native local login stores shared JWT and subsequent identity uses bearer', async () => {
  const user = { id: 12 }
  const { client, calls, store } = setup([{ jwt: 'new', user }, user])
  assert.deepEqual(await client.login({ identifier: 'test', password: 'example' }), { user })
  assert.equal(store.getItem('strapi_jwt'), 'new')
  await client.restoreUser()
  assert.equal(calls[0].url, '/auth/local')
  assert.equal(calls[0].headers.Authorization, undefined)
  assert.equal(calls[1].url, '/users/me')
  assert.equal(calls[1].headers.Authorization, 'Bearer new')
  assert.equal(calls[1].withCredentials, false)
})
test('missing JWT skips network and invalid JWT is cleared', async () => {
  const absent = setup([], null)
  await assert.rejects(absent.client.restoreUser(), /Sign in required/)
  assert.equal(absent.calls.length, 0)
  const error = Object.assign(new Error('expired'), { response: { status: 401 } })
  const expired = setup([error])
  await assert.rejects(expired.client.restoreUser(), /expired/)
  assert.equal(expired.store.getItem('strapi_jwt'), null)
})
test('logout clears shared JWT even if legacy cookie cleanup is offline', async () => {
  const { client, calls, store } = setup([new Error('offline')])
  await client.logout()
  assert.equal(store.getItem('strapi_jwt'), null)
  assert.equal(calls[0].url, '/auth/logout')
  assert.equal(calls[0].method, 'post')
  assert.equal(calls[0].withCredentials, true)
})
test('profile create and update use server-owned native collection', async () => {
  const { client, calls } = setup([[], [], { id: 7, payRate: 19 }, [{id:7,payRate:19}], {id:7,payRate:null}])
  assert.deepEqual(await client.getTimeForgeProfile(), {payRate:null})
  assert.deepEqual(await client.updateTimeForgeProfile(19), {payRate:19})
  assert.deepEqual(await client.updateTimeForgeProfile(null), {payRate:null})
  assert.equal(calls[2].url, '/timeforgeprofiles')
  assert.equal(calls[2].method, 'post')
  assert.deepEqual(JSON.parse(calls[2].data), {payRate:19})
  assert.equal(calls[4].url, '/timeforgeprofiles/7')
  assert.equal(calls[4].method, 'put')
  assert.deepEqual(JSON.parse(calls[4].data), {payRate:null})
})
test('Google start stores per-tab nonce and native callback', () => {
  const session = storage()
  const start = new URL(googleLoginUrl(session, {getRandomValues: array => array.fill(1)}))
  assert.equal(start.origin + start.pathname, 'https://strapi.jaimegonzalezjr.com/connect/google')
  const callback = new URL(start.searchParams.get('callback'))
  assert.equal(callback.origin + callback.pathname, GOOGLE_CALLBACK)
  assert.equal(callback.searchParams.get('state'), session.getItem('strapi_google_state'))
  assert.equal(session.getItem('strapi_google_state').length, 64)
})
test('callback validates nonce, exchanges token once, and constrains onward destination', async () => {
  const session = storage({strapi_google_state:'nonce',strapi_google_return:'/games/memory/#/'})
  const {client,calls,store} = setup([{jwt:'google',user:{id:4}}])
  assert.equal(await completeGoogleLogin('?state=nonce&access_token=secret',session,client), '/games/memory/#/')
  assert.equal(calls[0].url, '/auth/google/callback')
  assert.equal(calls[0].params.access_token,'secret')
  assert.equal(store.getItem('strapi_jwt'),'google')
  await assert.rejects(completeGoogleLogin('?state=nonce&access_token=secret',session,client))
  assert.equal(calls.length,1)
  const attacker = storage({strapi_google_state:'nonce',strapi_google_return:'https://evil.example'})
  assert.equal(await completeGoogleLogin('?state=nonce&access_token=secret',attacker,{exchangeGoogleToken: async()=>{}}), '/Projects/TimeForge/')
})
test('mismatched Google callback makes no token exchange', async () => {
  let called = false
  const session=storage({strapi_google_state:'expected'})
  await assert.rejects(completeGoogleLogin('?state=wrong&access_token=secret',session,{exchangeGoogleToken:async()=>{called=true}}))
  assert.equal(called,false)
  assert.equal(session.getItem('strapi_google_state'),null)
})
