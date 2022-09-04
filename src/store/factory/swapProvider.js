import { SwapProviderType } from '@/utils/swaps'
import { YaswapSwapProvider } from '@/swaps/yaswap/YaswapSwapProvider'
import { YaswapBoostERC20toNative } from '@/swaps/yaswapboost/yaswapBoostERC20toNative/YaswapBoostERC20toNative'
import { YaswapBoostNativeToERC20 } from '@/swaps/yaswapboost/yaswapBoostNativeToERC20/YaswapBoostNativeToERC20'
import { UniswapSwapProvider } from '@/swaps/uniswap/UniswapSwapProvider'
import { OneinchSwapProvider } from '@/swaps/oneinch/OneinchSwapProvider'
import { ThorchainSwapProvider } from '@/swaps/thorchain/ThorchainSwapProvider'
import { FastbtcSwapProvider } from '@/swaps/fastbtc/FastbtcSwapProvider'
import { SovrynSwapProvider } from '@/swaps/sovryn/SovrynSwapProvider'
import { AstroportSwapProvider } from '@/swaps/astroport/AstroportSwapProvider'
import buildConfig from '@/build.config'

const providers = {
  [SwapProviderType.YASWAP]: YaswapSwapProvider,
  [SwapProviderType.UNISWAPV2]: UniswapSwapProvider,
  [SwapProviderType.ONEINCHV4]: OneinchSwapProvider,
  [SwapProviderType.THORCHAIN]: ThorchainSwapProvider,
  [SwapProviderType.YASWAPBOOST_NATIVE_TO_ERC20]: YaswapBoostNativeToERC20,
  [SwapProviderType.YASWAPBOOST_ERC20_TO_NATIVE]: YaswapBoostERC20toNative,
  [SwapProviderType.FASTBTC]: FastbtcSwapProvider,
  [SwapProviderType.SOVRYN]: SovrynSwapProvider,
  [SwapProviderType.ASTROPORT]: AstroportSwapProvider
}

export const createSwapProvider = (network, providerId) => {
  const swapProviderConfig = buildConfig.swapProviders[network][providerId]
  const SwapProvider = providers[swapProviderConfig.type]
  return new SwapProvider({ ...swapProviderConfig, providerId })
}
