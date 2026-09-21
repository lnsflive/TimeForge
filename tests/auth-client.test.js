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
function profileClient(responses) {
 const calls=[]
 const client=createAuthClient('https://api.example',async()=>({headers:async()=>({Authorization:'Bearer isolated-session'})}),async config=>{
   calls.push(config);const data=responses.shift();if(data instanceof Error)throw data;return {data,status:200,headers:{},config}
 })
 return {client,calls}
}
test('first TimeForge use provisions the missing profile, and saves through its owned ID',async()=>{
 const {client,calls}=profileClient([[],{id:7,payRate:null},[{id:7,payRate:null}],{id:7,payRate:19}])
 assert.deepEqual(await client.getTimeForgeProfile(),{payRate:null})
 assert.equal(calls[1].method,'post');assert.deepEqual(JSON.parse(calls[1].data),{payRate:null})
 assert.deepEqual(await client.updateTimeForgeProfile(19),{payRate:19})
 assert.equal(calls[3].url,'/timeforgeprofiles/7');assert.equal(calls[3].headers.Authorization,'Bearer isolated-session')
})
test('simultaneous first-use conflict reuses the existing profile before saving',async()=>{
 const conflict=Object.assign(new Error('exists'),{response:{status:409}})
 const {client,calls}=profileClient([[],conflict,[{id:9,payRate:null}],{id:9,payRate:25}])
 assert.deepEqual(await client.updateTimeForgeProfile(25),{payRate:25});assert.equal(calls[3].url,'/timeforgeprofiles/9')
})
test('profile failures remain visible; existing profiles are never replaced',async()=>{
 const failure=Object.assign(new Error('database failure'),{response:{status:500}})
 const failed=profileClient([[],failure]);await assert.rejects(failed.client.getTimeForgeProfile(),/database failure/)
 const existing=profileClient([[{id:3,payRate:55.29}]]);assert.deepEqual(await existing.client.getTimeForgeProfile(),{payRate:55.29});assert.equal(existing.calls.length,1)
})
