import { inject } from './broker/utils'
import Script from './broker/Script'
import { buildConfig } from '@yaswap/wallet-core'
import { getChain, getNativeAssetCode, isEvmChain } from '@yaswap/cryptoassets'
const contentScript = new Script()

function injectProviders(state) {
  const { injectEthereum, activeNetwork } = state
  const evmChains = buildConfig.chains
    .filter((chain) => isEvmChain(activeNetwork, chain))
    .map((chain) => {
      const network = getChain(activeNetwork, chain).network
      const asset = getNativeAssetCode(activeNetwork, chain)
      return { chain, asset, network }
    })

  const globalEthereum = {
    override: injectEthereum,
    ethereumChain: getGlobalEthereumChain(state)
  }

  const injectConfig = {
    evmChains,
    globalEthereum
  }

  inject('js/inject-script.js')
  setTimeout(() => {
    contentScript.setupInject(injectConfig)
    contentScript.startListen()
  }, 500)
}

function getGlobalEthereumChain(state) {
  const { externalConnections, activeWalletId, activeNetwork } = state

  let ethereumChain = state.injectEthereumChain
  const defaultAccountId = (externalConnections[activeWalletId]?.[origin] || {}).defaultEthereum

  if (defaultAccountId) {
    const defaultAccount = state.accounts[activeWalletId][activeNetwork].find(
      (account) => account.id === defaultAccountId
    )
    if (defaultAccount) {
      const selectedEthereumChain = defaultAccount.chain
      ethereumChain = selectedEthereumChain
    }
  }

  return ethereumChain
}

chrome.storage.local.get(['yaswap-wallet'], (storage) => {
  const state = storage['yaswap-wallet']
  injectProviders(state)
})
