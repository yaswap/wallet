import cryptoassets from '@yaswap/wallet-core/dist/src/utils/cryptoassets'

const TIMELOCK_FEE_DURATION = 10; // 21000 blocks
const TIMELOCK_FEE_AMOUNT = 10 * 1e6; // 2100 YAC

export const getAssetIcon = (asset, extension = 'svg') => {
  const cryptoAsset = cryptoassets[asset]
  if (cryptoAsset?.chain === 'yacoin' && cryptoAsset?.type !== 'native' && cryptoAsset?.tokenMetadata?.imageURL) {
    return cryptoAsset.tokenMetadata.imageURL
  }

  const _asset = cryptoassets[asset]?.matchingAsset ?? asset

  try {
    return require(`../assets/icons/assets/${_asset.toLowerCase()}.${extension}?inline`)
  } catch (e) {
    try {
      return require(`../../node_modules/cryptocurrency-icons/svg/color/${_asset.toLowerCase()}.svg?inline`)
    } catch (e) {
      return require('../assets/icons/blank_asset.svg?inline')
    }
  }
}

export const getAssetFullName = (asset) => {
  return cryptoassets[asset]?.tokenMetadata?.name
}

export const getAssetDescription = (asset) => {
  return cryptoassets[asset]?.tokenMetadata?.description
}

export const getAssetLengthLimitDisplay = () => {
  return 12
}

export const timelockFeeDuration = () => {
  return TIMELOCK_FEE_DURATION
}

export const timelockFeeAmountInSatoshis = () => {
  return TIMELOCK_FEE_AMOUNT
}

export const timelockFeeAmount = () => {
  return TIMELOCK_FEE_AMOUNT/1e6
}