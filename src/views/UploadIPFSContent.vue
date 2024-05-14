<template>
  <div class="upload-ipfs-content">
    <NavBar
      :showMenu="true"
      :showBack="true"
      backPath="/wallet"
      :backLabel="$t('common.overview')"
    >
      <span class="wallet_header">
        <strong>
          Upload IPFS content
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

        <!-- Box to upload file -->
        <div class="form-group">
          <!-- <input type="file" @change="uploadFile" ref="file"> -->
          <!--UPLOAD-->
          <form enctype="multipart/form-data" novalidate v-if="isInitial">
            <div class="dropbox">
              <input type="file" :disabled="!isInitial" @change="uploadFile" ref="inputFile" class="input-file">
                <p v-if="isInitial">
                  Drag your file(s) here to begin<br> or click to browse
                </p>
            </div>
          </form>
          <!--SELECTED-->
          <div v-if="isSelected">
            <p>
              <a href="javascript:void(0)" @click="resetFields()">Upload again</a>
            </p>
            <img v-if="imageFile" :src="imageFile.url" class="img-responsive img-thumbnail" :alt="imageFile.originalName">
            <p v-else>
              Selected file {{ uploadedFile.name }}
            </p>
          </div>
          <!--SUCCESS-->
          <div v-if="isSuccess">
            <p>Uploaded {{ uploadedFile.name }} file successfully.</p>
          </div>
          <!--FAILED-->
          <div v-if="isFailed">
            <p>Uploaded failed.</p>
            <p>
              <a href="javascript:void(0)" @click="resetFields()">Try again</a>
            </p>
            <pre>{{ uploadError }}</pre>
          </div>
        </div>
      </div>
      <div class="wrapper_bottom">
        <div class="button-group">
          <button
            id="cancel_upload_ipfs_button"
            class="btn btn-light btn-outline-primary btn-lg"
            @click="cancelUpload"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            id="upload_ipfs_button"
            class="btn btn-primary btn-lg"
            @click="submitFile"
            :disabled="!canUpload"
          >
            Upload IPFS content
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { ChainId } from '@yaswap/cryptoassets'
import NavBar from '@/components/NavBar.vue'
import ChevronDownIcon from '@/assets/icons/chevron_down.svg'
import ChevronUpIcon from '@/assets/icons/chevron_up.svg'
import InfoIcon from '@/assets/icons/info.svg'
import { getFeeAsset, getNativeAsset, verifyIPFSHash, isAvailableTokenName } from '@yaswap/wallet-core/dist/src/utils/asset'
import { timelockFeeDuration, timelockFeeAmountInSatoshis } from '@/utils/asset'
import { getImageInfo } from '@/utils/image'

const STATUS_INITIAL = 0, STATUS_SELECTED = 1, STATUS_SUCCESS = 2, STATUS_FAILED = 3;

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
      imageFile: null,
      uploadError: null,
      currentStatus: null
    }
  },
  computed: {
    ...mapState(['activeNetwork', 'accounts', 'activeWalletId', 'enabledAssets']),
    ...mapGetters(['accountsData', 'suggestedFeePrices']),
    timelockFeeDuration,
    timelockFeeAmountInSatoshis,
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
        return `You don't have enough ${this.asset} in wallet to Upload IPFS content (need at least ${this.timelockFeeAmountInSatoshis/1e6} ${this.asset} for the timelock fee)`
      }
      return null
    },
    warningMessage() {
      return `Warning: In order to upload IPFS content, ${this.timelockFeeAmountInSatoshis/1e6} ${this.asset} will be locked during ${this.timelockFeeDuration} blocks`
    },
    canUpload() {
      // if (
      //   !this.uploadedFile ||
      //   this.balanceError
      // )
      //   return false

      return true
    },
    isInitial() {
      return this.currentStatus === STATUS_INITIAL;
    },
    isSelected() {
      return this.currentStatus === STATUS_SELECTED;
    },
    isSuccess() {
      return this.currentStatus === STATUS_SUCCESS;
    },
    isFailed() {
      return this.currentStatus === STATUS_FAILED;
    }
  },
  mounted() {
    this.resetFields();
  },
  async created() {
    await this.updateFees({ asset: this.assetChain })
    const storageData = localStorage.getItem('uploadIPFSContent')
    if (storageData) {
      this.initDataState(storageData)
    }
  },
  beforeRouteLeave(to, from, next) {
    this.saveDataState()
    next();
  },
  methods: {
    ...mapActions([
      'updateFees'
    ]),
    async isImage(file) {
      return new Promise((resolve, reject) => {
        let URL = window.URL || window.webkitURL;
        const img = new Image();
        let timer;
        function clearTimer() {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }

        img.onload = () => {
          console.log("TACA ===> isImage, img.onload is called");
          // This function is only called if the file is a valid image
          clearTimer();
          resolve(true);
        };
        img.onerror = img.onabort = (error) => reject(error);

        // Throw an error if can't load the image within 3s
        timer = setTimeout(() => {
          reject('error loading image within 3s');
        }, 3000);

        img.src = URL.createObjectURL(file);
        console.log("TACA ===> img.src = ", img.src)
      });
    },
    async uploadFile() {
      this.uploadedFile = this.$refs.inputFile.files[0];
      
      // Check if the uploaded file is image
      try {
        await this.isImage(this.uploadedFile);
        this.imageFile = await getImageInfo(this.uploadedFile);
      } catch (e) {
        console.log("TACA ===> uploadFile, e = ", e)
        this.imageFile = null;
      };

      // Read the file, draw it in canvas, and save it as data url with the canvas toDataURL function
      console.log("TACA ===> uploadFile, this.$refs = ", this.$refs)
      console.log("TACA ===> uploadFile, this.uploadedFile = ", this.uploadedFile)
      console.log("TACA ===> uploadFile, this.imageFile = ", this.imageFile)
      this.currentStatus = STATUS_SELECTED;
    },
    async submitFile() {
      const formData = new FormData();
      formData.append('file', this.uploadedFile);
      const headers = { 'Content-Type': 'multipart/form-data' };

      try {
        const result = await this.$axios.post('http://127.0.0.1:3000/api/ipfsdata', formData, { headers })
        console.log("TACA ===> submitFile, result = ", result);
        this.currentStatus = STATUS_SUCCESS;
        // this.resetFields();
      } catch (error) {
        this.uploadError = err.response;
        this.currentStatus = STATUS_FAILED;
      }
    },
    initDataState(storageData){
      const data = JSON.parse(storageData || '');
      if(data){
        this.uploadedFile = data.uploadedFile;
        this.imageFile = data.imageFile;
        this.uploadError = data.uploadError;
        this.currentStatus = data.currentStatus;
      }
      console.log("TACA ===> initDataState, data = ", data)
      console.log("TACA ===> initDataState, this.uploadedFile = ", this.uploadedFile)
      console.log("TACA ===> initDataState, this.imageFile = ", this.imageFile)
      console.log("TACA ===> initDataState, this.uploadError = ", this.uploadError)
      console.log("TACA ===> initDataState, this.currentStatus = ", this.currentStatus)
    },
    saveDataState(){
      const uploadIPFSContent = {
        uploadedFile: this.uploadedFile,
        imageFile: this.imageFile,
        uploadError: this.uploadError,
        currentStatus: this.currentStatus
      }
      const data = JSON.stringify(uploadIPFSContent);
      console.log("TACA ===> saveDataState, uploadIPFSContent = ", uploadIPFSContent)
      console.log("TACA ===> saveDataState, data = ", data)
      localStorage.setItem('uploadIPFSContent', data);
    },
    cancelUpload() {
      this.resetFields()
      this.$router.replace('/wallet')
    },
    resetFields() {
      // Reset Fields
      this.uploadedFile = null;
      this.uploadError = null;
      this.currentStatus = STATUS_INITIAL;
    },
  }
}
</script>

<style lang="scss">
.upload-ipfs-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  line-height: 1; // FIXME: This is just a workaround for overflow text warning area

  .form-group {
    margin-bottom: 5%; // FIXME: This is just a workaround for overflow text warning area
  }

  .dropbox {
    outline: 2px dashed grey; /* the dash box */
    outline-offset: -10px;
    background: lightcyan;
    color: dimgray;
    padding: 10px 10px;
    min-height: 200px; /* minimum height */
    position: relative;
    cursor: pointer;
  }
  
  .input-file {
    opacity: 0; /* invisible but it's there! */
    width: 100%;
    height: 200px;
    position: absolute;
    cursor: pointer;
  }
  
  .dropbox:hover {
    background: lightblue; /* when mouse over to the drop zone, change color */
  }
  
  .dropbox p {
    font-size: 1.2em;
    text-align: center;
    padding: 50px 0;
  }
}
</style>
