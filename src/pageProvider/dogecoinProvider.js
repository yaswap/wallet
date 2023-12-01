import { UserDeclinedError } from '@yaswap/error-parser'
import { PageProvider } from './pageProvider'

const DOGEOIN_REQUEST_MAP = {
  wallet_getConnectedNetwork: 'wallet.getConnectedNetwork',
  wallet_getAddresses: 'wallet.getAddresses',
  wallet_signMessage: 'wallet.signMessage',
  wallet_sendTransaction: 'wallet.sendTransaction',
  wallet_signTx: 'wallet.signTx'
}

class DogecoinPageProvider extends PageProvider {
  async handleRequest(req) {
    const doge = this.window.providerManager.getProviderFor('DOGE')
    if (req.method === 'wallet_sendTransaction') {
      const to = req.params[0].to
      const value = req.params[0].value.toString(16)
      return doge.getMethod('wallet.sendTransaction')({ to, value })
    }
    const method = DOGEOIN_REQUEST_MAP[req.method] || req.method
    return doge.getMethod(method)(...req.params)
  }
  setup() {
    this.window.dogecoin = {
      enable: async () => {
        const { accepted } = await this.window.providerManager.enable('dogecoin')
        if (!accepted) throw new UserDeclinedError()

        const doge = this.window.providerManager.getProviderFor('DOGE')
        return doge.getMethod('wallet.getAddresses')()
      },
      request: async (req) => {
        const params = req.params || []
        return this.handleRequest({
          method: req.method,
          params
        })
      }
    }
  }
}

export { DogecoinPageProvider }
