<template>
  <v-popover offset="1" trigger="hover focus" placement="top">
    <div class="btn btn-option swap-provider-label" @click="$emit('click')">
      <span class="d-flex justify-content-center align-items-flex-start flex-column p-1">
        <div>
          <img :src="icon" class="mr-1" /><span id="selectedQuote_provider">{{ label }}</span>
        </div>
        <span id="selectedQuote_agent" v-if="agentName">Agent: {{ agentName }}</span>
      </span>
    </div>
    <template slot="popover">
      <p class="mb-0 text-left">
        <strong>{{ info.title }}</strong>
      </p>
      <p class="mb-0 text-left">{{ info.description }}</p>
    </template>
  </v-popover>
</template>

<script>
import {
  getSwapProviderConfig,
  getSwapProviderInfo
} from '@yaswap/wallet-core/dist/src/swaps/utils'
import { getSwapProviderIcon } from '@/utils/swaps'
import { SwapProviderType } from '@yaswap/wallet-core/dist/src/store/types'

export default {
  props: ['provider', 'agent', 'network'],
  computed: {
    label() {
      // if (this.provider === SwapProviderType.Yaswap) {
      //   return getSwapProviderConfig(this.network, this.provider).name + ` (${this.agent})`
      // }
      return getSwapProviderConfig(this.network, this.provider).name
    },
    agentName() {
      if (this.provider === SwapProviderType.Yaswap) {
        return this.agent
      }
      return null
    },
    icon() {
      return getSwapProviderIcon(this.network, this.provider)
    },
    info() {
      return getSwapProviderInfo(this.network, this.provider)
    }
  }
}
</script>

<style lang="scss" scoped>
.swap-provider-label {
  display: inline-block;
  text-transform: none;
  height: 100%;
  max-height: 60px;
  max-width: 180px;
  img {
    height: 15px;
    width: auto;
    // max-width: 14px;
  }
}
</style>
