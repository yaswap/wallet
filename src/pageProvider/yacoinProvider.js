import { UserDeclinedError } from '@yaswap/error-parser'
import { PageProvider } from './pageProvider'

const YACOIN_REQUEST_MAP = {
  wallet_getConnectedNetwork: 'wallet.getConnectedNetwork',
  wallet_getAddresses: 'wallet.getAddresses',
  wallet_signMessage: 'wallet.signMessage',
  wallet_sendTransaction: 'wallet.sendTransaction',
  wallet_signTx: 'wallet.signTx'
}

class YacoinPageProvider extends PageProvider {
  async handleRequest(req) {
    const yac = this.window.providerManager.getProviderFor('YAC')
    if (req.method === 'wallet_sendTransaction') {
      const to = req.params[0].to
      const value = req.params[0].value.toString(16)
      return yac.getMethod('wallet.sendTransaction')({ to, value })
    }
    const method = YACOIN_REQUEST_MAP[req.method] || req.method
    return yac.getMethod(method)(...req.params)
  }
  setup() {
    this.window.yacoin = {
      enable: async () => {
        const { accepted } = await this.window.providerManager.enable('yacoin')
        if (!accepted) throw new UserDeclinedError()

        const yac = this.window.providerManager.getProviderFor('YAC')
        return yac.getMethod('wallet.getAddresses')()
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

export { YacoinPageProvider }
