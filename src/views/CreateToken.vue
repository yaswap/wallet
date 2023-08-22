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
          <small
              v-if="balanceError"
              class="text-danger form-text"
              id="balance_error"
              >{{ balanceError }}
            </small>
            <small
              v-else
              class="text-danger form-text"
              id="warning"
              >{{ warningMessage }}
            </small>
        </div>
        <!-- YA-Token -->
        <fieldset v-if="tokenType === 'YA-Token'">
          <div class="form-group">
            <label class="field-label" for="token_name">Token name
              <v-popover
                trigger="click"
                :hideOnTargetClick="false"
                placement="top"
                offset="0"
                popoverClass="vue-tooltip-theme"
                popoverBaseClass="tooltip open-top-info"
              >
                <InfoIcon v-tooltip="{ content: '<p><b>Mandatory field</b><br><i>Click for more info</i></p>', placement: 'bottom', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>{{ tokenNameInfo }}</p>
                  </span>
                </template>
              </v-popover>
            </label>
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
            <label class="field-label" for="token_amount">Token amount
              <v-popover
                trigger="click"
                :hideOnTargetClick="false"
                placement="top"
                offset="0"
                popoverClass="vue-tooltip-theme"
                popoverBaseClass="tooltip"
              >
                <InfoIcon v-tooltip="{ content: '<p><b>Mandatory field (default=1)</b><br><i>Click for more info</i></p>', placement: 'bottom', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>{{ tokenAmountInfo }}</p>
                  </span>
                </template>
              </v-popover>
            </label>
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
            <label class="field-label" for="decimals">{{ $t('pages.customToken.decimals') }}
              <v-popover
                trigger="click"
                :hideOnTargetClick="false"
                placement="top"
                offset="0"
                popoverClass="vue-tooltip-theme"
                popoverBaseClass="tooltip"
              >
                <InfoIcon v-tooltip="{ content: '<p><b>Mandatory field (default=0)</b><br><i>Click for more info</i></p>', placement: 'bottom', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>{{ tokenDecimalsInfo }}</p>
                  </span>
                </template>
              </v-popover>
            </label>
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
            <label class="field-label" for="reissuable">Reissuable
              <v-popover
                trigger="click"
                :hideOnTargetClick="false"
                placement="top"
                offset="0"
                popoverClass="vue-tooltip-theme"
                popoverBaseClass="tooltip"
              >
                <InfoIcon v-tooltip="{ content: '<p><b>Mandatory field (default=true)</b><br><i>Click for more info</i></p>', placement: 'bottom', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>{{ reissuableInfo }}</p>
                  </span>
                </template>
              </v-popover>
            </label> <input
              type="checkbox"
              value=""
              v-model="reissuable"
              id="reissuable"
            />
          </div>
          <div class="form-group">
            <label class="field-label" for="ipfs_hash">IPFS Hash
              <v-popover
                trigger="click"
                :hideOnTargetClick="false"
                placement="top"
                offset="0"
                popoverClass="vue-tooltip-theme"
                popoverBaseClass="tooltip open-top-info"
              >
                <InfoIcon v-tooltip="{ content: '<p><b>Optional field (empty by default)</b><br><i>Click for more info</i></p>', placement: 'bottom', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>{{ ipfsHashInfo }}</p>
                    <p>The standard metadata JSON file can be created <router-link :to="{ name: 'CreateMetadataFile', params: { from: currentRoutePath } }">here</router-link>. After having the metadata JSON file, you upload it to IPFS services such as <a href="https://ravencoinipfs.com/" target="_blank">ravencoinipfs</a> to get the IPFS Hash.</p>
                  </span>
                </template>
              </v-popover>
            </label>
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
            <label class="field-label" for="token_name">NFT name
              <v-popover
                trigger="click"
                :hideOnTargetClick="false"
                placement="bottom"
                offset="0"
                popoverClass="vue-tooltip-theme"
                popoverBaseClass="tooltip"
              >
              <InfoIcon v-tooltip="{ content: '<p><b>Mandatory field</b><br><i>Click for more info</i></p>', placement: 'bottom', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>{{ nftNameInfo }}</p>
                  </span>
                </template>
              </v-popover>
            </label>
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
            <label class="field-label" for="ipfs_hash">IPFS Hash
              <v-popover
                trigger="click"
                :hideOnTargetClick="false"
                placement="top"
                offset="0"
                popoverClass="vue-tooltip-theme"
                popoverBaseClass="tooltip open-top-info"
              >
              <InfoIcon v-tooltip="{ content: '<p><b>Optional field (empty by default)</b><br><i>Click for more info</i></p>', placement: 'bottom', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>{{ ipfsHashInfo }}</p>
                    <p>The standard metadata JSON file can be created <router-link :to="{ name: 'CreateMetadataFile', params: { from: currentRoutePath } }">here</router-link>. After having the metadata JSON file, you upload it to IPFS services such as <a href="https://ravencoinipfs.com/" target="_blank">ravencoinipfs</a> to get the IPFS Hash.</p>
                  </span>
                </template>
              </v-popover>
            </label>
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
          <button
            id="cancel_add_token_button"
            class="btn btn-light btn-outline-primary btn-lg"
            @click="cancelCreate"
          >
            {{ $t('common.cancel') }}
          </button>
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
import BN from 'bignumber.js'
import cryptoassets from '@yaswap/wallet-core/dist/src/utils/cryptoassets'
import { unitToCurrency, ChainId } from '@yaswap/cryptoassets'
import NavBar from '@/components/NavBar.vue'
import ChevronDownIcon from '@/assets/icons/chevron_down.svg'
import ChevronUpIcon from '@/assets/icons/chevron_up.svg'
import InfoIcon from '@/assets/icons/info.svg'
import { DuplicateTokenSymbolError } from '@yaswap/error-parser/dist/src/YaswapErrors/DuplicateTokenSymbolError'
import { errorToYaswapErrorString } from '@yaswap/error-parser/dist/src/utils'
import { reportYaswapError } from '@yaswap/error-parser'
import { getFeeAsset, getNativeAsset, verifyIPFSHash, isAvailableTokenName } from '@yaswap/wallet-core/dist/src/utils/asset'

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
import { timelockFeeDuration, timelockFeeAmountInSatoshis } from '@/utils/asset'

export default {
  components: {
    NavBar,
    ChevronDownIcon,
    ChevronUpIcon,
    InfoIcon,
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

      // ENABLE
      enableIPFSHashInfo: false,

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
    timelockFeeDuration,
    timelockFeeAmountInSatoshis,
    currentRoutePath() {
      return this.$route.path
    },
    account() {
      // TODO: Support other chains
      return this.accounts[this.activeWalletId][this.activeNetwork].find((acc) => acc.chain === ChainId.Yacoin)
    },
    accountAssets() {
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
      return getFeeAsset(this.asset) || getNativeAsset(this.asset)
    },
    assetFees() {
      const assetFees = {}

      const fees = this.suggestedFeePrices(this.assetChain)
      if (fees) {
        Object.assign(assetFees, fees)
      }

      return assetFees
    },
    fee() {
      return this.assetFees['average'].fee
    },
    balance() {
      return this.account?.balances[this.asset] || 0
    },
    balanceError() {
      if (Number(this.balance) < this.timelockFeeAmountInSatoshis) {
        return `You don't have enough ${this.asset} in wallet to create ${this.tokenType} (need at least ${this.timelockFeeAmountInSatoshis/1e6} ${this.asset} for the timelock fee)`
      }
      return null
    },
    warningMessage() {
      return `Warning: In order to create ${this.tokenType}, ${this.timelockFeeAmountInSatoshis/1e6} ${this.asset} will be locked during ${this.timelockFeeDuration} blocks`
    },
    canAdd() {
      if (
        !this.tokenName ||
        this.tokenNameError ||
        this.tokenAmountError ||
        this.decimalsError ||
        this.ipfsHashError ||
        this.balanceError
      )
        return false

      return true
    },
    tokenNameInfo() {
      return `1) You need to input a valid YA-Token name which follows below specification:\n+ YA-Token name must have at least ${MIN_TOKEN_NAME_LENGTH} characters and maximum name length is ${MAX_TOKEN_NAME_LENGTH} characters.\n+ Valid characters are: A-Z 0-9 _ . /\n+ Special characters (_ . /) can't be the first or last character. More than one of these special characters also cannot be next to one another.\n2) The YA-Token name must be unique.\n3) Each YA-Token has a corresponding owner token. The owner token is used to create sub YA-Token or YA-NFT which belongs to the YA-Token. The owner token is created at the same time as the YA-Token. The owner token name is in the form of an exclamation point (!) coming after whatever you named your YA-Token.\n4) If the name has character '/', it means that you are creating sub YA-Token and there are some special notes:\n+ The sub YA-Token name is in the form of [YA-Token name]/[sub-portion]\n+ The [sub-portion] must be at least 1 letter\n+ Valid characters in [sub-portion] follow the same specification as above.\n+ In order to create a sub YA-Token, you must have the owner token of the YA-Token which this sub YA-Token belongs to.\n+ Sub YA-Token also has a corresponding owner token. The owner token is used to create YA-NFT which belongs to the sub YA-Token.`
    },
    tokenAmountInfo() {
      return `Token Amount must be in the range of 1->2000000000.`
    },
    tokenDecimalsInfo() {
      return `Decimals must be in the range of 0->6.`
    },
    reissuableInfo() {
      return `Reissuable YA-Token means that you can change the decimals, IPFS Hash or create more tokens in the future.`
    },
    ipfsHashInfo() {
      return `1) The IPFS Hash CAN point to any resource (image, video, pdf file, JSON file,...)\n2) It is a recommendation that the IPFS Hash SHOULD point to a JSON file containing metadata for the ${this.tokenType} that is being created. The metadata JSON file can contain any info about the ${this.tokenType}. There is some token info which Yaswap wallet gets from the metadata JSON file and displays:\n+ name: This is different from the ${this.tokenType} name. This name can be used to give full idea about the ${this.tokenType} is being created in case the ${this.tokenType} name is too short\n+ description: This info can be used to describe the usage of the ${this.tokenType} that is being created.\n+ image: A URI or an IPFS Hash pointing to an image (images are resource with mime type image/*). If it is IPFS Hash, use the format ipfs://<IPFS_HASH>`
    },
    nftNameInfo() {
      return `1) You need to input a valid YA-NFT name which follows below specification:\n+ The full YA-NFT name must have at least ${MIN_TOKEN_NAME_LENGTH} characters and maximum name length is ${MAX_TOKEN_NAME_LENGTH} characters.\n+ The full YA-NFT name is in the form of [YA-Token name or sub YA-Token name]#[YA-NFT portion]\n+ The [YA-NFT portion] must be at least 1 letter.\n+ Valid characters for [YA-Token name or sub YA-Token name] are: A-Z 0-9 _ . /\n+ Valid characters for [YA-NFT portion] are: A-Z a-z 0-9 @ $ % & * ( ) [ ] { } _ . ? : -\n+ Special characters (_ . /) in [YA-Token name or sub YA-Token name] can't be the first or last characters. More than one of these special characters also cannot be next to one another.\n2) The YA-NFT name must be unique.\n3) In order to create YA-NFT, you must have the owner token of the YA-Token or the sub YA-Token which this YA-NFT belongs to.`
    },
  },
  async created() {
    await this.updateFees({ asset: this.assetChain })
    const storageData = localStorage.getItem('createTokenData')
    if (storageData) {
      this.initFormDataState(storageData)
      await this.verifyAll();
    }
  },
  beforeRouteLeave(to, from, next) {
    this.saveFormDataState()
    next();
  },
  methods: {
    ...mapActions([
      'createToken',
      'fetchTokenDetails',
      'updateFees'
    ]),
    initFormDataState(storageData){
      const formData = JSON.parse(storageData || '');
      if(formData){
        this.tokenType = formData.tokenType;
        this.tokenName = formData.tokenName;
        this.tokenAmount = formData.tokenAmount;
        this.decimals = formData.decimals;
        this.reissuable = formData.reissuable;
        this.ipfsHash = formData.ipfsHash;
      }
    },
    saveFormDataState(){
      const createTokenData = {
        tokenType: this.tokenType,
        tokenName: this.tokenName,
        tokenAmount: this.tokenAmount,
        decimals: this.decimals,
        reissuable: this.reissuable,
        ipfsHash: this.ipfsHash
      }
      const formData = JSON.stringify(createTokenData);
      localStorage.setItem('createTokenData', formData);
    },
    displayIPFSHashInfo() {
      this.enableIPFSHashInfo = !this.enableIPFSHashInfo
    },
    cancelCreate() {
      this.resetFields()
      this.$router.replace('/wallet')
    },
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
          fee: this.fee,
          tokenType: this.tokenType,
          tokenName: this.tokenName,
          tokenAmount: this.tokenAmount,
          decimals: this.decimals,
          reissuable: this.reissuable,
          ipfsHash: this.rawIpfsHash,
        })

        this.resetFields()
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
    async verifyAll() {
      await this.tokenNameChange();
      this.verifyTokenAmount();
      this.verifyDecimals();
      this.verifyIPFSHash();
    },
    async tokenNameChange(e) {
      this.tokenNameError = null
      this.saveFormDataState()
      if (!this.tokenName) {
        return
      }

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
    isTokenNameFollowSpec(tokenName) {
      // Sanity check if it isn't a YA-Token name
      if (tokenName.indexOf(UNIQUE_TAG_DELIMITER) !== -1) {
        this.tokenNameError = 'You are creating YA-NFT (having # in the token name). Please select token type = YA-NFT to create it.'
        return false
      }

      // Check name length
      if (tokenName.length < MIN_TOKEN_NAME_LENGTH) {
        this.tokenNameError = `Name must have at least ${MIN_TOKEN_NAME_LENGTH} characters.`
        return false
      }

      if (tokenName.length > MAX_TOKEN_NAME_LENGTH) {
        this.tokenNameError = `Name is greater than max length of ${MAX_TOKEN_NAME_LENGTH}.`
        return false
      }

      // Check if the name contains invalid characters
      const tokenNameParts = tokenName.split(SUB_NAME_DELIMITER)
      for (const index in tokenNameParts) {
        if (
            (index == 0 && !this.isYatokenNameValid(tokenNameParts[index])) ||
            (index > 0 && !this.isSubNameValid(tokenNameParts[index]))
          ) {
            this.tokenNameError = `Name contains invalid characters.`
            return false
          }

          if (!this.isSpecialCharacterValid(tokenNameParts[index])) {
            this.tokenNameError = `Special characters (_ . /) can't be the first or last characters. More than one of these special characters also cannot be next to one another.`
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

      // Check name length
      if (this.tokenName.length < MIN_NFT_NAME_LENGTH) {
        this.tokenNameError = `Name must have at least ${MIN_NFT_NAME_LENGTH} characters.`
        return false
      }

      if (this.tokenName.length > MAX_NFT_NAME_LENGTH) {
        this.tokenNameError = `Name is greater than max length of ${MAX_NFT_NAME_LENGTH}.`
        return false
      }

      // Check if the name contains invalid characters
      const tokenNameParts = this.tokenName.split(UNIQUE_TAG_DELIMITER)
      if (tokenNameParts.length >= 3) {
        this.tokenNameError = `Name can only have one charater ${UNIQUE_TAG_DELIMITER}.`
        return false
      }

      if (!this.isTokenNameFollowSpec(tokenNameParts[0])) {
        return false
      } else if (!this.isNFTNameValid(tokenNameParts[1])) {
        this.tokenNameError = `YA-NFT portion contains invalid characters.`
        return false
      }

      return true
    },
    async isTokenNameUnique() {
      // Verify if the token name is unique
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
      // Workaround for displaying sub YA-token
      const modifiedOwnerTokenName = ownerTokenName.split('/').join('|')
      const parentToken = ownerTokenName.slice(0, -1)
      if (this.accountAssets.includes(modifiedOwnerTokenName)) {
        this.tokenNameError = null
      } else {
        this.tokenNameError = this.tokenType === 'YA-NFT' ?
          `You don't have the owner token of YA-Token ${parentToken}. You need it to create YA-NFT which belong to ${parentToken} NFT collection.` :
          `You don't have the owner token of YA-Token ${parentToken}. You need it to create sub YA-Token which belong to ${parentToken}`
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
      this.saveFormDataState()
      // The Token Amount field can only have 10 digits (1 - 2,000,000,000) and must be a number
      if (isNaN(this.tokenAmount) || this.tokenAmount < 1 || this.tokenAmount > 2000000000) {
        this.tokenAmountError = this.tokenAmountInfo
      } else {
        this.tokenAmountError = null
      }
    },
    verifyDecimals(e) {
      this.saveFormDataState()
      // The Decimals field can only have 2 digits (0 - 6) and must be a number
      if (isNaN(this.decimals) || this.decimals < 0 || this.decimals > 6) {
        this.decimalsError = this.tokenDecimalsInfo
      } else {
        this.decimalsError = null
      }
    },
    verifyIPFSHash(e) {
      this.saveFormDataState()
      // Verify IPFS Hash
      if (!this.ipfsHash) {
        this.ipfsHashError = null
      } else {
        const [rawIpfsHash, error] = verifyIPFSHash(this.ipfsHash)
        this.ipfsHashError = error
        this.rawIpfsHash = rawIpfsHash
      }
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
    margin-bottom: 5%; // FIXME: This is just a workaround for overflow text warning area
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

  .field-label {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    svg {
      height: 18px;
      width: $wrapper-padding;
      object-fit: cover;
      margin-right: 10px;
    }
  }
}
.tooltip-inner {
  max-width: 100%;
  text-align: left;
  line-height: 1.3;
  justify-content: flex-start;
}
.tooltip-arrow {
  z-index: 0;
}
.open-top-info {
  position: absolute !important;
  will-change: transform !important;
  top: 0px !important;
  left: 0px !important;
  transform: translate3d(0px, 0px, 0px) !important;

}
</style>
