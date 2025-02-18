<template>
  <div class="account-container">
    <NavBar :showMenu="true" :showBack="true" backPath="/wallet" :backLabel="asset.length > getAssetLengthLimitDisplay() ? 'Back' : $t('common.overview')">
      <span class="account-title"
        ><img :src="getAssetIcon(asset)" class="asset-icon" /> {{ asset }}</span
      >
    </NavBar>
    <div class="account-content">
      <div class="account-content-top">
        <RefreshIcon
          @click.stop="refresh"
          class="account-container_refresh-icon"
          id="refresh-icon"
          :class="{ 'infinity-rotate': updatingBalances }"
        />
        <div class="account-container_balance">
          <div class="account-container_balance_fiat" :id="`${asset}_fiat_value`">
            <span v-if="fiatRates[asset]">
              {{ formatFiatUI(formatFiat(fiat)) }}
            </span>
            <span v-else>&nbsp;</span>
          </div>
          <div>
            <span class="account-container_balance_value" :id="`${asset}_balance_value`">
              {{ balance }}
            </span>
            <span class="account-container_balance_code">{{ chain === 'yacoin' && asset !== 'YAC' ? 'Token' : asset }}</span>
          </div>
        </div>
        <div v-if="address" class="account-container_address">
          <v-popover
            trigger="hover focus"
            placement="top"
            :hideOnTargetClick="false"
            :delay="tooltipDelay"
          >
            <button
              @click.prevent="copyAddress"
              @mouseleave="offsetToolTipDelay"
              @mouseenter="setInitialToolTipDelay"
              class="btn btn-outline-light"
              :id="`${asset}_address_container`"
            >
              {{ shortenAddress(address) }}
            </button>
            <template slot="popover">
              <CopyAddress
                :address="address"
                :accountId="accountId"
                :asset="asset"
                :addressCopied="addressCopied"
                @copyAddress="copyAddress"
              />
            </template>
          </v-popover>
          <a
            class="eye-btn"
            :id="`${asset}_view_in_explorer`"
            @click="copyAddress"
            :href="addressLink"
            target="_blank"
            v-tooltip.bottom="{ content: $t('common.viewInExplorer') }"
          >
            <EyeIcon />
          </a>
        </div>
        <div class="account-container_actions">
          <router-link :to="`/accounts/${accountId}/${asset}/send`">
            <button class="account-container_actions_button">
              <div class="account-container_actions_button_wrapper" :id="`${asset}_send_button`">
                <SendIcon class="account-container_actions_button_icon" />
              </div>
              {{ $t('common.send') }}
            </button>
          </router-link>
          <router-link
            class="account-container_actions_button"
            active-class=""
            tag="button"
            :to="`/accounts/${accountId}/${asset}/swap`"
            v-if="chain !== 'yacoin' || (chain === 'yacoin' && asset === 'YAC')"
          >
            <div class="account-container_actions_button_wrapper" :id="`${asset}_swap_button`">
              <SwapIcon
                class="account-container_actions_button_icon account-container_actions_button_swap"
              />
            </div>
            {{ $t('common.swap') }}
          </router-link>
          <router-link v-bind:to="`/accounts/${accountId}/${asset}/receive`">
            <button class="account-container_actions_button">
              <div class="account-container_actions_button_wrapper" :id="`${asset}_receive_button`">
                <ReceiveIcon class="account-container_actions_button_icon" />
              </div>
              {{ $t('common.receive') }}
            </button>
          </router-link>
        </div>
      </div>
      <div v-if="chain === 'yacoin' && asset !== 'YAC'" class="wallet-tabs">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <span
              :class="activeTab === 'overview' ? 'nav-link active' : 'nav-link'"
              id="overview_tab"
              @click="activeTab = 'overview'"
            >
              {{ $t('common.overview') }}
            </span>
          </li>
          <li class="nav-item">
            <span
              :class="activeTab === 'details' ? 'nav-link active' : 'nav-link'"
              id="details_tab"
              @click="activeTab = 'details'"
            >
              {{ $t('pages.details.details') }}
            </span>
          </li>
          <li class="nav-item">
            <span
              :class="activeTab === 'activity' ? 'nav-link active' : 'nav-link'"
              id="activity_tab"
              @click="activeTab = 'activity'"
            >
              {{ $t('pages.wallet.activity') }}
            </span>
          </li>
        </ul>
        <div class="wallet-tab-content py-1">
          <div>
            <!-- <div class="px-4 mt-2" v-if="activeTab === 'overview'">
              <p> Full token name: only display if we specify "name" in metadata JSON file </p>
              <p> Description: only display if we specify "description" in metadata JSON file </p>
              <div>
                <img
                  width="200"
                  height="200"
                  ref="nftImage"
                  :src="getAssetIcon(asset)"
                  :alt="asset || 'YA-token'"
                  @error="imageError('nftImage')"
                />
              </div>
            </div> -->
            <div class="table" v-if="activeTab === 'overview'">
              <table class="table bg-white border-0 mb-1 mt-1">
                <tbody class="font-weight-normal">
                  <!-- Full token name -->
                  <tr class="border-top-0">
                    <td class="text-muted text-left small-12">
                      Full token name
                    </td>
                    <td class="text-break">
                      {{ getAssetFullName(asset) ?? asset }}
                    </td>
                  </tr>
                  <!-- Description -->
                  <tr>
                    <td class="text-muted text-left small-12">
                      Description
                    </td>
                    <td class="text-break" style="white-space: pre-line;">
                      {{ getAssetDescription(asset) ?? '-' }}
                    </td>
                  </tr>
                  <!-- Image -->
                  <tr>
                    <td class="text-muted text-left small-12" id="your_to_address">
                      Image
                    </td>
                    <td class="text-break" >
                      <img
                        width="200"
                        height="200"
                        ref="nftImage"
                        :src="getAssetIcon(asset)"
                        :alt="asset || 'YA-token'"
                        @error="imageError('nftImage')"
                      />
                    </td>
                  </tr>
                  <!-- Documents -->
                  <tr>
                    <td class="text-muted text-left small-12">
                      Documents
                    </td>
                    <td class="text-break">
                      <span v-if="!documents">
                        -
                      </span>
                      <a v-else-if="documents.length === 1"
                         class="text-primary"
                         :href="documents[0]"
                         target="_blank"
                      >
                          {{ documents[0] }}
                      </a>
                      <ol v-else>
                        <li v-for="document in documents"
                            :id="document"
                            :key="document"
                         >
                         <a class="text-primary" :href="document" target="_blank">{{ document }}</a>
                        </li>
                      </ol>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="table" v-if="activeTab === 'details'">
              <table class="table bg-white border-0 mb-1 mt-1">
                <tbody class="font-weight-normal">
                  <!-- Total Supply -->
                  <tr class="border-top-0">
                    <td class="text-muted text-left small-12">
                      Total Supply
                    </td>
                    <td class="text-break">
                      {{ assetInfo.totalSupply }}
                    </td>
                  </tr>
                  <!-- Divisibility -->
                  <tr>
                    <td class="text-muted text-left small-12">
                      Divisibility
                    </td>
                    <td class="text-break" >
                      {{ assetInfo.decimals }}
                    </td>
                  </tr>
                  <!-- Reissuable -->
                  <tr>
                    <td class="text-muted text-left small-12" id="your_to_address">
                      Reissuable
                    </td>
                    <td class="text-break" >
                      {{ assetInfo.reissuable ? 'True' : 'False' }}
                    </td>
                  </tr>
                  <!-- Created at block -->
                  <tr>
                    <td class="text-muted text-left small-12">
                      Created at block
                    </td>
                    <td class="text-break" v-if="assetInfo.contractAddress">
                      <span class="text-primary d-flex align-items-center">
                        {{ shortenAddress(assetInfo.contractAddress) }}
                        <CopyIcon
                          @click="copy(assetInfo.contractAddress)"
                          class="copy-icon"
                      /></span>
                    </td>
                  </tr>
                  <!-- IPFS Hash -->
                  <tr>
                    <td class="text-muted text-left small-12">
                      IPFS Hash
                    </td>
                    <td class="text-break">
                      <span class="text-primary d-flex align-items-center">
                        {{ assetInfo.ipfsHash || '-' }}
                        <CopyIcon
                          @click="copy(assetInfo.ipfsHash)"
                          class="copy-icon"
                          v-if="assetInfo.ipfsHash"
                      /></span>
                    </td>
                  </tr>
                  <!-- Blockchain -->
                  <tr>
                    <td class="text-muted text-left small-12">Blockchain</td>
                    <td class="text-break text-capitalize">
                      <img :src="getAccountIcon(chain)" class="asset-icon" />
                      {{ chain }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="px-4 mt-2" v-if="activeTab === 'activity'">
              <div class="account-container_transactions" v-if="filteredTransactions.length > 0">
                <ActivityFilter
                  @filters-changed="applyFilters"
                  :activity-data="activityData"
                  :showTypeFilters="true"
                />
                <TransactionList :transactions="filteredTransactions" />
              </div>
              <div class="account-container_transactions" v-else>
                <EmptyActivity
                  :active-network="activeNetwork"
                  :chain="chain"
                  :asset="asset"
                  :address="address"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else >
        <div class="account-container_transactions" v-if="filteredTransactions.length > 0">
          <ActivityFilter
            @filters-changed="applyFilters"
            :activity-data="activityData"
            :showTypeFilters="true"
          />
          <TransactionList :transactions="filteredTransactions" />
        </div>
        <div class="account-container_transactions" v-else>
          <EmptyActivity
            :active-network="activeNetwork"
            :chain="chain"
            :asset="asset"
            :address="address"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import cryptoassets from '@yaswap/wallet-core/dist/src/utils/cryptoassets'
import { getChain } from '@yaswap/cryptoassets'
import CopyIcon from '@/assets/icons/copy.svg'
import NavBar from '@/components/NavBar.vue'
import RefreshIcon from '@/assets/icons/refresh.svg'
import SendIcon from '@/assets/icons/arrow_send.svg'
import ReceiveIcon from '@/assets/icons/arrow_receive.svg'
import SwapIcon from '@/assets/icons/arrow_swap.svg'
import {
  prettyBalance,
  formatFiat,
  formatFiatUI
} from '@yaswap/wallet-core/dist/src/utils/coinFormatter'
import { shortenAddress } from '@yaswap/wallet-core/dist/src/utils/address'
import { getAddressExplorerLink } from '@yaswap/wallet-core/dist/src/utils/asset'
import { getAccountIcon } from '@/utils/accounts'
import { getAssetIcon, getAssetFullName, getAssetDescription, getAssetDocuments } from '@/utils/asset'
import TransactionList from '@/components/TransactionList'
import ActivityFilter from '@/components/ActivityFilter'
import { applyActivityFilters } from '@yaswap/wallet-core/dist/src/utils/history'
import EyeIcon from '@/assets/icons/eye.svg'
import BN from 'bignumber.js'
import { formatFontSize } from '@/utils/fontSize'
import { getAssetLengthLimitDisplay } from '@/utils/asset'
import EmptyActivity from '@/components/EmptyActivity'
import CopyAddress from '@/components/CopyAddress'
import amplitude from 'amplitude-js'
amplitude.getInstance().init('bf12c665d1e64601347a600f1eac729e')
import NFTThumbnailImage from '@/assets/nft_thumbnail.png'

export default {
  components: {
    NavBar,
    CopyIcon,
    RefreshIcon,
    SendIcon,
    ReceiveIcon,
    SwapIcon,
    ActivityFilter,
    TransactionList,
    EyeIcon,
    EmptyActivity,
    CopyAddress
  },
  data() {
    return {
      activeTab: 'overview',
      addressCopied: false,
      activityData: [],
      updatingBalances: false,
      address: null,
      showPopOver: true,
      tooltipDelay: { hide: 1000, show: 200 }
    }
  },
  props: ['accountId', 'asset'],
  computed: {
    ...mapGetters(['activity', 'accountItem']),
    ...mapState([
      'activeWalletId',
      'activeNetwork',
      'addresses',
      'history',
      'fiatRates',
      'marketData'
    ]),
    thumbnailImage() {
      return NFTThumbnailImage
    },
    account() {
      return this.accountItem(this.accountId)
    },
    documents() {
      return getAssetDocuments(this.asset)
    },
    fiat() {
      return this.account?.fiatBalances?.[this.asset] || BN(0)
    },
    balance() {
      return prettyBalance(this.account?.balances[this.asset] || 0, this.asset)
    },
    markets() {
      return this.marketData[this.activeNetwork][this.asset]
    },
    assetHistory() {
      return this.activity.filter((item) => {
        return (
          (item.from === this.asset || item.to === this.asset) && this.isNotNftTransaction(item)
        )
      })
    },
    addressLink() {
      if (this.account) {
        return getAddressExplorerLink(this.address, this.asset, this.activeNetwork)
      }
      return '#'
    },
    chain() {
      return cryptoassets[this.asset]?.chain
    },
    assetInfo() {
      return cryptoassets[this.asset]
    },
    filteredTransactions() {
      return this.activityData.filter((t) => {
        return (
          t.accountId === this.accountId ||
          t.fromAccountId === this.accountId ||
          t.toAccountId === this.accountId
        )
      })
    }
  },
  methods: {
    ...mapActions('app', ['trackAnalytics']),
    ...mapActions(['updateAccountBalance', 'getUnusedAddresses']),
    getAccountIcon,
    getAssetIcon,
    getAssetFullName,
    getAssetDescription,
    shortenAddress,
    formatFontSize,
    getAssetLengthLimitDisplay,
    formatFiat,
    formatFiatUI,
    isNotNftTransaction(item) {
      return item.type !== 'NFT'
    },
    async copy(text) {
      await navigator.clipboard.writeText(text)
    },
    async copyAddress() {
      await navigator.clipboard.writeText(this.address)
      this.addressCopied = true
      this.showPopOver = true
      setTimeout(() => {
        this.addressCopied = false
        this.showPopOver = false
      }, 4000)
    },
    async refresh() {
      if (this.updatingBalances) return
      this.updatingBalances = true
      await this.updateAccountBalance({
        network: this.activeNetwork,
        walletId: this.activeWalletId,
        accountId: this.accountId
      })
      this.updatingBalances = false
    },
    applyFilters(filters) {
      this.activityData = applyActivityFilters([...this.assetHistory], filters)
    },
    offsetToolTipDelay() {
      this.$nextTick(() => {
        this.tooltipDelay = { hide: 0, show: 0 }
      })
    },
    setInitialToolTipDelay() {
      this.$nextTick(() => {
        this.tooltipDelay = { hide: 1000, show: 200 }
      })
    },
    imageError(ref) {
      if (ref) {
        this.$refs[ref].src = this.thumbnailImage
      }
    }
  },
  async created() {
    const addresses = await this.getUnusedAddresses({
      network: this.activeNetwork,
      walletId: this.activeWalletId,
      assets: [this.asset],
      accountId: this.accountId
    })
    const chainId = cryptoassets[this.asset]?.chain
    this.address = getChain(this.activeNetwork, chainId).formatAddressUI(addresses[0])

    await this.refresh()
    this.activityData = [...this.assetHistory]
  },
  watch: {
    activeNetwork() {
      this.activityData = [...this.assetHistory]
    },
    activity() {
      this.activityData = [...this.assetHistory]
    }
  }
}
</script>
<style lang="scss">
.account-container {
  overflow-y: scroll;

  .account-content {
    overflow-y: auto;

    &-top {
      height: 220px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20px 0;
      background: $brand-gradient-primary;
      color: $color-text-secondary;
      text-align: center;
      position: relative;
    }
  }
  &_balance {
    &_fiat {
      min-height: 15px;
      margin-bottom: 6px;
    }
    &_value {
      line-height: 36px;
      margin-right: 8px;
      font-size: 30px;
    }
    &_code {
      font-size: $h3-font-size;
      line-height: 22px;
    }
  }
  &_refresh-icon {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 24px;
    height: 24px;
    cursor: pointer;
    path {
      fill: $color-text-secondary;
    }
  }
  &_actions {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
    &_button {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      width: 70px;
      border: 0;
      cursor: pointer;
      color: $color-text-secondary;
      background: none;
      font-weight: 600;
      font-size: 13px;
      &.disabled {
        opacity: 0.5;
        cursor: auto;
      }
      &_wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 44px;
        height: 44px;
        background: #ffffff;
        border-radius: 50%;
        margin-bottom: 4px;
      }
      &_icon {
        width: 16px;
        height: 16px;
      }
      &_swap {
        height: 30px;
      }
    }
  }
  &_address {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    button {
      font-size: $h4-font-size;
      font-weight: normal;
      color: $color-text-secondary;
      border: 0;
      background: none;
      outline: none;
    }
    .eye-btn {
      position: absolute;
      right: 60px;
      height: 40px;
      width: 35px;
      background-color: transparent;
      display: flex;
      align-items: center;
      svg {
        width: 20px;
      }
      &:hover {
        opacity: 0.8;
      }
    }
  }
  &_transactions {
    flex: 1;
    flex-basis: 0;
    overflow-y: scroll;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}

.nft-img {
  width: 50%;
  height: 50%;
  display: flex;
  justify-content: center;
  &__open {
    width: 50%;
    height: 50%;
    display: flex;
    justify-content: center;
  }

  img {
    height: 50%;
    object-fit: cover;
    border: 1px solid #c4c4c4 !important;
  }
}

.wallet-tabs {
  margin: 0;
  padding: 0;
}
.nav-tabs {
  height: 48px;
  cursor: pointer;
  border-bottom: none !important;

  .nav-item {
    width: 33%;
    height: 100%;
    margin-bottom: none !important;

    .nav-link {
      height: 100%;
      font-size: $font-size-sm;
      font-weight: 500;
      text-transform: uppercase;
      color: #646f85;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none !important;
      border-bottom: 1px solid $hr-border-color !important;
      padding: 0 !important;
      &.active,
      &:hover {
        color: #000d35 !important;
        font-weight: 600;
        border: none !important;
        border-bottom: 1px solid #1d1e21 !important;
      }
    }
  }
}

.wallet-tab-content {
  a {
    color: $color-text-primary;
  }
  a:hover {
    text-decoration: none;
  }

  .table {
    table {
      tr {
        padding: 12px 20px !important;
      }
    }
  }
}
</style>
