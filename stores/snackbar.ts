import { defineStore } from 'pinia'

interface SnackbarMessage {
  content: string
  color: string
  timeout: number
}

export const useSnackbarStore = defineStore('snackbar', {
  state: () => ({
    content: '',
    color: '',
    timeout: 0
  }),

  actions: {
    showMessage(payload: SnackbarMessage) {
      this.content = payload.content
      this.color = payload.color
      this.timeout = payload.timeout
    }
  }
})
