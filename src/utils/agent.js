import Emitter from 'events'
import { v4 as uuidv4 } from 'uuid'

const emitter = new Emitter()
const agentWorker = new Worker('../background/agent', { type: 'module' })

agentWorker.onmessage = event => {
  const { data } = event

  emitter.emit(data.id, data)
}

export default isTestnet => method => (...args) => {
  const id = uuidv4()

  agentWorker.postMessage({
    id,
    method,
    args,
    isTestnet
  })

  return new Promise((resolve, reject) => {
    emitter.once(id, data => {
      if (data.error) reject(data.error)
      else resolve(data.result)
    })
  })
}
