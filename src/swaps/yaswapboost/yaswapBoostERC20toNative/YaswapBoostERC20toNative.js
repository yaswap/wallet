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

class YaswapBoostERC20toNative extends SwapProvider {
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
    if (!isERC20(from) || isERC20(to) || amount <= 0) return null

    // get native asset of ERC20 network
    const bridgeAsset = getNativeAsset(from)
    if (!this.supportedBridgeAssets.includes(bridgeAsset)) return null

    // get rate between ERC20 and it's native token (aka bridge asset)
    const quote = await this.bridgeAssetToAutomatedMarketMaker[bridgeAsset].getQuote({
      network,
      from,
      to: bridgeAsset,
      amount
    })
    if (!quote) return null

    // get rate between native asset and 'to' asset (which is native too)
    const bridgeAssetQuantity = unitToCurrency(assets[bridgeAsset], quote.toAmount)
    const finalQuote = await this.yaswapSwapProvider.getQuote({
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
      path: quote.path
    }
  }

  async newSwap({ network, walletId, quote: _quote }) {
    // ERC20 -> Bridge asset
    const result = await this.bridgeAssetToAutomatedMarketMaker[_quote.bridgeAsset].newSwap({
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
      slippage: slippagePercentage * 100
    }
  }

  async updateOrder(order) {
    return await this.yaswapSwapProvider.updateOrder(order)
  }

  async estimateFees({ network, walletId, asset, txType, quote, feePrices, max }) {
    // bridge asset -> 'to' asset
    const yaswapFees = await this.yaswapSwapProvider.estimateFees({
      network,
      walletId,
      asset,
      txType:
        txType === YaswapBoostERC20toNative.txTypes.SWAP
          ? YaswapBoostERC20toNative.txTypes.SWAP_CLAIM
          : txType,
      quote: {
        ...quote,
        from: quote.bridgeAsset,
        toAmount: quote.bridgeAssetAmount,
        toAccountId: quote.fromAccountId
      },
      feePrices,
      max
    })

    // 'from' asset -> bridge asset
    if (!isERC20(asset) && txType === YaswapBoostERC20toNative.txTypes.SWAP) {
      const automatedMarketMakerFees = await this.bridgeAssetToAutomatedMarketMaker[
        quote.bridgeAsset
      ].estimateFees({
        network,
        walletId,
        asset,
        txType: YaswapBoostERC20toNative.txTypes.SWAP,
        quote: {
          ...quote,
          to: quote.bridgeAsset,
          toAmount: quote.bridgeAssetAmount,
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

  async finalizeAutomatedMarketMakerAndStartYaswapSwap({
    swapYaswapFormat,
    swapAMMFormat,
    network,
    walletId
  }) {
    let result = await this.bridgeAssetToAutomatedMarketMaker[
      swapAMMFormat.bridgeAsset
    ].waitForSwapConfirmations({
      swap: swapAMMFormat,
      network,
      walletId
    })

    if (result?.status === 'SUCCESS') {
      result = await this.yaswapSwapProvider.newSwap({
        network,
        walletId,
        quote: swapYaswapFormat
      })

      return {
        ...result,
        ...swapYaswapFormat,
        toAmount: result.toAmount,
        status: result.status
      }
    }
  }

  async performNextSwapAction(store, { network, walletId, swap }) {
    let updates
    const swapYaswapFormat = {
      ...swap,
      from: swap.bridgeAsset,
      fromAmount: swap.bridgeAssetAmount,
      toAccountId: swap.fromAccountId,
      slippagePercentage
    }

    const swapAutomatedMarketMakerFormat = {
      ...swap,
      to: swap.bridgeAsset,
      toAmount: swap.bridgeAssetAmount,
      slippagePercentage
    }

    if (swap.status === 'WAITING_FOR_SWAP_CONFIRMATIONS') {
      updates = await withInterval(async () =>
        this.finalizeAutomatedMarketMakerAndStartYaswapSwap({
          swapYaswapFormat,
          swapAMMFormat: swapAutomatedMarketMakerFormat,
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

    if (!updates && !YaswapBoostERC20toNative.lspEndStates.includes(swap.status)) {
      updates = await this.bridgeAssetToAutomatedMarketMaker[
        swap.bridgeAsset
      ].performNextSwapAction(store, {
        network,
        walletId,
        swap: swapAutomatedMarketMakerFormat
      })
    }

    if (!updates) return

    return {
      ...updates,
      // reset from and to assets and values
      from: swap.from,
      fromAmount: swap.fromAmount,
      to: swap.to,
      // keep `toAmount` (from updates object) only in case swap transitioned from AMM to LSP
      toAmount: updates.status === 'INITIATED' ? updates.toAmount : swap.toAmount
    }
  }

  static txTypes = {
    ...YaswapSwapProvider.txTypes,
    ...OneinchSwapProvider.txTypes
  }

  static statuses = {
    ...YaswapSwapProvider.statuses,
    ...OneinchSwapProvider.statuses,
    // AAM states
    APPROVE_CONFIRMED: {
      ...OneinchSwapProvider.statuses.APPROVE_CONFIRMED,
      label: 'Swapping {from} for {bridgeAsset}'
    },
    WAITING_FOR_SWAP_CONFIRMATIONS: {
      ...OneinchSwapProvider.statuses.WAITING_FOR_SWAP_CONFIRMATIONS,
      label: 'Swapping {from} for {bridgeAsset}',
      notification() {
        return {
          message: 'Engaging Automated Market Maker'
        }
      }
    },
    // Yaswap swap states
    INITIATED: {
      ...YaswapSwapProvider.statuses.INITIATED,
      step: 2,
      label: 'Locking {bridgeAsset}'
    },
    INITIATION_REPORTED: {
      ...YaswapSwapProvider.statuses.INITIATION_REPORTED,
      step: 2,
      label: 'Locking {bridgeAsset}'
    },
    INITIATION_CONFIRMED: {
      ...YaswapSwapProvider.statuses.INITIATION_CONFIRMED,
      step: 2,
      label: 'Locking {bridgeAsset}'
    },
    FUNDED: {
      ...YaswapSwapProvider.statuses.FUNDED,
      step: 3,
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
      },
      step: 3
    },
    READY_TO_CLAIM: {
      ...YaswapSwapProvider.statuses.READY_TO_CLAIM,
      step: 4
    },
    WAITING_FOR_CLAIM_CONFIRMATIONS: {
      ...YaswapSwapProvider.statuses.WAITING_FOR_CLAIM_CONFIRMATIONS,
      step: 4
    },
    WAITING_FOR_REFUND: {
      ...YaswapSwapProvider.statuses.WAITING_FOR_REFUND,
      step: 4
    },
    GET_REFUND: {
      ...YaswapSwapProvider.statuses.GET_REFUND,
      label: 'Refunding {bridgeAsset}',
      step: 4
    },
    WAITING_FOR_REFUND_CONFIRMATIONS: {
      ...YaswapSwapProvider.statuses.WAITING_FOR_REFUND_CONFIRMATIONS,
      label: 'Refunding {bridgeAsset}',
      step: 4
    },
    // final states
    REFUNDED: {
      ...YaswapSwapProvider.statuses.REFUNDED,
      step: 5
    },
    SUCCESS: {
      ...YaswapSwapProvider.statuses.SUCCESS,
      step: 5
    },
    QUOTE_EXPIRED: {
      ...YaswapSwapProvider.statuses.QUOTE_EXPIRED,
      step: 5
    },
    FAILED: {
      ...OneinchSwapProvider.statuses.FAILED,
      step: 5
    }
  }

  static lspEndStates = ['REFUNDED', 'SUCCESS', 'QUOTE_EXPIRED']

  static fromTxType = YaswapBoostERC20toNative.txTypes.SWAP
  static toTxType = YaswapBoostERC20toNative.txTypes.SWAP_CLAIM

  static timelineDiagramSteps = [
    'APPROVE',
    'SWAP',
    'INITIATION',
    'AGENT_INITIATION',
    'CLAIM_OR_REFUND'
  ]

  static totalSteps = 6
}

export { YaswapBoostERC20toNative }
