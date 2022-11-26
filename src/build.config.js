import { SwapProviderType } from './utils/swaps'

import SovrynMainnetAddresses from '@blobfishkate/sovryncontracts/contracts-mainnet.json'
import SovrynTestnetAddresses from '@blobfishkate/sovryncontracts/contracts-testnet.json'

export default {
  defaultAssets: {
    mainnet: [
      'BTC',
      'ETH',
      'DAI',
      'USDC',
      'USDT',
      'WBTC',
      'UNI',
      'RBTC',
      'SOV',
      'BNB',
      'NEAR',
      'MATIC',
      'PWETH',
      'ARBETH',
      'FISH',
      'LUNA',
      'UST',
      'YAC'
    ],
    testnet: [
      'BTC',
      'ETH',
      'DAI',
      'RBTC',
      'BNB',
      'NEAR',
      'SOV',
      'MATIC',
      'PWETH',
      'ARBETH',
      'SOL',
      'LUNA',
      'UST',
      'YAC',
      'FAU'
    ]
  },
  infuraApiKey: 'da99ebc8c0964bb8bb757b6f8cc40f1f',
  yacoinExploraApis: {
    esploraUrl: {
      testnet: 'https://yaswap.yacoin.org/api',
      mainnet: 'https://yaswap.yacoin.org/api'
    },
    esploraSwapUrl: {
      testnet: 'https://yaswap.yacoin.org',
      mainnet: 'https://yaswap.yacoin.org'
    }
  },
  bitcoinExploraApis: {
    testnet: 'https://electrs-testnet-api.liq-chainhub.net/',
    mainnet: 'https://electrs-mainnet-api.liq-chainhub.net/'
  },
  bitcoinBatchEsploraApis: {
    testnet: 'https://electrs-batch-testnet-api.liq-chainhub.net/',
    mainnet: 'https://electrs-batch-mainnet-api.liq-chainhub.net/'
  },
  swapProviders: {
    testnet: {
      yaswap: {
        name: 'Yaswap',
        icon: 'yaswap.svg',
        type: SwapProviderType.YASWAP,
        agent: 'https://yaswap.yacoin.org/atomicagent_testnet'
      },
      yaswapBoostNativeToERC20: {
        name: 'Yaswap Boost',
        type: SwapProviderType.YASWAPBOOST_NATIVE_TO_ERC20,
        network: 'testnet',
        icon: 'yaswapboost.svg',
        supportedBridgeAssets: ['RBTC']
      },
      yaswapBoostERC20toNative: {
        name: 'Yaswap Boost',
        type: SwapProviderType.YASWAPBOOST_ERC20_TO_NATIVE,
        network: 'testnet',
        icon: 'yaswapboost.svg',
        supportedBridgeAssets: ['RBTC']
      },
      uniswapV2: {
        name: 'Uniswap V2',
        icon: 'uniswap.svg',
        type: SwapProviderType.UNISWAPV2,
        routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
      },
      thorchain: {
        name: 'Thorchain',
        icon: 'thorchain.svg',
        type: SwapProviderType.THORCHAIN,
        thornode: 'https://testnet.thornode.thorchain.info'
      },
      sovryn: {
        name: 'Sovryn',
        icon: 'sovryn.svg',
        type: SwapProviderType.SOVRYN,
        routerAddress: SovrynTestnetAddresses.swapNetwork,
        routerAddressRBTC: SovrynTestnetAddresses.proxy3,
        rpcURL: process.env.VUE_APP_SOVRYN_RPC_URL_TESTNET
      }
    },
    mainnet: {
      yaswap: {
        name: 'Yaswap',
        icon: 'yaswap.svg',
        type: SwapProviderType.YASWAP,
        agent: 'https://yaswap.yacoin.org/atomicagent_mainnet'
      },
      yaswapBoostNativeToERC20: {
        name: 'Yaswap Boost',
        type: SwapProviderType.YASWAPBOOST_NATIVE_TO_ERC20,
        network: 'mainnet',
        icon: 'yaswapboost.svg',
        supportedBridgeAssets: ['MATIC', 'RBTC']
      },
      yaswapBoostERC20toNative: {
        name: 'Yaswap Boost',
        type: SwapProviderType.YASWAPBOOST_ERC20_TO_NATIVE,
        network: 'mainnet',
        icon: 'yaswapboost.svg',
        supportedBridgeAssets: ['MATIC', 'RBTC']
      },
      uniswapV2: {
        name: 'Uniswap V2',
        icon: 'uniswap.svg',
        type: SwapProviderType.UNISWAPV2,
        routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
      },
      oneinchV4: {
        name: 'Oneinch V4',
        icon: 'oneinch.svg',
        type: SwapProviderType.ONEINCHV4,
        agent: 'https://api.1inch.exchange/v4.0',
        routerAddress: '0x1111111254fb6c44bac0bed2854e76f90643097d',
        referrerAddress: {
          ethereum: '0x3a712CC47aeb0F20A7C9dE157c05d74B11F172f5',
          polygon: '0x3a712CC47aeb0F20A7C9dE157c05d74B11F172f5',
          bsc: '0x3a712CC47aeb0F20A7C9dE157c05d74B11F172f5'
        },
        referrerFee: 0.3
      },
      sovryn: {
        name: 'Sovryn',
        icon: 'sovryn.svg',
        type: SwapProviderType.SOVRYN,
        routerAddress: SovrynMainnetAddresses.swapNetwork,
        routerAddressRBTC: SovrynMainnetAddresses.proxy3,
        rpcURL: process.env.VUE_APP_SOVRYN_RPC_URL_MAINNET
      },
      thorchain: {
        name: 'Thorchain',
        icon: 'thorchain.svg',
        type: SwapProviderType.THORCHAIN,
        thornode: 'https://thornode.thorchain.info'
      }
    }
  },
  discordUrl: 'https://discord.gg/Xsqw7PW8wk',
  networks: ['mainnet', 'testnet'],
  chains: [
    'bitcoin',
    'ethereum',
    'rsk',
    'bsc',
    'near',
    'polygon',
    'arbitrum',
    'terra',
    'fuse',
    'yacoin'
  ],
  supportedBridgeAssets: ['MATIC', 'RBTC']
}
