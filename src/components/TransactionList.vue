<template>
  <div class="transaction-list">
    <NoTransactionsFound v-if="!transactions.length" />
    <ListItem
      v-else
      v-for="item in transactions"
      :key="item.id"
      :id="item.type + '_' + item.from + '_' + item.to"
      :to="getDetailsUrl(item)"
      :container-class="{ 'text-danger': item.error }"
      :item-class="'h-padding'"
    >
      <template #icon>
        <img :src="getTypeIcon(item.type)" />
      </template>
      {{ getTitle(item) }}
      <template #sub-title>
        {{ getSubTitle(item) }}
      </template>
      <template #detail>
        {{ getDetail(item) }}
      </template>
      <template #detail-sub>
        <span v-if="getUIStatus(item) === 'COMPLETED'">
          {{ getCompletedAmount(item) }}
        </span>
        <span v-else> {{ getDetailSub(item) }} </span>
      </template>
      <template #detail-icon>
        <TransactionStatus
          :step="getTransactionStep(item)"
          :total-steps="getTotalSteps(item)"
          :status="getUIStatus(item)"
          :error="item.error"
        />
      </template>
    </ListItem>
  </div>
</template>

<script>
import ListItem from '@/components/ListItem'
import TransactionStatus from '@/components/TransactionStatus'
import NoTransactionsFound from '@/components/NoTransactionsFound.vue'

import {
  getStep,
  ACTIVITY_STATUSES,
  ACTIVITY_FILTER_TYPES,
  SEND_STATUS_FILTER_MAP
} from '@yaswap/wallet-core/dist/src/utils/history'
import { getSwapProvider } from '@yaswap/wallet-core/dist/src/factory'
import { getItemIcon } from '@/utils/history'
import {
  prettyBalance,
  prettyFiatBalance,
  formatFiatUI
} from '@yaswap/wallet-core/dist/src/utils/coinFormatter'
import moment from '@yaswap/wallet-core/dist/src/utils/moment'
import cryptoassets from '@yaswap/wallet-core/dist/src/utils/cryptoassets'
import { mapState } from 'vuex'

export default {
  components: {
    ListItem,
    TransactionStatus,
    NoTransactionsFound
  },
  props: ['transactions'],
  computed: {
    ...mapState(['fiatRates'])
  },
  methods: {
    getItemIcon,
    prettyBalance,
    prettyFiatBalance,
    formatFiatUI,
    getTitle(item) {
      const status = item.status === 'SUCCESS' ? `Sent` : `Send`
      switch (item.type) {
        case 'SWAP':
          return `${item.from} to ${item.to}`
        case 'SEND':
          return `${status} ${item.from}`
        case 'NFT':
          return item.from === 'YAC' ? `${status} ${item.nft.token_id}`: `${status} ${item.nft.name}`
        case 'RECEIVE':
          return `Receive ${item.from}`
        default:
          return ''
      }
    },
    getSubTitle(item) {
      return moment(item.startTime).format('L, LT')
    },
    getDetail(item) {
      let assetName = item.from
      const amount = item.type === 'SWAP' ? item.fromAmount : item.amount

      if (!amount) return ``

      const chain = cryptoassets[assetName]?.chain
      if (chain === 'yacoin' && assetName !== 'YAC') {
        assetName = 'Token'
      }

      return `${this.prettyBalance(amount, item.from)} ${assetName}`
    },
    getDetailSub(item) {
      const status = this.getUIStatus(item)

      if (status) {
        const filterStatus = ACTIVITY_STATUSES[status]
        if (filterStatus) {
          return filterStatus.label
        }
      }

      return ''
    },
    getUIStatus(item) {
      if (item.type === 'NFT') {
        return SEND_STATUS_FILTER_MAP[item.status]
      } else if (item.type === 'SEND') {
        return SEND_STATUS_FILTER_MAP[item.status]
      } else if (item.type === 'SWAP') {
        const swapProvider = getSwapProvider(item.network, item.provider)
        return swapProvider.statuses[item.status].filterStatus
      }
    },
    getDetailsUrl(item) {
      return {
        NFT: `/details/nft-transaction/${item.id}`,
        SEND: `/details/transaction/${item.id}`,
        SWAP: `/details/swap/${item.id}`
      }[item.type]
    },
    getTypeIcon(type) {
      const filter = ACTIVITY_FILTER_TYPES[type]
      return this.getItemIcon(filter?.icon)
    },
    getTransactionStep(item) {
      return getStep(item) + 1
    },
    getTotalSteps(item) {
      switch (item.type) {
        case 'SEND':
          return 2
        case 'SWAP': {
          const swapProvider = getSwapProvider(item.network, item.provider)
          return swapProvider.totalSteps
        }
        default:
          return 0
      }
    },
    getCompletedAmount(item) {
      const amount = item.type === 'SWAP' ? item.fromAmount : item.amount

      if (!amount) return ''

      return !this.fiatRates[item.from]
        ? ''
        : `${formatFiatUI(
            prettyFiatBalance(prettyBalance(amount, item.from), this.fiatRates[item.from])
          )}`
    }
  }
}
</script>

<style lang="sss"></style>
