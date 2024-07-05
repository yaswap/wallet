import cryptoassets from '@yaswap/wallet-core/dist/src/utils/cryptoassets'
import { timelockFeeDuration, timelockFeeAmountInSatoshis, timelockFeeAmount } from '@yaswap/wallet-core/dist/src/utils/asset'

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

export const getAssetDocuments = (asset) => {
  return cryptoassets[asset]?.tokenMetadata?.documents
}

export const getAssetLengthLimitDisplay = () => {
  return 12
}

export { timelockFeeDuration, timelockFeeAmountInSatoshis, timelockFeeAmount }
