<template>
  <div class="create-metadata">
    <NavBar
      :showMenu="true"
      :showBack="true"
      :backPath="backPath"
      :backLabel="backLabel"
    >
      <span>
        <strong>
          Create metadata JSON file
        </strong>
      </span>
    </NavBar>
    <div class="wrapper form">
      <div class="wrapper_top">
          <div class="form-group">
            <label class="field-label" for="name">YA-Token/YA-NFT fullname
              <v-popover
                trigger="click"
                :hideOnTargetClick="false"
                placement="bottom"
                offset="0"
                popoverClass="vue-tooltip-theme"
                popoverBaseClass="tooltip"
              >
              <InfoIcon v-tooltip="{ content: '<p><b>Optional field</b><br><i>Click for more info</i></p>', placement: 'bottom', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>{{ nameInfo }}</p>
                  </span>
                </template>
              </v-popover>
            </label>
            <input
              type="text"
              v-model="fullName"
              @change="saveFormDataState"
              class="form-control form-control-sm"
              id="name"
              :placeholder="`YA-Token/YA-NFT fullname`"
              autocomplete="off"
            />
          </div>
          <div class="form-group">
            <label class="field-label" for="description">Description
              <v-popover
                trigger="click"
                :hideOnTargetClick="false"
                placement="bottom"
                offset="0"
                popoverClass="vue-tooltip-theme"
                popoverBaseClass="tooltip"
              >
              <InfoIcon v-tooltip="{ content: '<p><b>Optional field</b><br><i>Click for more info</i></p>', placement: 'bottom', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>{{ descriptionInfo }}</p>
                  </span>
                </template>
              </v-popover>
            </label>
            <input
              type="text"
              v-model="description"
              @change="saveFormDataState"
              class="form-control form-control-sm"
              id="description"
              :placeholder="`Description`"
              autocomplete="off"
            />
          </div>
          <div class="form-group">
            <label class="field-label" for="image_url">Image URL
              <v-popover
                trigger="click"
                :hideOnTargetClick="false"
                placement="bottom"
                offset="0"
                popoverClass="vue-tooltip-theme"
                popoverBaseClass="tooltip"
              >
              <InfoIcon v-tooltip="{ content: '<p><b>Optional field</b><br><i>Click for more info</i></p>', placement: 'bottom', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>{{ imageURLInfo }}</p>
                  </span>
                </template>
              </v-popover>
            </label>
            <input
              type="text"
              v-model="imageURL"
              @change="verifyImageURL"
              class="form-control form-control-sm"
              id="image_url"
              :placeholder="`Image URL`"
              autocomplete="off"
            />
            <small
              v-if="imageURLError"
              class="text-danger form-text"
              id="image_url_error"
              >{{ imageURLError }}
            </small>
          </div>
          <div class="form-group">
            <label for="note">Note</label>
            <p class="note-paragraph">When you press on <b>Download JSON file</b> button, the browser will download a JSON file with name <b>token_metadata.json</b></p>
            <p class="note-paragraph">You should rename this file with your YA-Token/YA-NFT name (or you can leave it like that) and upload to IPFS services such as <a href="https://ravencoinipfs.com/" target="_blank">ravencoinipfs</a> to get IPFS Hash</p>
          </div>
      </div>
      <div class="wrapper_bottom">
        <div class="button-group">
          <button
            id="cancel_create_button"
            class="btn btn-light btn-outline-primary btn-lg"
            @click="cancelCreate"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            id="download_button"
            class="btn btn-primary btn-lg"
            @click="downloadFile"
            :disabled="!canDownload"
          >
            Download JSON file
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'
import InfoIcon from '@/assets/icons/info.svg'
import { verifyIPFSHash, isImageURL } from '@yaswap/wallet-core/dist/src/utils/asset'

export default {
  components: {
    NavBar,
    InfoIcon,
  },
  data() {
    return {
      // NEW
      fullName: null,
      description: null,
      imageURL: null,

      // ERROR
      imageURLError: null,
    }
  },
  computed: {
    backPath() {
      return this.$route.params.from
    },
    backLabel() {
      return 'Back'
    },
    canDownload() {
      if (
        this.imageURLError || (!this.fullName && !this.description && !this.imageURL)
      )
        return false

      return true
    },
    nameInfo() {
      return `This is different from the YA-Token/YA-NFT name. This name can be used to give full idea about the YA-Token/YA-NFT in case the YA-Token/YA-NFT name is too short.`
    },
    descriptionInfo() {
      return `This info can be used to describe the usage of the YA-Token/YA-NFT.`
    },
    imageURLInfo() {
      return `A URI or an IPFS Hash pointing to an image (images are resource with mime type image/*)`
    }
  },
  async created() {
    const storageData = localStorage.getItem('createMetadataData')
    if (storageData) {
      this.initFormDataState(storageData)
      await this.verifyImageURL();
    }
  },
  beforeRouteLeave(to, from, next) {
    this.saveFormDataState()
    next();
  },
  methods: {
    initFormDataState(storageData){
      const formData = JSON.parse(storageData || '');
      if(formData){
        this.fullName = formData.fullName;
        this.description = formData.description;
        this.imageURL = formData.imageURL;
      }
    },
    saveFormDataState(){
      const createMetadataData = {
        fullName: this.fullName,
        description: this.description,
        imageURL: this.imageURL,
      }
      const formData = JSON.stringify(createMetadataData);
      localStorage.setItem('createMetadataData', formData);
    },
    cancelCreate() {
      this.resetFields()
      this.$router.back()
    },
    resetFields() {
      // Reset Fields
      this.fullName = null
      this.description = null
      this.imageURL = null
      this.ipfsImageURL = null

      // Reset Error
      this.imageURLError = null
    },
    async verifyImageURL(e) {
      this.imageURLError = null
      this.ipfsImageURL = null
      this.saveFormDataState()

      // Empty Image URL
      if (!this.imageURL) {
        return
      }

      // Verify URI
      if (this.imageURL.includes("://") && !this.imageURL.startsWith("ipfs://")) {
        if (! await isImageURL(this.imageURL)) {
          this.imageURLError = "This URI doesn't point to a resource with mime type image/*"
        }
      } else {
        const ipfsHash = this.imageURL.startsWith("ipfs://") ? this.imageURL.replace("ipfs://", ""): this.imageURL
        // Verify IPFS Hash
        const [rawIpfsHash, error] = verifyIPFSHash(ipfsHash)

        if (error) {
          this.imageURLError = error
          return
        }

        const ipfsHashUrl = `https://ipfs.io/ipfs/${ipfsHash}`
        if (! await isImageURL(ipfsHashUrl)) {
          this.imageURLError = "This IPFS Hash doesn't point to a resource with mime type image/*"
        }
        this.ipfsImageURL = "ipfs://" + ipfsHash
      }
    },
    downloadFile() {
      const data = {}
      if (this.fullName) {
        data.name = this.fullName
      }
      if (this.description) {
        data.description = this.description
      }
      if (this.imageURL) {
        data.image = this.ipfsImageURL !== null ? this.ipfsImageURL : this.imageURL
      }

      const jsonData = JSON.stringify(data).split('\\\\n').join('\\n');
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'token_metadata.json';

      link.click();

      URL.revokeObjectURL(url);
      this.resetFields();
      this.saveFormDataState();
    }
  }
}
</script>

<style lang="scss">
.create-metadata {
  display: flex;
  flex-direction: column;
  min-height: 0;
  line-height: 1; // FIXME: This is just a workaround for overflow text warning area

  .form-group {
    margin-bottom: 20px; // FIXME: This is just a workaround for overflow text warning area
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

  .note-paragraph {
    text-align: left;
    line-height: 1.4;
    font-size: small;
    margin-top: 10px;
    margin-bottom: 0;
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
</style>
