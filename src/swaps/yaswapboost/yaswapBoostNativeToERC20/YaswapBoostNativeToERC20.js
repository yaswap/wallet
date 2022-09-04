import BN from 'bignumber.js'
import { SwapProvider } from '../../SwapProvider'
import { unitToCurrency, assets } from '@yaswap/cryptoassets'
import { withInterval } from '../../../store/actions/performNextAction/utils'
import { prettyBalance } from '../../../utils/coinFormatter'
import { isERC20, getNativeAsset } from '@/utils/asset'
import { YaswapSwapProvider } from '../../yaswap/YaswapSwapProvider'
import { OneinchSwapProvider } from '../../oneinch/OneinchSwapProvider'
import { createSwapProvider } from '../../../store/factory/swapProvider'

const slippagePercentage = 3

class YaswapBoostNativeToERC20 extends SwapProvider {
  constructor(config) {
    super(config)
    this.yaswapSwapProvider = createSwapProvider(this.config.network, 'yaswap')
    this.sovrynSwapProvider = createSwapProvider(this.config.network, 'sovryn')
    this.supportedBridgeAssets = this.config.supportedBridgeAssets

    if (this.config.network === 'mainnet') {
      this.oneinchSwapProvider = createSwapProvider(this.config.network, 'oneinchV4')
      this.bridgeAssetToAutomatedMarketMaker = {
        MATIC: this.oneinchSwapProvider,
        ETH: this.oneinchSwapProvider,
        BNB: this.oneinchSwapProvider,
        RBTC: this.sovrynSwapProvider
      }
    } else if (this.config.network === 'testnet') {
      this.bridgeAssetToAutomatedMarketMaker = {
        RBTC: this.sovrynSwapProvider
      }
    }
  }

  async getSupportedPairs() {
    return []
  }

  async getQuote({ network, from, to, amount }) {
    if (isERC20(from) || !isERC20(to) || amount <= 0) return null
    const bridgeAsset = getNativeAsset(to)
    if (!this.supportedBridgeAssets.includes(bridgeAsset)) return null
    const quote = await this.yaswapSwapProvider.getQuote({
      network,
      from,
      to: bridgeAsset,
      amount
    })
    if (!quote) return null
    const bridgeAssetQuantity = unitToCurrency(assets[bridgeAsset], quote.toAmount)
    const finalQuote = await this.bridgeAssetToAutomatedMarketMaker[bridgeAsset].getQuote({
      network,
      from: bridgeAsset,
      to,
      amount: bridgeAssetQuantity.toNumber()
    })
    if (!finalQuote) return null
    return {
      from,
      to,
      fromAmount: quote.fromAmount,
      toAmount: finalQuote.toAmount,
      bridgeAsset,
      bridgeAssetAmount: quote.toAmount,
      path: finalQuote.path
    }
  }

  async newSwap({ network, walletId, quote: _quote }) {
    const result = await this.yaswapSwapProvider.newSwap({
      network,
      walletId,
      quote: {
        ..._quote,
        to: _quote.bridgeAsset,
        toAmount: _quote.bridgeAssetAmount
      }
    })
    return {
      ...result,
      ..._quote,
      slippage: slippagePercentage * 100,
      bridgeAssetAmount: result.toAmount
    }
  }

  async updateOrder(order) {
    return await this.yaswapSwapProvider.updateOrder(order)
  }

  async estimateFees({ network, walletId, asset, txType, quote, feePrices, max }) {
    const yaswapFees = await this.yaswapSwapProvider.estimateFees({
      network,
      walletId,
      asset,
      txType:
        txType === YaswapBoostNativeToERC20.txTypes.SWAP
          ? YaswapBoostNativeToERC20.txTypes.SWAP_CLAIM
          : txType,
      quote: {
        ...quote,
        to: quote.bridgeAsset,
        toAmount: quote.bridgeAssetAmount
      },
      feePrices,
      max
    })
    if (isERC20(asset) && txType === YaswapBoostNativeToERC20.txTypes.SWAP) {
      const automatedMarketMakerFees = await this.bridgeAssetToAutomatedMarketMaker[
        quote.bridgeAsset
      ].estimateFees({
        network,
        walletId,
        asset,
        txType: YaswapBoostNativeToERC20.txTypes.SWAP,
        quote: {
          ...quote,
          from: quote.bridgeAsset,
          fromAmount: quote.bridgeAssetAmount,
          fromAccountId: quote.toAccountId,
          slippagePercentage
        },
        feePrices,
        max
      })
      const totalFees = {}
      for (const key in automatedMarketMakerFees) {
        totalFees[key] = BN(automatedMarketMakerFees[key]).plus(yaswapFees[key])
      }
      return totalFees
    }
    return yaswapFees
  }

  async finalizeYaswapSwapAndStartAutomatedMarketMaker({ swap, network, walletId }) {
    const result = await this.yaswapSwapProvider.waitForClaimConfirmations({
      swap,
      network,
      walletId
    })
    if (result?.status === 'SUCCESS') return { endTime: Date.now(), status: 'APPROVE_CONFIRMED' }
  }

  async performNextSwapAction(store, { network, walletId, swap }) {
    let updates
    const swapYaswapFormat = {
      ...swap,
      to: swap.bridgeAsset,
      toAmount: swap.bridgeAssetAmount,
      slippagePercentage
    }
    const swapAutomatedMarketMakerFormat = {
      ...swap,
      from: swap.bridgeAsset,
      fromAmount: swap.bridgeAssetAmount,
      fromAccountId: swap.toAccountId,
      slippagePercentage,
      fee: swap.claimFee
    }
    if (swap.status === 'WAITING_FOR_CLAIM_CONFIRMATIONS') {
      updates = await withInterval(async () =>
        this.finalizeYaswapSwapAndStartAutomatedMarketMaker({
          swap: swapYaswapFormat,
          network,
          walletId
        })
      )
    } else {
      updates = await this.yaswapSwapProvider.performNextSwapAction(store, {
        network,
        walletId,
        swap: swapYaswapFormat
      })
    }

    if (!updates) {
      updates = await this.bridgeAssetToAutomatedMarketMaker[
        swap.bridgeAsset
      ].performNextSwapAction(store, {
        network,
        walletId,
        swap: swapAutomatedMarketMakerFormat
      })
    }
    return updates
  }

  static txTypes = {
    ...YaswapSwapProvider.txTypes,
    ...OneinchSwapProvider.txTypes
  }

  static statuses = {
    ...YaswapSwapProvider.statuses,
    ...OneinchSwapProvider.statuses,
    FUNDED: {
      ...YaswapSwapProvider.statuses.FUNDED,
      label: 'Locking {bridgeAsset}'
    },
    CONFIRM_COUNTER_PARTY_INITIATION: {
      ...YaswapSwapProvider.statuses.CONFIRM_COUNTER_PARTY_INITIATION,
      label: 'Locking {bridgeAsset}',
      notification(swap) {
        return {
          message: `Counterparty sent ${prettyBalance(swap.bridgeAssetAmount, swap.bridgeAsset)} ${
            swap.bridgeAsset
          } to escrow`
        }
      }
    },
    READY_TO_CLAIM: {
      ...YaswapSwapProvider.statuses.READY_TO_CLAIM,
      label: 'Claiming {bridgeAsset}'
    },
    WAITING_FOR_CLAIM_CONFIRMATIONS: {
      ...YaswapSwapProvider.statuses.WAITING_FOR_CLAIM_CONFIRMATIONS,
      label: 'Claiming {bridgeAsset}'
    },
    APPROVE_CONFIRMED: {
      ...OneinchSwapProvider.statuses.APPROVE_CONFIRMED,
      step: 3,
      label: 'Swapping {bridgeAsset} for {to}'
    },
    WAITING_FOR_SWAP_CONFIRMATIONS: {
      ...OneinchSwapProvider.statuses.WAITING_FOR_SWAP_CONFIRMATIONS,
      notification() {
        return {
          message: 'Engaging Automated Market Maker'
        }
      },
      step: 3
    },
    SUCCESS: {
      ...YaswapSwapProvider.statuses.SUCCESS,
      step: 4
    },
    FAILED: {
      ...OneinchSwapProvider.statuses.FAILED,
      step: 4
    }
  }

  static fromTxType = YaswapBoostNativeToERC20.txTypes.SWAP_INITIATION
  static toTxType = YaswapBoostNativeToERC20.txTypes.SWAP

  static timelineDiagramSteps = ['INITIATION', 'AGENT_INITIATION', 'CLAIM_OR_REFUND', 'SWAP']

  static totalSteps = 5
}

export { YaswapBoostNativeToERC20 }
