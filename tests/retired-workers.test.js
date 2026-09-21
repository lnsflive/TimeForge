import test from 'node:test'
import assert from 'node:assert/strict'
import {retireTimeForgeWorkers} from '../utils/retired-workers.js'
test('retirement removes only TimeForge workers and leaves unrelated site workers intact',async()=>{
 const origin='https://jaimegonzalezjr.com';const removed=[]
 const records=[['/Projects/TimeForge/','/Projects/TimeForge/sw.js'],['/','/sw-custom.js'],['/games/memory/','/games/memory/sw.js'],['/','/other-site-worker.js']].map(([scope,scriptURL],index)=>({scope:origin+scope,active:{scriptURL:origin+scriptURL},unregister:async()=>removed.push(index)}))
 await retireTimeForgeWorkers({getRegistrations:async()=>records},origin,'/Projects/TimeForge/')
 assert.deepEqual(removed,[0,1])
})
