<template>
  <WalletAccounts @item-selected="onAccountSelected" :accounts="accountsData" />
</template>

<script>
import { mapGetters } from 'vuex'
import WalletAccounts from '@/components/WalletAccounts'

export default {
  computed: {
    ...mapGetters(['accountsData'])
  },
  components: {
    WalletAccounts
  },
  methods: {
    onAccountSelected({ account, asset }) {
      console.log('TACA ===> WalletAssets.vue, onAccountSelected, account = ', account, ', asset = ', asset)
      const _asset = asset || account.assets[0]
      console.log('TACA ===> WalletAssets.vue, onAccountSelected, _asset = ', _asset)
      this.$router.push(`/accounts/${account.id}/${_asset}`)
    }
  }
}
</script>
<style lang="scss"></style>
