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
                <InfoIcon v-tooltip="{ content: 'Click for more info', placement: 'left', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>This is different with YA-Token/YA-NFT name. This name can be used to give full idea about the YA-Token/YA-NFT in case the YA-Token/YA-NFT name is too short</p>
                  </span>
                </template>
              </v-popover>
            </label>
            <input
              type="text"
              v-model="fullName"
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
                <InfoIcon v-tooltip="{ content: 'Click for more info', placement: 'right', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>This info can be used to describe the usage of the YA-Token/YA-NFT.</p>
                  </span>
                </template>
              </v-popover>
            </label>
            <input
              type="text"
              v-model="description"
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
                <InfoIcon v-tooltip="{ content: 'Click for more info', placement: 'right', trigger: 'hover focus' }"/>
                <template slot="popover">
                  <span style="white-space: pre-line;">
                    <p>A URI or an IPFS Hash pointing to an image (images are resource with mime type image/*)</p>
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
      </div>
      <div class="wrapper_bottom">
        <div class="button-group">
          <router-link :to="backPath"
            ><button id="cancel_create_button" class="btn btn-light btn-outline-primary btn-lg">
              {{ $t('common.cancel') }}
            </button></router-link
          >
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
      console.log('TACA ===> this.$route = ', this.$route)
      return this.$route.params.from
    },
    backLabel() {
      return 'Back'
    },
    canDownload() {
      if (
        this.imageURLError
      )
        return false

      return true
    }
  },
  methods: {
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

      // Empty Image URL
      if (!this.imageURL) {
        return
      }

      // Verify URI
      if (this.imageURL.includes("://") && !this.imageURL.startsWith("ipfs://")) {
        if (! await isImageURL(this.imageURL)) {
          console.log("TACA ===> Invalid Image URI")
          this.imageURLError = "This URI doesn't point to a resource with mime type image/*"
        }
      } else {
        const ipfsHash = this.imageURL.startsWith("ipfs://") ? this.imageURL.replace("ipfs://", ""): this.imageURL
        console.log("TACA ===> ipfsHash = ", ipfsHash)
        // Verify IPFS Hash
        const [rawIpfsHash, error] = verifyIPFSHash(ipfsHash)

        if (error) {
          this.imageURLError = error
          return
        }

        const ipfsHashUrl = `https://ipfs.io/ipfs/${ipfsHash}`
        if (! await isImageURL(ipfsHashUrl)) {
          console.log("TACA ===> Invalid Image IPFS Hash")
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

      const jsonData = JSON.stringify(data);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'token_metadata.json';

      link.click();

      URL.revokeObjectURL(url);
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
