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
          <!-- <input type="file" @change="selectFile" ref="file"> -->
          <!--UPLOAD-->
          <form enctype="multipart/form-data" novalidate v-if="isInitial">
            <div class="dropbox">
              <input type="file" :disabled="!isInitial" @change="selectFile" ref="inputFile" class="input-file">
                <p v-if="isInitial" class="form-text">
                  Drag your file(s) here to begin<br> or click to browse
                </p>
            </div>
          </form>
          <!--SELECTED-->
          <div v-if="isSelected">
            <small class="form-text mt-3">
              Selected file {{ uploadedFile.name }}
            </small>
            <small
              v-if="fileSizeError"
              class="text-danger form-text mt-3"
              id="file_size_error"
              >{{ fileSizeError }}
            </small>
            <img v-if="imageFile" :src="imageFile.url" class="img-responsive img-thumbnail" :alt="imageFile.originalName">
            <small class="form-text mt-3">
              <a href="#!" @click="resetFields()">Upload again</a>
            </small>
          </div>
          <!--SUCCESS-->
          <div v-if="isSuccess">
            <small class="form-text mt-3">Uploaded successfully. Below are your file CIDs.</small>
            <small class="form-text">
              CID version 0: <a :href="`${ipfsGateway}/ipfs/${cidv0}`" target="_blank"> {{ cidv0 }}</a>
            </small>
            <small class="form-text">
              CID version 1: <a :href="`${ipfsGateway}/ipfs/${cidv1}`" target="_blank"> {{ cidv1 }}</a>
            </small>
          </div>
          <!--FAILED-->
          <div v-if="isFailed">
            <small class="text-danger form-text mt-3">Uploaded failed.</small>
            <small
              v-if="uploadError"
              class="text-danger form-text"
              id="upload_error"
              >
              {{ uploadError }}
            </small>
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
            v-if="isSuccess || isFailed"
            id="upload_ipfs_button"
            class="btn btn-primary btn-lg"
            @click="resetFields"
          >
            Upload another file
          </button>
          <button
            v-else
            id="upload_ipfs_button"
            class="btn btn-primary btn-lg"
            @click="uploadFile"
            :disabled="!canUpload || loading"
          >
            <SpinnerIcon class="btn-loading" v-if="loading" />
            <template v-else>Upload IPFS content</template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SpinnerIcon from '@/assets/icons/spinner.svg'
import { mapState, mapGetters, mapActions } from 'vuex'
import NavBar from '@/components/NavBar.vue'
import ChevronDownIcon from '@/assets/icons/chevron_down.svg'
import ChevronUpIcon from '@/assets/icons/chevron_up.svg'
import InfoIcon from '@/assets/icons/info.svg'
import { getFeeAsset, getNativeAsset } from '@yaswap/wallet-core/dist/src/utils/asset'
import { getImageInfo } from '@/utils/image'
import { errorToYaswapErrorString } from '@yaswap/error-parser/dist/src/utils'
import { reportYaswapError } from '@yaswap/error-parser'
import { getChain, ChainId } from '@yaswap/cryptoassets'
import cryptoassets from '@yaswap/wallet-core/dist/src/utils/cryptoassets'

// USED FOR TESTING
const FILE_SIZE_LIMIT = 5 * 1024 * 1024 // 1MB
const TIMELOCK_DURATION = 10; // 20 blocks
const TIMELOCK_AMOUNT = 5 * 1e6; // 10 YAC

// USED FOR PRODUCTION
const STATUS_INITIAL = 0, STATUS_SELECTED = 1, STATUS_SUCCESS = 2, STATUS_FAILED = 3;
// const FILE_SIZE_LIMIT = 5 * 1024 * 1024 // 5MB = 5242880 bytes
// const TIMELOCK_DURATION = 21000; // 21000 blocks
// const TIMELOCK_AMOUNT = 2100 * 1e6; // 2100 YAC

export default {
  components: {
    NavBar,
    ChevronDownIcon,
    ChevronUpIcon,
    InfoIcon,
    SpinnerIcon,
  },
  data() {
    return {
      // Uploaded file
      uploadedFile: null,
      imageFile: null,
      uploadError: null,
      currentStatus: null,
      address: null,
      cidv0: null,
      cidv1: null,
      loading: false,
      // USED FOR PRODUCTION
      ipfsUploadEndpoint: 'http://73.43.63.213:3000/ipfs_upload_service',
      ipfsGateway: 'http://73.43.63.213:3000/ipfs',

      // USED FOR TESTING
      // ipfsUploadEndpoint: 'http://127.0.0.1:3000/ipfs_upload_service',
      // ipfsGateway: 'http://127.0.0.1:3000/ipfs',
    }
  },
  computed: {
    ...mapState(['activeNetwork', 'accounts', 'activeWalletId', 'fiatRates']),
    ...mapGetters(['accountsData', 'suggestedFeePrices']),
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
      if (Number(this.balance) < TIMELOCK_AMOUNT) {
        return `You don't have enough ${this.asset} in wallet to Upload IPFS content (need at least ${TIMELOCK_AMOUNT/1e6} ${this.asset} for the timelock fee)`
      }
      return null
    },
    fileSizeError() {
      if (this.uploadedFile.size > FILE_SIZE_LIMIT) {
        return `The maximum allowable file size is ${FILE_SIZE_LIMIT} bytes. You selected a file with size = ${this.uploadedFile.size} bytes. Please upload another file to proceed.`;
      }
      return null;
    },
    warningMessage() {
      return `Warning: In order to upload IPFS content, ${TIMELOCK_AMOUNT/1e6} ${this.asset} will be locked during ${TIMELOCK_DURATION} blocks`
    },
    canUpload() {
      if (
        !this.uploadedFile ||
        this.balanceError ||
        this.fileSizeError
      )
        return false

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
    const addresses = await this.getUnusedAddresses({
      network: this.activeNetwork,
      walletId: this.activeWalletId,
      assets: [this.asset],
      accountId: this.account.id
    })
    console.log("TACA ===> created(), addresses = ", addresses);
    const chainId = cryptoassets[this.asset]?.chain
    console.log("TACA ===> created(), chainId = ", chainId);
    this.address = getChain(this.activeNetwork, chainId).formatAddressUI(addresses[0])
    console.log("TACA ===> created(), this.address = ", this.address);
    await this.updateFees({ asset: this.assetChain })
    // const storageData = localStorage.getItem('uploadIPFSContent')
    // if (storageData) {
    //   this.initDataState(storageData)
    // }
  },
  // beforeRouteLeave(to, from, next) {
  //   this.saveDataState()
  //   next();
  // },
  methods: {
    ...mapActions([
      'updateFees',
      'getUnusedAddresses',
      'sendTransaction'
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
    async selectFile() {
      this.uploadedFile = this.$refs.inputFile.files[0];
      
      // Check if the uploaded file is image
      try {
        await this.isImage(this.uploadedFile);
        this.imageFile = await getImageInfo(this.uploadedFile);
      } catch (e) {
        console.log("TACA ===> selectFile, e = ", e)
        this.imageFile = null;
      };

      // Read the file, draw it in canvas, and save it as data url with the canvas toDataURL function
      console.log("TACA ===> selectFile, this.$refs = ", this.$refs)
      console.log("TACA ===> selectFile, this.uploadedFile = ", this.uploadedFile)
      console.log("TACA ===> selectFile, this.imageFile = ", this.imageFile)
      this.currentStatus = STATUS_SELECTED;
    },
    async isFileExisted() {
      // Check if the file is already existed on our server
      const formData = new FormData();
      formData.append('file', this.uploadedFile);
      const headers = { 'Content-Type': 'multipart/form-data' };
      let isExisted = false;
      let cidv0 = null;

      console.log("TACA ===> isFileExisted, formData = ", formData)
      try {
        const res = await this.$axios.post(`${this.ipfsUploadEndpoint}/api/is_content_existed`, formData, { headers })
        console.log("TACA ===> isFileExisted, res = ", res);
        if (res.data.status) {
          console.log("TACA ===> isFileExisted, Your selected file was already existed on the system. Please upload another file.");
          this.uploadError = `Your selected file was already existed on the system. Its CID is ${res.data.cidv0}. Please upload another file.`;
          this.currentStatus = STATUS_FAILED;
          isExisted = true
        }
        cidv0 = res.data.cidv0
      } catch (error) {
        console.log("TACA ===> isFileExisted, error = ", error);
        if (error.response.data == null) {
          this.uploadError = error.response;
        } else {
          this.uploadError = error.response.data;
        }
        this.currentStatus = STATUS_FAILED;
        isExisted = true
      }

      return { isExisted, cidv0 }
    },
    async timelockYAC(cidv0) {
      let txHash = null;
      try {
        const argObj = {
          network: this.activeNetwork,
          walletId: this.activeWalletId,
          accountId: this.account.id,
          asset: this.asset,
          to: this.address,
          amount: TIMELOCK_AMOUNT,
          data: null,
          fee: this.fee,
          feeAsset: this.asset,
          gas: cryptoassets[this.asset].sendGasLimit,
          feeLabel: 'average',
          fiatRate: this.fiatRates[this.asset],
          timelockDuration: TIMELOCK_DURATION,
          timelockReason: `They are timelocked to upload file having IPFS CID ${cidv0}`
        }
        console.log("TACA ===> timelockYAC, argObj = ", argObj);
        const transaction = await this.sendTransaction(argObj)
        console.log("TACA ===> timelockYAC, transaction = ", transaction);
        txHash = transaction.tx.hash
      } catch (error) {
        console.log("TACA ===> timelockYAC, error = ", error);
        const yaswapErrorString = errorToYaswapErrorString(error)
        console.log("TACA ===> timelockYAC, yaswapErrorString = ", yaswapErrorString);
        reportYaswapError(error)
        this.uploadError = yaswapErrorString
      }
      return txHash
    },
    async uploadFile() {
      // Check if the file is already existed on our server
      this.loading = true
      console.log("TACA ===> uploadFile, BEGIN");
      console.log("TACA ===> uploadFile, check if file was already existed");
      const { isExisted, cidv0 } = await this.isFileExisted()
      if (isExisted) {
        this.loading = false;
        return
      }

      console.log("TACA ===> uploadFile, file isn't existed, create and broadcast timelock tx");
      // Create and broadcast timelock transaction
      const timelockTx = await this.timelockYAC(cidv0)
      if (timelockTx == null) {
        this.loading = false;
        return
      }
      console.log("TACA ===> uploadFile, timelockTx = ", timelockTx);

      // Upload the file
      const formData = new FormData();
      formData.append('file', this.uploadedFile);
      formData.append('timelocktx', timelockTx);
      const headers = { 'Content-Type': 'multipart/form-data' };

      console.log("TACA ===> uploadFile, formData = ", formData)
      try {
        const res = await this.$axios.post(`${this.ipfsUploadEndpoint}/api/add_ipfs_content`, formData, { headers })
        console.log("TACA ===> uploadFile, res = ", res);
        this.cidv0 = res.data.cidv0;
        this.cidv1 = res.data.cidv1;
        this.currentStatus = STATUS_SUCCESS;
      } catch (error) {
        console.log("TACA ===> uploadFile, error = ", error);
        if (error.response.data == null) {
          this.uploadError = error.response;
        } else {
          this.uploadError = error.response.data;
        }
        this.currentStatus = STATUS_FAILED;
      } finally {
        this.loading = false;
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
    },
    saveDataState(){
      const uploadIPFSContent = {
        uploadedFile: this.uploadedFile,
        imageFile: this.imageFile,
        uploadError: this.uploadError,
        currentStatus: this.currentStatus
      }
      const data = JSON.stringify(uploadIPFSContent);
      localStorage.setItem('uploadIPFSContent', data);
    },
    cancelUpload() {
      this.resetFields()
      this.$router.replace('/wallet')
    },
    resetFields() {
      // Reset Fields
      this.uploadedFile = null;
      this.imageFile = null;
      this.uploadError = null;
      this.currentStatus = STATUS_INITIAL;
      this.cidv0 = null;
      this.cidv1 = null;
      this.loading = false;
    },
  }
}
</script>

<style lang="scss">
.upload-ipfs-content {
  display: flex;
  flex-direction: column;
  overflow: auto; // Display the scrollbar if the content is overflow
  min-height: 0;
  line-height: 1.4; // FIXME: This is just a workaround for overflow text warning area

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
