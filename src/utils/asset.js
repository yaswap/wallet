import cryptoassets from '@yaswap/wallet-core/dist/src/utils/cryptoassets'

export const getAssetIcon = (asset, extension = 'svg') => {
  const cryptoAsset = cryptoassets[asset]
  console.log('TACA ===> getAssetIcon, asset = ', asset, ', cryptoAsset = ', cryptoAsset)
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