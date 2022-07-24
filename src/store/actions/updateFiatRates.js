import { getPrices, getYacPrices } from '../utils'

export const updateFiatRates = async ({ commit }, { assets }) => {
  let fiatRates = await getPrices(assets, 'usd')
  fiatRates['YAC'] = await getYacPrices()

  commit('UPDATE_FIAT_RATES', { fiatRates })

  return fiatRates
}
