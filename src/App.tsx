import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { sequence } from '0xsequence'
import { RpcRelayer } from '@0xsequence/relayer'
import { ETHAuth, Proof } from '@0xsequence/ethauth'
//import { ERC_20_ABI } from './constants/abi'
import { configureLogger } from '@0xsequence/utils'
import { Button } from './components/Button'
import { styled, typography } from './style'
import { Console } from './components/Console'
import { Group } from './components/Group'
import { OpenWalletIntent, Settings } from '@0xsequence/provider'
import { Wallet } from '@0xsequence/wallet'

configureLogger({ logLevel: 'DEBUG' })

// Configure Sequence wallet
const walletAppURL = process.env.REACT_APP_WALLET_APP_URL || 'https://sequence.app'
const network = 'polygon'
const log = sequence.initWallet(network, { walletAppURL })
// console.log(log)
// NOTE: to use mumbai, first go to https://sequence.app and click on "Enable Testnet".
// As well, make sure to comment out any other `const wallet = ..` statements.
// const network = 'mumbai'
// sequence.initWallet(network, { networkRpcUrl: 'https://matic-mumbai.chainstacklabs.com' })

// App component
const App = () => {
  const [consoleMsg, setConsoleMsg] = useState<null | string>(null)
  const [consoleLoading, setConsoleLoading] = useState<boolean>(false)
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false)
  const {PVT_KEY} = process.env;
  // Get sequence wallet instance
  const wallet = sequence.getWallet()

  useEffect(() => { 
    setIsWalletConnected(wallet.isConnected())
  }, [wallet])

  useEffect(() => {
    consoleWelcomeMessage()
    // eslint-disable-next-line
  }, [isWalletConnected])

  const connect = async (authorize: boolean = false, withSettings: boolean = false) => {
    if (isWalletConnected) {
      resetConsole()
      addNewConsoleLine('Wallet already connected!')
      setConsoleLoading(false)
      return
    }

    try {
      resetConsole()
      addNewConsoleLine('Connecting')
      //addNewConsoleLine('waiting for wallet to connect')
      const wallet = sequence.getWallet()

      const connectDetails = await wallet.connect({
        app: 'Gurpreet Dapp',
        authorize,
        // keepWalletOpened: true,
        ...(withSettings && {
          settings: {
            // Specify signInWithEmail with an email address to allow user automatically sign in with the email option.
            // signInWithEmail: 'user@email.com',
            // Specify signInOptions to pick the available sign in options.
            // signInOptions: ['email', 'google', 'apple'],
            theme: 'light',
            bannerUrl:
              'https://assets.weforum.org/organization/image/responsive_small_webp_NDt86jzO1wfMOreHYcz8nzbsSUGkTs3TZDGspxVvtZI.webp',
            includedPaymentProviders: ['moonpay', 'ramp', 'wyre'],
            defaultFundingCurrency: 'matic',
            defaultPurchaseAmount: 111
          }
        })
      })

      console.warn('connectDetails', { connectDetails })

      if (authorize) {
        const ethAuth = new ETHAuth()

        if (connectDetails.proof) {
          const decodedProof = await ethAuth.decodeProof(connectDetails.proof.proofString, true)

          console.warn({ decodedProof })

          const isValid = await wallet.utils.isValidTypedDataSignature(
            await wallet.getAddress(),
            connectDetails.proof.typedData,
            decodedProof.signature,
            await wallet.getAuthChainId()
          )
          console.log('isValid?', isValid)
          appendConsoleLine(`isValid?: ${isValid}`)
          if (!isValid) throw new Error('sig invalid')
        }
        if (wallet.isConnected) {
          appendConsoleLine('Wallet connected!')
          setConsoleLoading(false)
          setIsWalletConnected(true)
        }
      }
    } catch (e) {
      console.error(e)
      consoleErrorMessage()
    }
  }

  const disconnect = () => {
    const wallet = sequence.getWallet()
    wallet.disconnect()
    consoleWelcomeMessage()
    setIsWalletConnected(false)
  }

  const openWallet = () => {
    const wallet = sequence.getWallet()
    wallet.openWallet()
  }

  const getAuthChainID = async () => {
    try {
      resetConsole()
      const wallet = sequence.getWallet()

      const authChainId = await wallet.getAuthChainId()
      console.log('auth chainId:', authChainId)
      addNewConsoleLine(`auth chainId: ${authChainId}`)
      setConsoleLoading(false)
    } catch (e) {
      console.error(e)
      consoleErrorMessage()
    }
  }

  const signMessage = async () => {
    try {
      resetConsole()
      const wallet = sequence.getWallet()

      console.log('signing message...')
      addNewConsoleLine('signing message...')
      const signer = wallet.getSigner()
      console.log(111111,signer);
      

      const message = `ka buaaa msg sign karwaye aaye ho!!
  \u2601 \u2600 \u2602`

      // sign
      const sig = await signer.signMessage(message)
      console.log('signature:', sig)
      appendConsoleLine(`signature: ${sig}`)

      // validate
      const isValidHex = await wallet.utils.isValidMessageSignature(
        await wallet.getAddress(),
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)),
        sig,
        await signer.getChainId()
      )
      console.log('isValidHex?', isValidHex)
      appendConsoleLine(`isValidHex?: ${isValidHex}`)

      const isValid = await wallet.utils.isValidMessageSignature(
        await wallet.getAddress(),
        message,
        sig,
        await signer.getChainId()
      )
      console.log('isValid?', isValid)
      appendConsoleLine(`isValid?: ${isValid}`)
      if (!isValid) throw new Error('sig invalid')

      // recover
      // const walletConfig = await wallet.utils.recoverWalletConfigFromMessage(
      //   await wallet.getAddress(),
      //   message,
      //   sig,
      //   await signer.getChainId(),
      //   sequenceContext
      // )
      // console.log('recovered walletConfig:', walletConfig)
      // const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
      // if (!match) throw new Error('recovery address does not match')
      // console.log('address match?', match)

      setConsoleLoading(false)
    } catch (e) {
      console.error(e)
      consoleErrorMessage()
    }
  }

  const signAuthMessage = async () => {
    try {
      resetConsole()
      const wallet = sequence.getWallet()

      console.log('signing message on AuthChain...')
      addNewConsoleLine('signing message on AuthChain...')
      const signer = await wallet.getAuthSigner()
      //signer.sendTransaction()

      const message = 'sign kr bhai msg shanti se!!!!'

      // sign
      const sig = await signer.signMessage(message, await signer.getChainId()) //, false)
      console.log('signature:', sig)
      appendConsoleLine(`signature: ${sig}`)

      // here we have sig from above method, on defaultChain ..
      const notExpecting =
        '0x0002000134ab8771a3f2f7556dab62622ce62224d898175eddfdd50c14127c5a2bb0c8703b3b3aadc3fa6a63dd2dc66107520bc90031c015aaa4bf381f6d88d9797e9b9f1c02010144a0c1cbe7b29d97059dba8bbfcab2405dfb8420000145693d051135be70f588948aeaa043bd3ac92d98057e4a2c0fbd0f7289e028f828a31c62051f0d5fb96768c635a16eacc325d9e537ca5c8c5d2635b8de14ebce1c02'
      if (sig === notExpecting) {
        throw new Error('this sig is from the DefaultChain, not what we expected..')
      }

      // validate
      const isValidHex = await wallet.utils.isValidMessageSignature(
        await wallet.getAddress(),
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)),
        sig,
        await signer.getChainId()
      )
      console.log('isValidHex?', isValidHex)
      appendConsoleLine(`isValidHex?: ${isValidHex}`)

      const isValid = await wallet.utils.isValidMessageSignature(
        await wallet.getAddress(),
        message,
        sig,
        await signer.getChainId()
      )
      console.log('isValid?', isValid)
      appendConsoleLine(`isValid?: ${isValid}`)
      if (!isValid) throw new Error('sig invalid')

      const isDeployedTestnet = await wallet.isDeployed('mumbai')
      console.log('is wallet deployed on mumbai?', isDeployedTestnet)
      appendConsoleLine(`is wallet deployed on mumbai?: ${isDeployedTestnet}`)

      const isDeployedMumbai = await wallet.isDeployed('mumbai')
      console.log('is wallet deployed on matic?', isDeployedMumbai)
      appendConsoleLine(`is wallet deployed on matic?: ${isDeployedMumbai}`)

      // recover
      //
      // TODO: the recovery here will not work, because to use addressOf(), we must have
      // the init config for a wallet, wait for next index PR to come through then can fix this.
      //
      // TODO/NOTE: in order to recover this, the wallet needs to be updated on-chain,
      // or we need the init config.. check if its deployed and updated?
      // NOTE: this should work though, lets confirm it is deployed, and that the config is updated..
      // const walletConfig = await wallet.utils.recoverWalletConfigFromMessage(
      //   await wallet.getAddress(),
      //   message,
      //   sig,
      //   await signer.getChainId()
      // )

      // const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
      // // if (!match) throw new Error('recovery address does not match')
      // console.log('address match?', match)
      setConsoleLoading(false)
    } catch (e) {
      console.error(e)
      consoleErrorMessage()
    }
  }

  const signTypedData = async () => {
    try {
      resetConsole()
      const wallet = sequence.getWallet()

      console.log('signing typedData...')
      addNewConsoleLine('signing typedData...')

      const typedData: sequence.utils.TypedData = {
        domain: {
          name: 'Ether Mail',
          version: '1',
          chainId: await wallet.getChainId(),
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
        },
        types: {
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
          ]
        },
        message: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
        }
      }

      const signer = wallet.getSigner()

      const sig = await signer.signTypedData(typedData.domain, typedData.types, typedData.message)
      console.log('signature:', sig)
      appendConsoleLine(`signature: ${sig}`)

      // validate
      const isValid = await wallet.utils.isValidTypedDataSignature(
        await wallet.getAddress(),
        typedData,
        sig,
        await signer.getChainId()
      )
      console.log('isValid?', isValid)
      appendConsoleLine(`isValid?: ${isValid}`)

      if (!isValid) throw new Error('sig invalid')

      // recover
      // const walletConfig = await wallet.utils.recoverWalletConfigFromTypedData(
      //   await wallet.getAddress(),
      //   typedData,
      //   sig,
      //   await signer.getChainId()
      // )
      // console.log('recovered walletConfig:', walletConfig)

      // const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
      // if (!match) throw new Error('recovery address does not match')
      // console.log('address match?', match)
      setConsoleLoading(false)
    } catch (e) {
      console.error(e)
      consoleErrorMessage()
    }
  }
  const signETHAuth = async () => {
    try {
      resetConsole()
      const wallet = sequence.getWallet()

      const address = await wallet.getAddress()

      const authSigner = await wallet.getAuthSigner()
      const chainId = await authSigner.getChainId()
      console.log('AUTH CHAINID..', chainId)
      addNewConsoleLine(`AUTH CHAINID.. ${chainId}`)
      const authChainId = await authSigner.getChainId()

      const proof = new Proof()
      proof.address = address
      proof.claims.app = 'wee'
      proof.claims.ogn = 'http://localhost:4000'
      proof.setIssuedAtNow()
      proof.setExpiryIn(1000000)

      const messageTypedData = proof.messageTypedData()

      const digest = sequence.utils.encodeTypedDataDigest(messageTypedData)
      console.log('proof claims', proof.claims)
      console.log('we expect digest:', ethers.utils.hexlify(digest))
      appendConsoleLine(`we expect digest: ${digest}`)

      const sig = await authSigner.signTypedData(messageTypedData.domain, messageTypedData.types, messageTypedData.message)
      console.log('signature:', sig)
      appendConsoleLine(`signature: ${sig}`)

      // validate
      const isValid = await wallet.utils.isValidTypedDataSignature(await wallet.getAddress(), messageTypedData, sig, authChainId)
      console.log('isValid?', isValid)
      appendConsoleLine(`isValid? ${isValid}`)
      if (!isValid) throw new Error('sig invalid')

      // recover
      // TODO/NOTE: in order to recover this, the wallet needs to be updated on-chain,
      // or we need the init config.. check if its deployed and updated
      // const walletConfig = await wallet.utils.recoverWalletConfigFromTypedData(
      //   await wallet.getAddress(),
      //   messageTypedData,
      //   sig,
      //   authChainId
      // )

      // console.log('recovered walletConfig:', walletConfig)
      // const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
      // // if (!match) throw new Error('recovery address does not match')
      // console.log('address match?', match)
      setConsoleLoading(false)
    } catch (e) {
      console.error(e)
      consoleErrorMessage()
    }
  }

  const appendConsoleLine = (message: string) => {
    return setConsoleMsg(prevState => {
      return `${prevState}\n\n${message}`
    })
  }

  const resetConsole = () => {
    setConsoleMsg(null)
    setConsoleLoading(true)
  }

  const addNewConsoleLine = (message: string) => {
    setConsoleMsg(() => {
      return message
    })
  }

  const consoleWelcomeMessage = () => {
    setConsoleLoading(false)

    if (isWalletConnected) {
      setConsoleMsg('Status: Wallet is connected :)')
    } else {
      setConsoleMsg('Status: Wallet not connected. Please connect wallet first.')
    }
  }

  const consoleErrorMessage = () => {
    setConsoleLoading(false)
    setConsoleMsg('An error occurred')
  }
  const consoleErrorMessage1 = () => {
    setConsoleLoading(false)
    setConsoleMsg('An error occurred!!!!! 1111222')
  }

  const send1155Tokens = async () => {
    try {
      resetConsole()
      console.log('TODO')
      addNewConsoleLine('TODO')
      setConsoleLoading(false)
    } catch (e) {
      console.error(e)
      consoleErrorMessage()
    }
  }
  //new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/polygon_mumbai')
  //https://rpc.ankr.com/polygon
  const sendingErc721 = async () => {
    try {
      const pvtKey = PVT_KEY;
      const Provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/polygon')
      const walletEOA = new ethers.Wallet(pvtKey, Provider)
      const relayer = new RpcRelayer({ url: 'https://polygon-relayer.sequence.app', provider: Provider })
      console.log(relayer)
      const wallet = (await Wallet.singleOwner(walletEOA)).connect(Provider, relayer)
      const add = await wallet.getAddress()
      const add1 = wallet._isSigner
      const add2 = (await wallet.getBalance()).toString()
      const add3 = await wallet.getSigners()
      const add4 = await wallet.getRelayer()
      //const add5  = await wallet

      console.log('1111', add, add1, add2, add3, add4)
      //console.log(abc.getSigner(137))
      //const wallet = sequence.getWallet;
      const erc721Interface = new ethers.utils.Interface(['function safeMint(address to)'])

      const data = erc721Interface.encodeFunctionData('safeMint', [
        '0x6C90C82AE4F24af4E0ad800BDa5f0c70b4166910'
      ])

      const txn = {
        to: '0x3BAcB000ef4397d31eAc91253fE6A9d664771ADE',
        data
      }
      const [config, context] = await Promise.all([wallet.getWalletConfig(), wallet.getWalletContext()])
      console.log(config[0])
      const { options, quote } = await relayer.getFeeOptions(config[0], context, txn)
      const option = options.find(option => option.token.symbol === 'MATIC')
      console.log('log1111', option)
      if (!option) {
        throw Error(`relayer doesn't support MATIC fees`)
      }
      const feeTxn = {
        to: option.to,
        value: option.value,
        gasLimit: option.gasLimit,
        revertOnError: true
      }
       //const signer = wallet.
       //console.log("🚀 ~ file: App.tsx:486 ~ sendingErc721 ~ signer", signer);
       
      const txnResponse = await wallet.sendTransaction([txn, feeTxn], undefined, undefined, quote)
      console.log('logggg tx response', txnResponse)

      // Wait for transaction to be mined
      const txnReceipt = await txnResponse.wait(2)
      console.log('1122', txnReceipt)
      console.log(123456,txnReceipt.status);

      // Check if transaction was successful
      if (txnReceipt.status !== 1) {
        console.log(`Unexpected status: ${txnReceipt.status}`)
      }
      console.log("transaction sucessfull")
    } catch (e) {
      console.error(e)
      consoleErrorMessage1()
    }
  }

  return (
    <Container>
      <SequenceLogo
        alt="logo"
        src="https://assets.weforum.org/organization/image/responsive_small_webp_NDt86jzO1wfMOreHYcz8nzbsSUGkTs3TZDGspxVvtZI.webp"
      />

      <Title>Gurpreet Dapp ({network && network.length > 0 ? network : 'mainnet'})</Title>
      <Description>Please open your browser dev inspector to view output of functions below</Description>

      <Group label="Connection" layout="grid">
        <Button onClick={() => connect()}>Connect</Button>
        <Button onClick={() => connect(true)}>Connect & Auth</Button>
        <Button onClick={() => connect(true, true)}>Connect with Settings</Button>
        <Button onClick={() => disconnect()}>Disconnect</Button>
        <Button disabled={!isWalletConnected} onClick={() => openWallet()}>
          Open Wallet
        </Button>
        <Button disabled={!isWalletConnected} onClick={() => getAuthChainID()}>
          AuthChain?
        </Button>
        <Button onClick={() => sendingErc721()}>sending erc721 token via relayer</Button>
      </Group>

      <Group label="Signing" layout="grid">
        <Button disabled={!isWalletConnected} onClick={() => signMessage()}>
          Sign Message
        </Button>
        <Button disabled={!isWalletConnected} onClick={() => signTypedData()}>
          Sign TypedData
        </Button>
        <Button disabled={!isWalletConnected} onClick={() => signAuthMessage()}>
          Sign Message on AuthChain
        </Button>
        <Button disabled={!isWalletConnected} onClick={() => signETHAuth()}>
          Sign ETHAuth
        </Button>
      </Group>
      <Console message={consoleMsg} loading={consoleLoading} />
    </Container>
  )
}

// @ts-ignore
const Container = styled('div', {
  padding: '80px 25px 80px',
  margin: '0 auto',
  maxWidth: '720px'
})

// @ts-ignore
const SequenceLogo = styled('img', {
  height: '40px'
})

// @ts-ignore
const Title = styled('h1', typography.h1, {
  color: '$textPrimary',
  fontSize: '25px'
})

// @ts-ignore
const Description = styled('p', typography.b1, {
  color: '$textSecondary',
  marginBottom: '15px'
})
export default React.memo(App)
