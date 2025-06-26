/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import React, { useState, useEffect } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'

interface Network {
  chainId: number
  name: string
  rpcUrls: string[]
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

export function NetworkPicker() {
  const { primaryWallet } = useDynamicContext()
  const [currentNetwork, setCurrentNetwork] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Define available networks
  const availableNetworks: Network[] = [
    {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrls: ['https://cloudflare-eth.com'],
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
    },
    {
      chainId: 1337,
      name: 'Hardhat Local',
      rpcUrls: ['http://127.0.0.1:8545'],
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
    },
    {
      chainId: 137,
      name: 'Polygon',
      rpcUrls: ['https://polygon-rpc.com'],
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
    },
    {
      chainId: 10,
      name: 'Optimism',
      rpcUrls: ['https://mainnet.optimism.io'],
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
    }
  ]

  // Get current network on load
  useEffect(() => {
    const getCurrentNetwork = async () => {
      if (primaryWallet) {
        try {
          const network = await primaryWallet.getNetwork()
          setCurrentNetwork(Number(network))
        } catch (error) {
          console.warn('Could not get current network:', error)
        }
      }
    }
    getCurrentNetwork()
  }, [primaryWallet])

  const handleNetworkChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const chainId = parseInt(event.target.value)
    
    if (!primaryWallet) {
      alert('Please connect your wallet first')
      return
    }

    console.log('🔍 Debugging wallet connector:', {
      connector: primaryWallet.connector,
      supportsNetworkSwitching: primaryWallet.connector?.supportsNetworkSwitching?.(),
      connectorMethods: Object.keys(primaryWallet.connector || {}),
      walletMethods: Object.keys(primaryWallet || {})
    })

    setLoading(true)
    
    try {
      // Check if wallet supports network switching
      if (primaryWallet.connector?.supportsNetworkSwitching?.()) {
        console.log('🔄 Switching network using Dynamic method...')
        console.log('🔍 Wallet connector debug:', {
          connector: primaryWallet.connector,
          supportsNetworkSwitching: primaryWallet.connector?.supportsNetworkSwitching?.(),
          switchNetwork: typeof primaryWallet.switchNetwork
        })
        await primaryWallet.switchNetwork(chainId)
        setCurrentNetwork(chainId)
        console.log('✅ Network switched successfully!')
      } else {
        console.log('⚠️ Wallet does not support Dynamic network switching, trying manual method...')
        // Fallback to manual method
        console.log('🔄 Using manual network switch...')
        const network = availableNetworks.find(n => n.chainId === chainId)
        if (!network) {
          throw new Error('Network not found')
        }

        const walletClient = await primaryWallet.getWalletClient()
        console.log('📱 Got wallet client:', walletClient)
        
        try {
          // Try to switch to existing network
          console.log('🔄 Attempting wallet_switchEthereumChain...')
          await walletClient.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chainId.toString(16)}` }]
          })
          console.log('✅ Network switched via wallet_switchEthereumChain!')
        } catch (switchError: any) {
          console.log('❌ Switch failed, trying to add network:', switchError)
          // If network doesn't exist, add it first
          if (switchError.code === 4902) {
            console.log('🔄 Adding network via wallet_addEthereumChain...')
            await walletClient.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${chainId.toString(16)}`,
                chainName: network.name,
                rpcUrls: network.rpcUrls,
                nativeCurrency: network.nativeCurrency,
                blockExplorerUrls: []
              }]
            })
            console.log('✅ Network added successfully!')
          } else {
            throw switchError
          }
        }
        
        setCurrentNetwork(chainId)
        console.log('✅ Network switched manually!')
      }
    } catch (error: any) {
      console.error('❌ Failed to switch network:', error)
      alert(`Failed to switch network: ${error.message}\n\nPlease try manually adding the network to your wallet:\n\nNetwork Name: Hardhat Local\nChain ID: 1337\nRPC URL: http://127.0.0.1:8545\nCurrency Symbol: ETH`)
      // Reset dropdown to current network
      event.target.value = currentNetwork?.toString() || ''
    } finally {
      setLoading(false)
    }
  }

  if (!primaryWallet) {
    return (
      <div css={containerStyle}>
        <div css={disabledStyle}>
          🌐 Connect wallet to switch networks
        </div>
      </div>
    )
  }

  return (
    <div css={containerStyle}>
      <label css={labelStyle}>🌐 Network:</label>
      <select 
        css={selectStyle}
        value={currentNetwork || ''}
        onChange={handleNetworkChange}
        disabled={loading}
      >
        <option value="" disabled>
          {loading ? 'Switching...' : 'Select Network'}
        </option>
        {availableNetworks.map((network) => (
          <option key={network.chainId} value={network.chainId}>
            {network.name} {network.chainId === 1337 ? '(Local)' : ''}
          </option>
        ))}
      </select>
      {loading && <div css={loadingStyle}>⏳ Switching network...</div>}
    </div>
  )
}

// Styles
const containerStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
`

const labelStyle = css`
  color: #ffd700;
  font-weight: bold;
  white-space: nowrap;
`

const selectStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid #ffd700;
  border-radius: 6px;
  color: #fff;
  padding: 8px 12px;
  font-size: 14px;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #ffed4e;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  option {
    background: #1a1a2e;
    color: #fff;
  }
`

const disabledStyle = css`
  color: #888;
  font-style: italic;
`

const loadingStyle = css`
  color: #ffd700;
  font-size: 12px;
` 