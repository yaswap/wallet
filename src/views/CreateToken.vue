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
          Create YA-Token/YA-NFT
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
        <!-- YA-Token -->
        <fieldset v-if="tokenType === 'YA-Token'">
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
              style="white-space: pre-line;"
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
              style="white-space: pre-line;"
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
import { ChainId } from '@yaswap/cryptoassets'
import NavBar from '@/components/NavBar.vue'
import ChevronDownIcon from '@/assets/icons/chevron_down.svg'
import ChevronUpIcon from '@/assets/icons/chevron_up.svg'
import { DuplicateTokenSymbolError } from '@yaswap/error-parser/dist/src/YaswapErrors/DuplicateTokenSymbolError'
import { errorToYaswapErrorString } from '@yaswap/error-parser/dist/src/utils'
import { reportYaswapError } from '@yaswap/error-parser'
import { verifyIPFSHash, isAvailableTokenName } from '@yaswap/wallet-core/dist/src/utils/asset'

const MIN_TOKEN_NAME_LENGTH = 3
const MAX_TOKEN_NAME_LENGTH = 30
const MIN_NFT_NAME_LENGTH = MIN_TOKEN_NAME_LENGTH
const MAX_NFT_NAME_LENGTH = MAX_TOKEN_NAME_LENGTH + 1

const YATOKEN_NAME_CHARACTERS = new RegExp("^[A-Z0-9._]{3,}$")
const SUB_NAME_CHARACTERS = new RegExp("^[A-Z0-9._]+$")
const UNIQUE_TAG_CHARACTERS = new RegExp("^[-A-Za-z0-9@$%&*()[\\]{}_.?:]+$")

const DOUBLE_PUNCTUATION = new RegExp("^.*[._]{2,}.*$")
const LEADING_PUNCTUATION = new RegExp("^[._].*$")
const TRAILING_PUNCTUATION = new RegExp("^.*[._]$")

const SUB_NAME_DELIMITER = "/"
const UNIQUE_TAG_DELIMITER = "#";

const YACOIN_NAMES = new RegExp("^YAC$|^YACOIN$|^#YAC$|^#YACOIN$")

export default {
  components: {
    NavBar,
    ChevronDownIcon,
    ChevronUpIcon
  },
  data() {
    return {
      // NEW
      tokenType: 'YA-Token',
      tokenTypeList: ['YA-Token', 'YA-NFT'],
      tokenName: null,
      tokenAmount: 1,
      decimals: 0,
      reissuable: true,
      ipfsHash: null,
      rawIpfsHash: null,
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
    ...mapGetters(['accountsData', 'suggestedFeePrices']),
    account() {
      // TODO: Support other chains
      return this.accounts[this.activeWalletId][this.activeNetwork].find((acc) => acc.chain === ChainId.Yacoin)
    },
    accountAssets() {
      console.log('yacoinAccount = ', this.account)
      console.log('yacoinAccount.assets = ', this.account.assets)
      return this.account.assets
    },
    isExistingAsset() {
      return this.accountAssets.includes(this.tokenName)
    },
    asset() {
      // TODO: Support other chains
      return 'YAC'
    },
    assetChain() {
      return this.asset
    },
    assetFees() {
      const assetFees = {}

      const fees = this.suggestedFeePrices(this.assetChain)
      if (fees) {
        Object.assign(assetFees, fees)
      }

      return assetFees
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
      'createToken',
      'fetchTokenDetails'
    ]),
    async addToken() {
      try {
        this.creatingToken = true
        if (this.tokenType === 'YA-NFT') {
          this.tokenAmount = 1
          this.decimals = 0
          this.reissuable = false
        }
        await this.createToken({
          network: this.activeNetwork,
          walletId: this.activeWalletId,
          accountId: this.account.id,
          asset: this.asset,
          tokenType: this.tokenType,
          tokenName: this.tokenName,
          tokenAmount: this.tokenAmount,
          decimals: this.decimals,
          reissuable: this.reissuable,
          ipfsHash: this.rawIpfsHash,
        })

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
    async tokenNameChange(e) {
      this.tokenNameError = null
      if (this.tokenType === 'YA-Token') {
        const subDeliLastIndex = this.tokenName.lastIndexOf(SUB_NAME_DELIMITER)
        if (subDeliLastIndex === -1) { // YA-Token
          return this.isTokenNameFollowSpec(this.tokenName) && await this.isTokenNameUnique()
        } else { // sub YA-Token
          const ownerTokenName = this.tokenName.slice(0, subDeliLastIndex) + '!'
          return this.isTokenNameFollowSpec(this.tokenName) && await this.isTokenNameUnique()&& this.isOwnerTokenExist(ownerTokenName)
        }
      } else { // YA-NFT
        const ownerTokenName = this.tokenName.split(UNIQUE_TAG_DELIMITER)[0] + '!'
        return this.isNFTNameFollowSpec() && await this.isTokenNameUnique() && this.isOwnerTokenExist(ownerTokenName)
      }
    },
    isYatokenNameValid(name) {
      return name.match(YATOKEN_NAME_CHARACTERS)
        && !name.match(YACOIN_NAMES)
    },
    isSubNameValid(name) {
      return name.match(SUB_NAME_CHARACTERS)
    },
    isNFTNameValid(name) {
      return name.match(UNIQUE_TAG_CHARACTERS)
    },
    isSpecialCharacterValid(name) {
      return !name.match(DOUBLE_PUNCTUATION)
        && !name.match(LEADING_PUNCTUATION)
        && !name.match(TRAILING_PUNCTUATION)
    },
    isTokenNameFollowSpec(tokenName, nameSpec) {
      // Sanity check if it isn't a YA-Token name
      if (tokenName.indexOf(UNIQUE_TAG_DELIMITER) !== -1) {
        this.tokenNameError = 'You are creating YA-NFT (having # in the token name). Please select token type = YA-NFT to create it.'
        return false
      }

      const fullNameSpec = nameSpec || `\n\nFull name specification\n1) Name must have at least ${MIN_TOKEN_NAME_LENGTH} characters and maximum name length is ${MAX_TOKEN_NAME_LENGTH} characters.\n2) Valid characters are: A-Z 0-9 _ . /\n3) Special characters (_ . /) can't be the first or last characters. More than one of these special characters also cannot be next to one another.`

      // Check name length
      if (tokenName.length < MIN_TOKEN_NAME_LENGTH) {
        this.tokenNameError = `Name must have at least ${MIN_TOKEN_NAME_LENGTH} characters.` + fullNameSpec
        return false
      }

      if (tokenName.length > MAX_TOKEN_NAME_LENGTH) {
        this.tokenNameError = `Name is greater than max length of ${MAX_TOKEN_NAME_LENGTH}.` + fullNameSpec
        return false
      }

      // Check if the name contains invalid characters
      const tokenNameParts = tokenName.split(SUB_NAME_DELIMITER)
      for (const index in tokenNameParts) {
        console.log('TACA ===> isTokenNameFollowSpec, tokenNameParts[', index, '] = ', tokenNameParts[index])
        if (
            (index == 0 && !this.isYatokenNameValid(tokenNameParts[index])) ||
            (index > 0 && !this.isSubNameValid(tokenNameParts[index]))
          ) {
            this.tokenNameError = `Name contains invalid characters.` + fullNameSpec
            return false
          }

          if (!this.isSpecialCharacterValid(tokenNameParts[index])) {
            this.tokenNameError = `Special characters (_ . /) can't be the first or last characters. More than one of these special characters also cannot be next to one another.` + fullNameSpec
            return false
          }
      }

      if (this.tokenNameError) {
        return false
      }
      return true
    },
    isNFTNameFollowSpec() {
      // Sanity check if it isn't a YA-NFT name
      if (this.tokenName.indexOf(UNIQUE_TAG_DELIMITER) === -1) {
        this.tokenNameError = `Must have character ${UNIQUE_TAG_DELIMITER} in the NFT name.`
        return false
      }

      const fullNameSpec = `\n\nFull name specification\n1) Name must have at least ${MIN_TOKEN_NAME_LENGTH} characters and maximum name length is ${MAX_TOKEN_NAME_LENGTH} characters.\n2) The full YA-NFT name takes the form [YA-Token name]#[YA-NFT portion].\n3) Valid characters for YA-Token name are: A-Z 0-9 _ . /\n4) Valid characters for YA-NFT portion are: A-Z a-z 0-9 @ $ % & * ( ) [ ] { } _ . ? : -\n5) Special characters for YA-Token name (_ . /) can't be the first or last characters. More than one of these special characters also cannot be next to one another.`

      // Check name length
      if (this.tokenName.length < MIN_NFT_NAME_LENGTH) {
        this.tokenNameError = `Name must have at least ${MIN_NFT_NAME_LENGTH} characters.` + fullNameSpec
        return false
      }

      if (this.tokenName.length > MAX_NFT_NAME_LENGTH) {
        this.tokenNameError = `Name is greater than max length of ${MAX_NFT_NAME_LENGTH}.` + fullNameSpec
        return false
      }

      // Check if the name contains invalid characters
      const tokenNameParts = this.tokenName.split(UNIQUE_TAG_DELIMITER)
      if (tokenNameParts.length >= 3) {
        this.tokenNameError = `Name can only have one charater ${UNIQUE_TAG_DELIMITER}.` + fullNameSpec
        return false
      }

      if (!this.isTokenNameFollowSpec(tokenNameParts[0], fullNameSpec)) {
        return false
      } else if (!this.isNFTNameValid(tokenNameParts[1])) {
        this.tokenNameError = `YA-NFT portion contains invalid characters.` + fullNameSpec
        return false
      }

      return true
    },
    async isTokenNameUnique() {
      // Verify if the token name is unique
      console.log('TACA ===> isTokenNameUnique, this.tokenName = ', this.tokenName)
      if (
        (Object.keys(cryptoassets).includes(this.tokenName)) ||
        this.isExistingAsset ||
        !await isAvailableTokenName(this.tokenName, this.activeNetwork)
      ) {
        this.tokenNameError = 'This token was already exist. Please specify another token name.'
      } else {
        this.tokenNameError = null
      }

      if (this.tokenNameError) {
        return false
      }
      return true
    },
    isOwnerTokenExist(ownerTokenName) {
      // Verify if the wallet has the Owner token to create corresponding YA-NFT
      console.log('TACA ===> isOwnerTokenExist, ownerTokenName = ', ownerTokenName)
      const parentToken = ownerTokenName.slice(0, -1)
      if (this.accountAssets.includes(ownerTokenName)) {
        this.tokenNameError = null
      } else {
        this.tokenNameError = `You don't have the owner token of YA-Token ${parentToken}. You need it to create YA-NFT which belong to ${parentToken} NFT collection.`
      }

      if (this.tokenNameError) {
        return false
      }
      return true
    },
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
      // Verify IPFS Hash
      console.log('TACA ===> this.ipfsHash = ', this.ipfsHash)
      if (!this.ipfsHash) {
        this.ipfsHashError = null
      } else {
        const [rawIpfsHash, error] = verifyIPFSHash(this.ipfsHash)
        this.ipfsHashError = error
        this.rawIpfsHash = rawIpfsHash
      }
      console.log('TACA ===> this.ipfsHashError = ', this.ipfsHashError)
      console.log('TACA ===> this.rawIpfsHash = ', this.rawIpfsHash)
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
