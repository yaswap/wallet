import EventEmitter from 'events'
import { connectToBackground } from './utils'

class Script {
  constructor() {
    this.emitter = new EventEmitter()
    this.background = connectToBackground(`injection|${window.location.href}`)
    this.background.onMessage.addListener((message) => this.onMessage(message))
  }

  startListen() {
    window.addEventListener(
      'message',
      (event) => {
        if (event.source !== window) return
        if (!event.data) return

        const { id, type, data } = event.data
        if (!id || !type) return

        this.background.postMessage({
          id,
          type,
          data
        })
      },
      false
    )
  }

  setupInject(config) {
    window.postMessage({
      type: 'setup',
      data: config
    });
  }

  onMessage({ id, data }) {
    window.dispatchEvent(new CustomEvent(id, { detail: JSON.stringify(data) }))
  }
}

export default Script
