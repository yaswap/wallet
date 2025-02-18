import { Client } from '@yaswap/client'
import { SolanaNetworks } from '@yaswap/solana-networks'
import { SolanaRpcProvider } from '@yaswap/solana-rpc-provider'
import { SolanaWalletProvider } from '@yaswap/solana-wallet-provider'
import { SolanaSwapProvider } from '@yaswap/solana-swap-provider'
import { SolanaSwapFindProvider } from '@yaswap/solana-swap-find-provider'
import { Network } from '@yaswap/wallet-core/dist/src/store/types'
import { ChainId, getChain } from '@yaswap/cryptoassets'

test('Solana Network TesnetConfig', () => {
  expect(SolanaNetworks.solana_testnet).toEqual({
    name: 'devnet',
    nodeUrl: 'http://yaswap.devnet.rpcpool.com/',
    helperUrl: 'https://explorer-api.devnet.solana.com/',
    coinType: '501',
    isTestnet: true,
    walletIndex: 0,
    programId: '4B9k2YntFxQC93MezXZB3AKLsLrEaqDdXEaPmgTTF5WX'
  })
})

test('Solana Network Mainnet', () => {
  expect(SolanaNetworks.solana_mainnet).toEqual({
    name: 'mainnet',
    nodeUrl: 'https://api.mainnet-beta.solana.com',
    helperUrl: 'https://explorer.solana.com/',
    coinType: '501',
    isTestnet: false,
    walletIndex: 0,
    programId: '!!! TODO: REPLACE AFTER DEPLOY ON THE MAINNET !!!'
  })
})

test('Create Client for testnet and attach Solana RpcProvider successfully', async () => {
  const client = new Client()

  client.addProvider(new SolanaRpcProvider(SolanaNetworks.solana_testnet))

  expect(client._providers.length).toEqual(1)

  const blockHeight = await client.chain.getBlockHeight()

  expect(blockHeight).toBeGreaterThan(100)
})

test('Create Client for mainnet and attach Solana RpcProvider successfully', () => {
  const client = new Client()

  client.addProvider(new SolanaRpcProvider(SolanaNetworks.solana_mainnet))

  expect(client._providers.length).toEqual(1)
})

test('Create Client for testnet and attach Solana Wallet Provider successfully', () => {
  const solanaNetwork = getChain(Network.Testnet, ChainId.Solana)
  const client = new Client()
  const derivationPath = `m/44'/501'/${solanaNetwork.walletIndex}'/0'`

  client.addProvider(
    new SolanaWalletProvider({
      network: solanaNetwork,
      mnemonic: 'under visa else sweet voice result asset notable invite interest young abuse',
      derivationPath
    })
  )

  expect(client._providers.length).toEqual(1)
})

test('Create Client for Mainnet and attach Solana Wallet Provider successfully', () => {
  const solanaNetwork = getChain(Network.Mainnet, ChainId.Solana)
  const client = new Client()
  const derivationPath = `m/44'/501'/${solanaNetwork.walletIndex}'/0'`

  client.addProvider(
    new SolanaWalletProvider({
      network: solanaNetwork,
      mnemonic: 'under visa else sweet voice result asset notable invite interest young abuse',
      derivationPath
    })
  )

  expect(client._providers.length).toEqual(1)
})

test('Create Client for testnet and attach Solana Swap Provider successfully', () => {
  const client = new Client()

  client.addProvider(new SolanaSwapFindProvider(SolanaNetworks.solana_testnet))

  expect(client._providers.length).toEqual(1)
})

test('Create Client for mainnet and attach Solana Swap Provider successfully', () => {
  const client = new Client()

  client.addProvider(new SolanaSwapFindProvider(SolanaNetworks.solana_mainnet))

  expect(client._providers.length).toEqual(1)
})

test('Create Client for testnet and attach Solana Swap Find Provider successfully', () => {
  const client = new Client()

  client.addProvider(new SolanaSwapProvider(SolanaNetworks.solana_testnet))

  expect(client._providers.length).toEqual(1)
})

test('Create Client for mainnet and attach Solana Swap Find Provider successfully', () => {
  const client = new Client()

  client.addProvider(new SolanaSwapProvider(SolanaNetworks.solana_mainnet))

  expect(client._providers.length).toEqual(1)
})

test('Create Client for testnet and attach All Providers successfully', () => {
  const client = new Client()

  const solanaNetwork = getChain(Network.Testnet, ChainId.Solana)
  const derivationPath = `m/44'/501'/${solanaNetwork.walletIndex}'/0'`

  client.addProvider(new SolanaRpcProvider(SolanaNetworks.solana_testnet))
  client.addProvider(
    new SolanaWalletProvider({
      network: solanaNetwork,
      mnemonic: 'under visa else sweet voice result asset notable invite interest young abuse',
      derivationPath
    })
  )
  client.addProvider(new SolanaSwapProvider(SolanaNetworks.solana_testnet))
  client.addProvider(new SolanaSwapFindProvider(SolanaNetworks.solana_testnet))

  expect(client._providers.length).toEqual(4)
})

test('Create Client for mainnet and attach All Providers successfully', () => {
  const client = new Client()

  const solanaNetwork = getChain(Network.Mainnet, ChainId.Solana)
  const derivationPath = `m/44'/501'/${solanaNetwork.walletIndex}'/0'`

  client.addProvider(new SolanaRpcProvider(SolanaNetworks.solana_mainnet))
  client.addProvider(
    new SolanaWalletProvider({
      network: solanaNetwork,
      mnemonic: 'under visa else sweet voice result asset notable invite interest young abuse',
      derivationPath
    })
  )
  client.addProvider(new SolanaSwapProvider(SolanaNetworks.solana_mainnet))
  client.addProvider(new SolanaSwapFindProvider(SolanaNetworks.solana_mainnet))

  expect(client._providers.length).toEqual(4)
})

test('Should throw error "Duplicate provider" if we try to attach twice same provider', () => {
  const client = new Client()

  client.addProvider(new SolanaRpcProvider(SolanaNetworks.solana_mainnet))

  expect(() => client.addProvider(new SolanaRpcProvider(SolanaNetworks.solana_mainnet))).toThrow(
    'Duplicate provider'
  )
})

describe('Test RPC Provider Calls', () => {
  const client = new Client()

  client.addProvider(new SolanaRpcProvider(SolanaNetworks.solana_testnet))

  test('getBlockHeight', async () => {
    const blockHeight = await client.chain.getBlockHeight()

    expect(blockHeight).toBeGreaterThan(100)
  })

  test('getBalance', async () => {
    const balance = await client.chain.getBalance(['9U5t5Nn3BAdasm8j3sQ273TsM7YZvUAjYcD16qhhNi5P'])

    expect(balance.toNumber()).toBeGreaterThan(0)
  })
})
