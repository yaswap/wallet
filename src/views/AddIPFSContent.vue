<template>
  <div class="add-ipfs-content">
    <NavBar
      :showMenu="true"
      :showBack="true"
      backPath="/wallet"
      :backLabel="$t('common.overview')"
    >
      <span class="wallet_header">
        <strong>
          Add IPFS content
        </strong>
      </span>
    </NavBar>
    <div class="wrapper form">
      <div class="wrapper_top">
        <div class="form-group">
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

        <div class="form-group">
          <input type="file" @change="uploadFile" ref="file">
        </div>
      </div>
      <div class="wrapper_bottom">
        <div class="button-group">
          <button
            id="cancel_add_ipfs_button"
            class="btn btn-light btn-outline-primary btn-lg"
            @click="cancelCreate"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            id="add_ipfs_button"
            class="btn btn-primary btn-lg"
            @click="submitFile"
          >
            Add IPFS content
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import cryptoassets from '@yaswap/wallet-core/dist/src/utils/cryptoassets'
import { ChainId } from '@yaswap/cryptoassets'
import NavBar from '@/components/NavBar.vue'
import ChevronDownIcon from '@/assets/icons/chevron_down.svg'
import ChevronUpIcon from '@/assets/icons/chevron_up.svg'
import InfoIcon from '@/assets/icons/info.svg'
import { errorToYaswapErrorString } from '@yaswap/error-parser/dist/src/utils'
import { reportYaswapError } from '@yaswap/error-parser'
import { getFeeAsset, getNativeAsset, verifyIPFSHash, isAvailableTokenName } from '@yaswap/wallet-core/dist/src/utils/asset'
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
      // Uploaded file
      uploadedFile: null,
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
        return `You don't have enough ${this.asset} in wallet to add IPFS content (need at least ${this.timelockFeeAmountInSatoshis/1e6} ${this.asset} for the timelock fee)`
      }
      return null
    },
    warningMessage() {
      return `Warning: In order to add IPFS content, ${this.timelockFeeAmountInSatoshis/1e6} ${this.asset} will be locked during ${this.timelockFeeDuration} blocks`
    },
    canAdd() {
      if (
        !this.uploadedFile ||
        this.balanceError
      )
        return false

      return true
    },
  },
  async created() {
    await this.updateFees({ asset: this.assetChain })
    const storageData = localStorage.getItem('addIPFSContent')
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
      'updateFees'
    ]),
    uploadFile() {
      this.images = this.$refs.file.files[0];
    },
    submitFile() {
      const formData = new FormData();
      formData.append('file', this.images);
      const headers = { 'Content-Type': 'multipart/form-data' };
      this.$axios.post('http://127.0.0.1:3000/api/ipfsdata', formData, { headers }).then((res) => {
        console.log("TACA ===> res = ", res);
        // res.data.files; // binary representation of the file
        // res.status; // HTTP status
      });
    },
    initFormDataState(storageData){
      const formData = JSON.parse(storageData || '');
      if(formData){
        this.uploadedFile = formData.uploadedFile;
      }
    },
    saveFormDataState(){
      const addIPFSContent = {
        uploadedFile: this.uploadedFile
      }
      const formData = JSON.stringify(addIPFSContent);
      localStorage.setItem('addIPFSContent', formData);
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
      this.uploadedFile = null
    },
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
