import EventEmitter from 'events'
import { connectToBackground } from './utils'

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

class Script {
  constructor() {
    this.emitter = new EventEmitter()
    this.connectToBackground()
  }

  connectToBackground() {
    this.background = connectToBackground(`injection|${window.location.href}`)
    this.background.onMessage.addListener((message) => this.onMessage(message))
  }

  startListen() {
    window.addEventListener(
      'message',
      async (event) => {
        if (event.source !== window) return
        if (!event.data) return

        const { id, type, data } = event.data
        if (!id || !type) return

        // Reconnect in case the connection was aborted due to service worker terminated
        for (let retry = 0; retry < 5; retry++) {
          try {
            this.background.postMessage({
              id,
              type,
              data
            })
            break
          } catch (error) {
            console.error(error)
            this.connectToBackground()
            console.warn(`Retry connecting to background. ${retry+1} times.`)
            await delay(1000)
          }
        }
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
