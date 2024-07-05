import { ProviderManager } from './providerManager'
import { EthereumPageProvider } from './ethereumProvider'
import { GlobalEthereumPageProvider } from './globalEthereumProvider'
import { BitcoinPageProvider } from './bitcoinProvider'
import { YacoinPageProvider } from './yacoinProvider'
import { LitecoinPageProvider } from './litecoinProvider'
import { DogecoinPageProvider } from './dogecoinProvider'
import { PagementURIPageProvivder } from './paymentUri'
import { TerraPageProvider } from './terraProvider'
import { NearPageProvider } from './nearProvider'
import { SolanaPageProvider } from './solanaProvider'
console.log("TACA ===> start inject-script.js")

// Setup providers
window.addEventListener(
  'message',
  (event) => {
    console.log("TACA ===> inject-script.js, event = ", event)
    if (event.source !== window) return
    if (!event.data) return

    const { type, data } = event.data
    if (type !== 'setup' || !data) return

    window.yaswap = data;
    console.log("TACA ===> inject-script.js, window.yaswap = ", window.yaswap)

    const { override, ethereumChain } = window.yaswap.globalEthereum

    const ethereumProviders = window.yaswap.evmChains.map(
      (evmChain) => new EthereumPageProvider(window, evmChain.chain, evmChain.asset, evmChain.network)
    )
    
    const providers = [
      new ProviderManager(window),
      ...ethereumProviders,
      new GlobalEthereumPageProvider(window, override, ethereumChain),
      new BitcoinPageProvider(window),
      new YacoinPageProvider(window),
      new LitecoinPageProvider(window),
      new DogecoinPageProvider(window),
      new NearPageProvider(window),
      new SolanaPageProvider(window),
      new TerraPageProvider(window),
      new PagementURIPageProvivder(window)
    ]
    
    providers.forEach((p) => p.setup())
  },
  false
)

