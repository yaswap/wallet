import { UserDeclinedError } from '@yaswap/error-parser'
import { PageProvider } from './pageProvider'

const LITECOIN_REQUEST_MAP = {
  wallet_getConnectedNetwork: 'wallet.getConnectedNetwork',
  wallet_getAddresses: 'wallet.getAddresses',
  wallet_signMessage: 'wallet.signMessage',
  wallet_sendTransaction: 'wallet.sendTransaction',
  wallet_signPSBT: 'wallet.signPSBT'
}

class LitecoinPageProvider extends PageProvider {
  async handleRequest(req) {
    const ltc = this.window.providerManager.getProviderFor('LTC')
    if (req.method === 'wallet_sendTransaction') {
      const to = req.params[0].to
      const value = req.params[0].value.toString(16)
      return ltc.getMethod('wallet.sendTransaction')({ to, value })
    }
    const method = LITECOIN_REQUEST_MAP[req.method] || req.method
    return ltc.getMethod(method)(...req.params)
  }
  setup() {
    this.window.litecoin = {
      enable: async () => {
        const { accepted } = await this.window.providerManager.enable('litecoin')
        if (!accepted) throw new UserDeclinedError()

        const ltc = this.window.providerManager.getProviderFor('LTC')
        return ltc.getMethod('wallet.getAddresses')()
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

export { LitecoinPageProvider }
