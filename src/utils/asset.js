import cryptoassets from '@yaswap/wallet-core/dist/src/utils/cryptoassets'

export const getAssetIcon = (asset, extension = 'svg') => {
  const ipfsHash = cryptoassets[asset]?.ipfsHash
  if (ipfsHash) {
    console.log('TACA ===> getAssetIcon, asset = ', asset, 'ipfsHash = ', ipfsHash)
    return `https://ipfs.io/ipfs/${ipfsHash}`
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
