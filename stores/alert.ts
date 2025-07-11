import { defineStore } from 'pinia'

interface AlertMessage {
  content: string
  value: 'success' | 'error' | 'info' | 'warning'
}

export const useAlertStore = defineStore('alert', {
  state: () => ({
    content: '',
    value: '' as AlertMessage['value']
  }),

  actions: {
    showMessage(payload: AlertMessage) {
      this.content = payload.content
      this.value = payload.value
    }
  }
})
