<template>
  <Modal @close="$emit('close')" modal-dialog="modal-dialog-quotes" body-class="modal-body-quotes">
    <template #header>
      <h5 id="available_quotes_header">
        {{ quotes.length }} {{ $t('pages.swap.availableQuotes') }}
      </h5>
    </template>
    <template>
      <div>
        <p>{{ $t('pages.swap.providersDescription') }}</p>
        <div class="quote-list">
          <div class="row quote-list_header pb-2">
            <div class="col-3 pr-2">{{ $t('common.rate') }}</div>
            <div class="col-4 px-2">{{ 'Min/Max' }}</div>
            <div class="col-5 px-2">{{ $t('common.provider') }}</div>
          </div>
          <div
            class="row quote-list_quote"
            v-for="quote in sortedQuotes"
            :key="quote.agentName"
            :id="`${quote.agentName}_rate_provider`"
            :class="{
              'quote-list_quote_active': quote.provider === selectedProvider && quote.agentName === selectedAgent
            }"
            @click="setSelectedProviderAndAgent(quote.provider, quote.agentName)"
          >
            <div class="col-3 pr-2 quote-list_quote_rate d-flex align-items-center">
              {{ getProviderRate(quote) }}
            </div>
            <div class="col-4 px-2 quote-list_quote_min_max d-flex justify-content-around align-items-flex-start flex-column">
              <span>Min: {{ getProviderMin(quote) }}</span>
              <span>Max: {{ getProviderMax(quote) }}</span>
            </div>
            <div class="col-4 px-2 quote-list_quote_provider d-flex justify-content-center align-items-flex-start flex-column">
              <div style="white-space: nowrap">
                <img :src="getProviderIcon(quote)" class="mr-2" />
                {{ getProviderName(quote) }}
              </div>
              <span v-if="getAgentName(quote)">{{ getAgentName(quote) }}</span>
            </div>
            <div class="col-1 px-0 d-flex align-items-center">
              <TickBlue class="quote-list_tick" v-if="quote.provider === selectedProvider && quote.agentName === selectedAgent"/>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div>
        <button
          class="btn btn-primary btn-block btn-lg"
          id="select_quote_button"
          @click="selectQuote"
        >
          {{ $t('pages.swap.selectQuote') }}
        </button>
        <div class="mt-3">
          <a href="#" @click="$emit('click-learn-more')" class="text-muted">
            {{ $t('pages.swap.learnMoreAboutSwapTypes') }}
          </a>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script>
import { mapState } from 'vuex'
import Modal from '@/components/Modal'
import TickBlue from '@/assets/icons/tick_blue.svg'
import { getSwapProviderConfig } from '@yaswap/wallet-core/dist/src/swaps/utils'
import { getSwapProviderIcon } from '@/utils/swaps'
import { calculateQuoteRate, sortQuotes } from '@yaswap/wallet-core/dist/src/utils/quotes'
import { dpUI } from '@yaswap/wallet-core/dist/src/utils/coinFormatter'
import { SwapProviderType } from '@yaswap/wallet-core/dist/src/store/types'

export default {
  components: {
    Modal,
    TickBlue
  },
  data() {
    return {
      selectedProvider: null,
      selectedAgent: null
    }
  },
  props: ['quotes', 'presetProvider', 'presetAgent'],
  computed: {
    ...mapState(['activeNetwork']),
    sortedQuotes() {
      return sortQuotes(this.quotes, this.activeNetwork)
    }
  },
  methods: {
    getProviderName(quote) {
      const config = getSwapProviderConfig(this.activeNetwork, quote.provider)
      return config.name
    },
    getAgentName(quote) {
      const config = getSwapProviderConfig(this.activeNetwork, quote.provider)
      if (quote.provider === SwapProviderType.Yaswap) {
        return quote.agentName
      }
      return null
    },
    getProviderIcon(quote) {
      return getSwapProviderIcon(this.activeNetwork, quote.provider)
    },
    getProviderRate(quote) {
      const rate = calculateQuoteRate(quote)
      if (rate.lt(1e-6)) {
        return dpUI(rate, 10) // decimals = 10 to display very small rate (for trading pairs like YAC/BTC)
      }
      return dpUI(rate)
    },
    getProviderMin(quote) {
      if (quote.min) {
        return dpUI(quote.min)
      }
      return "N/A"
    },
    getProviderMax(quote) {
      if (quote.max) {
        return dpUI(quote.max)
      }
      return "N/A"
    },
    setSelectedProviderAndAgent(provider, agentName) {
      this.selectedProvider = provider
      this.selectedAgent = agentName
    },
    selectQuote() {
      this.$emit('select-quote', this.selectedProvider, this.selectedAgent)
    }
  },
  created() {
    this.selectedProvider = this.presetProvider
    this.selectedAgent = this.presetAgent
  }
}
</script>

<style lang="scss" scoped>
.quote-list {
  &_header {
    font-weight: 600;
    text-transform: uppercase;
    border-bottom: 1px solid $hr-border-color;
  }

  &_quote {
    cursor: pointer;
    height: 58px;
    border-bottom: 1px solid $hr-border-color;

    &_rate,
    &_min,
    &_max {
      font-weight: 500;
      font-size: 0.7rem;
    }

    &_active,
    &:hover {
      background: #f0f7f9;
    }

    &_provider {
      img {
        width: 14px;
        height: auto;
      }
    }
  }

  &_tick {
    width: 45%;
    height: 45%;
  }
}

.modal-footer {
  div {
    width: 100%;
    text-align: center;
  }
}
</style>
