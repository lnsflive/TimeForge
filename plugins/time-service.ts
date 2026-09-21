import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'
import { retireTimeForgeWorkers } from '~/utils/retired-workers.js'
export default defineNuxtPlugin(nuxtApp => {
  const scheduled = new Map<string, ReturnType<typeof setTimeout>>()
  const clear = () => {scheduled.forEach(timer => clearTimeout(timer));scheduled.clear()}
  const timerService = {
    sendTimerState(state: {clockedIn:boolean}) {if(!state.clockedIn)clear()},
    sendBreakState(state: {startTime:string|null}|null) {if(!state?.startTime)clear()},
    scheduleNotification(data: {title:string,body:string,delay:number,tag:string}) {
      const previous=scheduled.get(data.tag);if(previous)clearTimeout(previous)
      scheduled.set(data.tag,setTimeout(()=>{
        scheduled.delete(data.tag)
        nuxtApp.$alerter?.showMessage?.({content:data.title+': '+data.body,value:'info'})
      },Math.max(0,data.delay)))
    },
    scheduleBreakReminders(startTime:string) {
      const elapsed=Date.now()-Date.parse(startTime)
      if(!Number.isFinite(elapsed))return
      for(const [minutes,title,body,tag] of [[14,'Break almost over','Your break ends in one minute.','break-warning'],[15,'Break over','Your 15-minute break has ended.','break-ended']] as const) {
        const delay=minutes*60000-elapsed
        if(delay>0)this.scheduleNotification({title,body,tag,delay})
      }
    }
  }
  if(import.meta.client) {
    void retireTimeForgeWorkers(navigator.serviceWorker,location.origin,useRuntimeConfig().app.baseURL).catch(()=>{})
    window.addEventListener('pagehide',clear,{once:true})
  }
  return {provide:{timerService}}
})
