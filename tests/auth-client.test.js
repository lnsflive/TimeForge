import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthClient } from '../utils/auth-client.js'
test('account actions delegate to the universal client; missing identity reaches login guard', async () => {
 const calls=[]
 const accounts={login:async(...args)=>{calls.push(args);return {id:7}},register:async()=>({confirmationRequired:true}),restore:async()=>null,logout:async()=>calls.push('logout'),headers:async()=>({})}
 const client=createAuthClient('https://api.example',async()=>accounts)
 assert.deepEqual(await client.login({identifier:'test',password:'fixture'}),{user:{id:7}})
 assert.deepEqual(calls[0],['test','fixture'])
 assert.deepEqual(await client.register({}),{confirmationRequired:true})
 await assert.rejects(client.restoreUser(),error=>error.response.status===401)
 await client.logout();assert.equal(calls[1],'logout')
})
test('domain profile API uses the client-selected session and preserves account-owned endpoints',async()=>{
 const calls=[];const responses=[[],[],{id:7,payRate:19},[{id:7,payRate:19}],{id:7,payRate:null}]
 const client=createAuthClient('https://api.example',async()=>({headers:async()=>({Authorization:'Bearer isolated-session'})}),async config=>{calls.push(config);return {data:responses.shift(),status:200,headers:{},config}})
 assert.deepEqual(await client.getTimeForgeProfile(),{payRate:null})
 assert.deepEqual(await client.updateTimeForgeProfile(19),{payRate:19})
 assert.deepEqual(await client.updateTimeForgeProfile(null),{payRate:null})
 assert.equal(calls[2].url,'/timeforgeprofiles');assert.equal(calls[4].url,'/timeforgeprofiles/7')
 assert.equal(calls[0].headers.Authorization,'Bearer isolated-session');assert.equal(calls[0].withCredentials,false)
})
