/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import React, { useState, useEffect } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { getNetworkConfig } from '../config/contractConfig'

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

// Local storage key for storing selected network when not connected
const SELECTED_NETWORK_KEY = 'selectedNetwork'

export function NetworkPicker() {
  const { primaryWallet } = useDynamicContext()
  const [currentNetwork, setCurrentNetwork] = useState<number | null>(null)
  const [selectedNetworkForReadOnly, setSelectedNetworkForReadOnly] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Define available networks based on contract config
  const availableNetworks: Network[] = [
    {
      chainId: 1337,
      name: 'Hardhat Local',
      rpcUrls: ['http://127.0.0.1:8545'],
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
    },
    {
      chainId: 8453,
      name: 'Base Mainnet',
      rpcUrls: ['https://mainnet.base.org'],
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
    },
    {
      chainId: 84532,
      name: 'Base Sepolia',
      rpcUrls: ['https://sepolia.base.org'],
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
    }
  ].filter(network => {
    // Only show networks that have contract deployments
    const config = getNetworkConfig(network.chainId)
    return config && config.active
  })

  // Initialize from localStorage on load or default to Hardhat Local
  useEffect(() => {
    if (!primaryWallet) {
      const storedNetwork = localStorage.getItem(SELECTED_NETWORK_KEY)
      let networkToSelect: number | null = null
      
      if (storedNetwork) {
        const networkId = parseInt(storedNetwork)
        if (availableNetworks.some(n => n.chainId === networkId)) {
          networkToSelect = networkId
        }
      }
      
      // Default to Hardhat Local (1337) if no stored network or stored network is invalid
      if (!networkToSelect && availableNetworks.some(n => n.chainId === 1337)) {
        networkToSelect = 1337
        localStorage.setItem(SELECTED_NETWORK_KEY, '1337')
        console.log('🏠 Defaulting to Hardhat Local for read-only mode')
      }
      
      if (networkToSelect) {
        setSelectedNetworkForReadOnly(networkToSelect)
        // Emit network change event for other components
        window.dispatchEvent(new CustomEvent('readOnlyNetworkChanged', { 
          detail: { chainId: networkToSelect, networkName: availableNetworks.find(n => n.chainId === networkToSelect)?.name } 
        }))
        console.log(`📡 Read-only network initialized: ${networkToSelect}`)
      }
    }
  }, [primaryWallet, availableNetworks])

  // Get current network from wallet when connected
  useEffect(() => {
    const getCurrentNetwork = async () => {
      if (primaryWallet) {
        try {
          const network = await primaryWallet.getNetwork()
          setCurrentNetwork(Number(network))
          // Clear read-only selection when wallet is connected
          setSelectedNetworkForReadOnly(null)
          localStorage.removeItem(SELECTED_NETWORK_KEY)
        } catch (error) {
          console.warn('Could not get current network:', error)
        }
      } else {
        setCurrentNetwork(null)
      }
    }
    getCurrentNetwork()
  }, [primaryWallet])

  const handleNetworkChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const chainId = parseInt(event.target.value)
    
    console.log('🔄 === NETWORK SWITCH ATTEMPT ===')
    console.log('  Target chainId:', chainId)
    console.log('  Wallet connected:', !!primaryWallet)
    console.log('  Target network:', availableNetworks.find(n => n.chainId === chainId))
    
    if (!primaryWallet) {
      // Handle read-only network selection (no wallet required)
      console.log('📖 Setting read-only network selection:', chainId)
      setSelectedNetworkForReadOnly(chainId)
      localStorage.setItem(SELECTED_NETWORK_KEY, chainId.toString())
      
      // Emit event for other components to listen to
      window.dispatchEvent(new CustomEvent('readOnlyNetworkChanged', { 
        detail: { chainId, networkName: availableNetworks.find(n => n.chainId === chainId)?.name } 
      }))
      
      console.log('✅ Read-only network selection complete')
      return
    }

    // Handle wallet-based network switching
    setLoading(true)
    
    try {
      console.log('🔍 Debugging wallet connector:', {
        connector: primaryWallet.connector,
        supportsNetworkSwitching: primaryWallet.connector?.supportsNetworkSwitching?.(),
        walletMethods: Object.keys(primaryWallet || {})
      })

      // Check wallet type for appropriate handling
      const connector = primaryWallet.connector
      const isSmartWallet = !!(connector as any).getAccountAbstractionProvider
      
      console.log('🔍 Wallet info:', {
        connectorType: connector.key,
        isSmartWallet,
        supportsNetworkSwitching: connector?.supportsNetworkSwitching?.()
      })
      
      if (isSmartWallet) {
        console.log('⚠️ Smart wallet detected - network switching not supported')
        alert(`⚠️ Smart wallets are deployed per-chain and don't support network switching.\n\nTo use a different network:\n1. Disconnect your current wallet\n2. Select the desired network in read-only mode\n3. Reconnect to create a new smart wallet on that network`)
        // Reset dropdown to current network
        event.target.value = currentNetwork?.toString() || ''
        setLoading(false)
        return
      }
      
      // Check if wallet supports network switching
      if (primaryWallet.connector?.supportsNetworkSwitching?.()) {
        console.log('🔄 Switching network using Dynamic method...')
        await primaryWallet.switchNetwork(chainId)
        setCurrentNetwork(chainId)
        console.log('✅ Dynamic network switch completed!')
        
        // Force a verification check
        setTimeout(async () => {
          try {
            const verifyChainId = await primaryWallet.getNetwork()
            console.log('🔍 Post-switch verification:', {
              targetChainId: chainId,
              actualChainId: Number(verifyChainId),
              switchSuccessful: Number(verifyChainId) === chainId
            })
          } catch (verifyError) {
            console.error('❌ Post-switch verification failed:', verifyError)
          }
        }, 1000)
        
      } else {
        console.log('⚠️ Wallet does not support Dynamic network switching, trying manual method...')
        // Fallback to manual method
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
        console.log('✅ Manual network switch completed!')
      }
      
      console.log('✅ Network switched successfully!')
      
      // Trigger a manual check to ensure state updates
      setTimeout(() => {
        console.log('🔄 Triggering post-switch network detection...')
        window.dispatchEvent(new CustomEvent('networkSwitched', { 
          detail: { chainId, networkName: availableNetworks.find(n => n.chainId === chainId)?.name } 
        }))
      }, 100)
    } catch (error: any) {
      console.error('❌ Failed to switch network:', error)
      const targetNetwork = availableNetworks.find(n => n.chainId === chainId)
      alert(`Failed to switch network: ${error.message}\n\nPlease try manually adding the network to your wallet:\n\nNetwork Name: ${targetNetwork?.name}\nChain ID: ${chainId}\nRPC URL: ${targetNetwork?.rpcUrls[0]}\nCurrency Symbol: ${targetNetwork?.nativeCurrency.symbol}`)
      // Reset dropdown to current network
      event.target.value = currentNetwork?.toString() || selectedNetworkForReadOnly?.toString() || ''
    } finally {
      setLoading(false)
      console.log('🔄 === NETWORK SWITCH ATTEMPT COMPLETE ===')
    }
  }

  // Get the effective network (wallet network or read-only selection)
  const effectiveNetwork = currentNetwork || selectedNetworkForReadOnly
  const networkMode = primaryWallet ? 'wallet' : 'read-only'

  // Debug function
  const debugNetworkState = async () => {
    const config = effectiveNetwork ? getNetworkConfig(effectiveNetwork) : null
    
    console.log('🐛 === NETWORK DEBUG STATE ===')
    console.log('  Wallet connected:', !!primaryWallet)
    console.log('  Network mode:', networkMode)
    console.log('  Current network (wallet):', currentNetwork)
    console.log('  Selected network (read-only):', selectedNetworkForReadOnly)
    console.log('  Effective network:', effectiveNetwork)
    console.log('  Available networks:', availableNetworks.map(n => ({ id: n.chainId, name: n.name })))
    console.log('  Effective network config:', config ? {
      name: config.name,
      contractAddress: config.contractAddress,
      active: config.active
    } : 'None')
    
    if (primaryWallet) {
    try {
      const networkFromWallet = await primaryWallet.getNetwork()
      console.log('  Wallet.getNetwork():', networkFromWallet, typeof networkFromWallet)
      console.log('  Wallet address:', primaryWallet.address)
      console.log('  Connector type:', primaryWallet.connector?.connectorType)
    } catch (error) {
        console.error('  Wallet network check failed:', error)
      }
    }
    console.log('🐛 === END NETWORK DEBUG ===')
  }

  return (
    <div css={containerStyle}>
      <label css={labelStyle}>🌐 Network:</label>
      <select 
        css={selectStyle}
        value={effectiveNetwork || ''}
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
      
      {/* Network status indicator */}
      <div css={statusStyle}>
        {loading && <span css={loadingStyle}>⏳ Switching...</span>}
        {!primaryWallet && effectiveNetwork && (
          <span css={readOnlyStyle}>👁️ Read-only</span>
        )}
        {primaryWallet && currentNetwork && (
          <span css={connectedStyle}>🔗 Connected</span>
        )}
      </div>
      
      {/* Debug panel */}
      <div css={debugPanelStyle}>
        <button css={debugButtonStyle} onClick={debugNetworkState}>
          🐛 Debug
        </button>
        <span css={networkInfoStyle}>
          {effectiveNetwork ? (
            `${availableNetworks.find(n => n.chainId === effectiveNetwork)?.name || 'Unknown'} (${effectiveNetwork}) ${networkMode}`
          ) : (
            'No network selected'
          )}
        </span>
      </div>
    </div>
  )
}

// Styles
const containerStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  flex-wrap: wrap;
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

const statusStyle = css`
  display: flex;
  align-items: center;
  gap: 5px;
`

const loadingStyle = css`
  color: #ffd700;
  font-size: 12px;
`

const readOnlyStyle = css`
  color: #88c999;
  font-size: 12px;
  background: rgba(136, 201, 153, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
`

const connectedStyle = css`
  color: #4caf50;
  font-size: 12px;
  background: rgba(76, 175, 80, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
`

const debugPanelStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 10px;
`

const debugButtonStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid #ffd700;
  border-radius: 4px;
  color: #ffd700;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 215, 0, 0.3);
  }
`

const networkInfoStyle = css`
  color: #ccc;
  font-size: 12px;
  font-family: monospace;
` 