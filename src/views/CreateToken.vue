<template>
  <div class="create-token">
    <NavBar
      :showMenu="true"
      :showBack="true"
      backPath="/wallet"
      :backLabel="$t('common.overview')"
    >
      <span class="wallet_header">
        <strong>
          Create YA-token/YA-NFT
        </strong>
      </span>
    </NavBar>
    <div class="wrapper form">
      <div class="wrapper_top">
        <div class="form-group">
          <label for="token_type"> Select token type </label>
          <div class="dropdown">
            <button
              class="btn dropdown-toggle"
              id="select_token_type_dropdown"
              type="button"
              @click.stop="tokenTypeDropdownOpen = !tokenTypeDropdownOpen"
            >
              {{ tokenType }}
              <ChevronUpIcon v-if="tokenTypeDropdownOpen" />
              <ChevronDownIcon v-else />
            </button>
            <ul class="dropdown-menu" :class="{ show: tokenTypeDropdownOpen }">
              <li v-for="token_type in tokenTypeList" :key="token_type">
                <a
                  class="dropdown-item"
                  :id="`${token_type}`"
                  href="#"
                  @click="selectTokenType(token_type)"
                  :class="{ active: tokenType === token_type }"
                >
                  {{ token_type }}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <!-- YA-token -->
        <fieldset v-if="tokenType === 'YA-token'">
          <div class="form-group">
            <label for="token_name">Token name</label>
            <input
              type="text"
              v-model="tokenName"
              @input="(val) => (tokenName = tokenName.toUpperCase())"
              @change="tokenNameChange"
              class="form-control form-control-sm"
              id="token_name"
              :placeholder="`Token name`"
              autocomplete="off"
              required
            />
            <small
              v-if="tokenNameError"
              class="text-danger form-text"
              id="token_name_error"
              >{{ tokenNameError }}
            </small>
          </div>
          <div class="form-group">
            <label for="token_amount">Token amount</label>
            <input
              type="number"
              v-model.trim="tokenAmount"
              @change="verifyTokenAmount"
              class="form-control form-control-sm"
              :maxlength="10"
              id="token_amount"
              autocomplete="off"
              required
            />
            <small
              v-if="tokenAmountError"
              class="text-danger form-text"
              id="token_amount_error"
              >{{ tokenAmountError }}
            </small>
          </div>
          <div class="form-group">
            <label for="decimals">{{ $t('pages.customToken.decimals') }}</label>
            <input
              type="number"
              v-model.trim="decimals"
              @change="verifyDecimals"
              class="form-control form-control-sm"
              :maxlength="2"
              id="decimals"
              autocomplete="off"
              required
            />
            <small
              v-if="decimalsError"
              class="text-danger form-text"
              id="decimals_error"
              >{{ decimalsError }}
            </small>
          </div>
          <div class="form-group">
            <label for="reissuable">Reissuable</label> <input
              type="checkbox"
              value=""
              v-model="reissuable"
              id="reissuable"
            />
          </div>
          <div class="form-group">
            <label for="ipfs_hash">IPFS Hash</label>
            <input
              type="text"
              v-model="ipfsHash"
              @change="verifyIPFSHash"
              class="form-control form-control-sm"
              id="ipfs_hash"
              :placeholder="`IPFS Hash`"
              autocomplete="off"
            />
            <small
              v-if="ipfsHashError"
              class="text-danger form-text"
              id="ipfs_hash_error"
              >{{ ipfsHashError }}
            </small>
          </div>
        </fieldset>
        <!-- YA-NFT -->
        <fieldset v-else>
          <div class="form-group">
            <label for="token_name">NFT name</label>
            <input
              type="text"
              v-model="tokenName"
              @input="(val) => (tokenName = tokenName.toUpperCase())"
              @change="tokenNameChange"
              class="form-control form-control-sm"
              id="token_name"
              :placeholder="`NFT name`"
              autocomplete="off"
              required
            />
            <small
              v-if="tokenNameError"
              class="text-danger form-text"
              id="token_name_error"
              >{{ tokenNameError }}
            </small>
          </div>
          <div class="form-group">
            <label for="ipfs_hash">IPFS Hash</label>
            <input
              type="text"
              v-model="ipfsHash"
              @change="verifyIPFSHash"
              class="form-control form-control-sm"
              id="ipfs_hash"
              :placeholder="`IPFS Hash`"
              autocomplete="off"
            />
            <small
              v-if="ipfsHashError"
              class="text-danger form-text"
              id="ipfs_hash_error"
              >{{ ipfsHashError }}
            </small>
          </div>
        </fieldset>
      </div>
      <div class="wrapper_bottom">
        <div class="button-group">
          <router-link :to="`/settings/manage-assets`"
            ><button id="cancel_add_token_button" class="btn btn-light btn-outline-primary btn-lg">
              {{ $t('common.cancel') }}
            </button></router-link
          >
          <button
            id="add_token_button"
            class="btn btn-primary btn-lg"
            @click="addToken"
            :disabled="!canAdd"
          >
            Create {{ tokenType }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { debounce } from 'lodash-es'
import cryptoassets from '@yaswap/wallet-core/dist/src/utils/cryptoassets'
import NavBar from '@/components/NavBar.vue'
import ChevronDownIcon from '@/assets/icons/chevron_down.svg'
import ChevronUpIcon from '@/assets/icons/chevron_up.svg'
import { DuplicateTokenSymbolError } from '@yaswap/error-parser/dist/src/YaswapErrors/DuplicateTokenSymbolError'
import { errorToYaswapErrorString } from '@yaswap/error-parser/dist/src/utils'
import { reportYaswapError } from '@yaswap/error-parser'
import { validateIPFSHash } from '@yaswap/wallet-core/dist/src/utils/asset'

export default {
  components: {
    NavBar,
    ChevronDownIcon,
    ChevronUpIcon
  },
  data() {
    return {
      // NEW
      tokenType: 'YA-token',
      tokenTypeList: ['YA-token', 'YA-NFT'],
      tokenName: null,
      tokenAmount: 1,
      decimals: 0,
      reissuable: true,
      ipfsHash: null,
      tokenTypeDropdownOpen: false,
      creatingToken: false,

      // ERROR
      tokenNameError: null,
      tokenAmountError: null,
      decimalsError: null,
      ipfsHashError: null,

      // OLD
      contractAddress: '',
      name: null,
      symbol: null,
      chain: null
    }
  },
  computed: {
    ...mapState(['activeNetwork', 'accounts', 'activeWalletId', 'enabledAssets']),
    ...mapGetters(['accountsData']),
    networkAssets() {
      return this.enabledAssets[this.activeNetwork][this.activeWalletId]
    },
    isExistingNetworkAsset() {
      return Boolean(this.networkAssets.find((_symbol) => _symbol === this.tokenName))
    },
    canAdd() {
      if (
        !this.tokenName ||
        this.tokenNameError ||
        this.tokenAmountError ||
        this.decimalsError ||
        this.ipfsHashError
      )
        return false

      return true
    }
  },
  methods: {
    ...mapActions([
      'fetchTokenDetails'
    ]),
    async addToken() {
      if (!this.tokenNameError) {
        try {
          this.creatingToken = true
          // TODO: Call createToken (wallet-core) for Yacoin only
          // Add only if the token does not already exist

          // OLD FOR REFERENCE
          // await this.addCustomToken({
          //   network: this.activeNetwork,
          //   walletId: this.activeWalletId,
          //   chain: this.chain,
          //   contractAddress: this.contractAddress,
          //   name: this.name,
          //   symbol: this.symbol,
          //   decimals: Number(this.decimals)
          // })

          // const isChainEnabledForNative = this.accountsData.find(
          //   (account) => account.chain === this.chain
          // )

          // if (!isChainEnabledForNative) {
          //   await this.enableChain()
          // }

          // await this.enableAssets({
          //   network: this.activeNetwork,
          //   walletId: this.activeWalletId,
          //   assets: [this.symbol]
          // })

          this.$router.replace('/wallet')
        } catch (error) {
          const yaswapErrorString = errorToYaswapErrorString(error)
          reportYaswapError(error)
          return {
            error: yaswapErrorString
          }
        } finally {
          this.creatingToken = false
        }
      }
    },
    tokenNameChange(e) {
      this.$nextTick(() => {
        this.verifyTokenNameUnique()
        if (this.tokenType === 'YA-NFT') {
          this.verifyOwnerTokenExist()
        }
      })
    },
    resetFields() {
      // Reset Fields
      this.tokenName = null
      this.tokenAmount = 1
      this.decimals = 0
      this.reissuable = true
      this.ipfsHash = null

      // Reset Error
      this.tokenNameError = null
      this.tokenAmountError = null
      this.decimalsError = null
      this.ipfsHashError = null
    },
    verifyTokenNameUnique: debounce(async function () {
      // TODO: Add verification if the token name is unique
      if (
        (Object.keys(cryptoassets).includes(this.tokenName)) || this.isExistingNetworkAsset
      ) {
        this.tokenNameError = 'This token was already exist. Please specify another token name'
      } else {
        this.tokenNameError = null
      }
      // this.tokenNameError = ''

      // let customToken

      // if (this.existingAsset) {
      //   customToken = this.existingAsset
      // } else if (this.activeNetwork === 'mainnet' && this.contractAddress) {
      //   const { symbol, name, decimals } = await this.fetchTokenDetails({
      //     network: this.activeNetwork,
      //     walletId: this.activeWalletId,
      //     chain: this.chain,
      //     contractAddress: this.contractAddress
      //   })

      //   customToken = {
      //     symbol,
      //     name,
      //     decimals: parseInt(decimals),
      //     chain: this.chain
      //   }
      // }

      // if (customToken) {
      //   this.symbol = customToken.symbol
      //   this.name = customToken.name
      //   this.decimals = customToken.decimals
      // }
    }, 500),
    verifyOwnerTokenExist: debounce(async function () {
      // TODO: Add verification if the wallet has the Owner token to create corresponding YA-NFT
      // this.tokenNameError = ''

      // let customToken

      // if (this.existingAsset) {
      //   customToken = this.existingAsset
      // } else if (this.activeNetwork === 'mainnet' && this.contractAddress) {
      //   const { symbol, name, decimals } = await this.fetchTokenDetails({
      //     network: this.activeNetwork,
      //     walletId: this.activeWalletId,
      //     chain: this.chain,
      //     contractAddress: this.contractAddress
      //   })

      //   customToken = {
      //     symbol,
      //     name,
      //     decimals: parseInt(decimals),
      //     chain: this.chain
      //   }
      // }

      // if (customToken) {
      //   this.symbol = customToken.symbol
      //   this.name = customToken.name
      //   this.decimals = customToken.decimals
      // }
    }, 500),
    async selectTokenType(tokenType) {
      this.tokenType = tokenType
      this.tokenTypeDropdownOpen = false
      this.resetFields()
    },
    verifyTokenAmount(e) {
      // The Token Amount field can only have 10 digits (1 - 2,000,000,000) and must be a number
      if (isNaN(this.tokenAmount) || this.tokenAmount < 1 || this.tokenAmount > 2000000000) {
        this.tokenAmountError = "Token Amount must be in range of 1->2000000000"
      } else {
        this.tokenAmountError = null
      }
      console.log('TACA ===> this.tokenAmount = ', this.tokenAmount)
    },
    verifyDecimals(e) {
      // The Decimals field can only have 2 digits (0 - 6) and must be a number
      if (isNaN(this.decimals) || this.decimals < 0 || this.decimals > 6) {
        this.decimalsError = "Decimals must be in range of 0->6"
      } else {
        this.decimalsError = null
      }
      console.log('TACA ===> this.decimals = ', this.decimals)
    },
    verifyIPFSHash(e) {
      // TODO: Verify IPFS Hash
      console.log('TACA ===> this.ipfsHash = ', this.ipfsHash)
      if (!this.ipfsHash) {
        this.ipfsHashError = null
      } else {
        this.ipfsHashError = validateIPFSHash(this.ipfsHash)
      }
      console.log('TACA ===> this.ipfsHashError = ', this.ipfsHashError)
    }
  }
}
</script>

<style lang="scss">
.create-token {
  display: flex;
  flex-direction: column;
  min-height: 0;
  line-height: 1; // FIXME: This is just a workaround for overflow text warning area

  .form-group {
    margin-bottom: 20px; // FIXME: This is just a workaround for overflow text warning area
  }

  .dropdown {
    .dropdown-menu {
      min-width: 2rem;
      border: 1px solid #d9dfe5;
      border-radius: 0;
      padding: 0;
      margin: 0;
    }
    .dropdown-item {
      height: 30px;
      display: flex;
      align-items: center;
      padding-left: 10px;
      padding-right: 10px;
      &:not(:last-child) {
        border-bottom: 1px solid $hr-border-color;
      }

      &:hover,
      &.active {
        background-color: #f0f7f9;
        color: $color-text-primary;
      }
    }
  }

  .dropdown-toggle {
    text-transform: capitalize;
    padding-left: 0 !important;
    font-weight: 300;
    display: flex;
    align-items: center;

    &::after {
      display: none;
    }

    svg {
      width: 8px;
      height: 4px;
      margin-left: 2px;
    }
  }
}
</style>
