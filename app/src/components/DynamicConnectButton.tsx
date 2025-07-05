/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState, useEffect } from 'react'
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useBlockchainGame } from '../hooks/useBlockchainGame'

export function DynamicConnectButton() {
  const { setShowAuthFlow, user, handleLogOut, primaryWallet } = useDynamicContext()
  const { getContractAddress } = useBlockchainGame()
  const [showDetails, setShowDetails] = useState(false)
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null)

  // Get smart wallet address when wallet is connected
  useEffect(() => {
    const updateAddresses = async () => {
      if (primaryWallet && getContractAddress) {
        try {
          const contractAddr = await getContractAddress()
          setSmartWalletAddress(contractAddr)
        } catch (error) {
          console.warn('⚠️ Could not get contract address:', error)
          setSmartWalletAddress(null)
        }
      } else {
        setSmartWalletAddress(null)
      }
    }

    updateAddresses()
  }, [primaryWallet, getContractAddress])

  const handleConnect = () => {
    try {
      console.log('🔌 Attempting to connect via Dynamic...')
      setShowAuthFlow(true)
    } catch (error) {
      console.error('❌ Error opening Dynamic auth flow:', error)
    }
  }

  const handleDisconnect = () => {
    try {
      console.log('🔌 Attempting to disconnect from Dynamic...')
      handleLogOut()
      setShowDetails(false)
    } catch (error) {
      console.error('❌ Error during Dynamic logout:', error)
    }
  }

  const handleToggleDetails = () => {
    setShowDetails(!showDetails)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    console.log(`📋 Copied ${label}:`, text)
    alert(`${label} copied to clipboard!`)
  }

  // Debug current Dynamic state
  console.log('🔍 Dynamic state:', {
    user: !!user,
    userEmail: user?.email,
    userAlias: user?.alias,
    primaryWallet: !!primaryWallet,
    walletAddress: primaryWallet?.address,
    smartWalletAddress,
    setShowAuthFlow: !!setShowAuthFlow,
    handleLogOut: !!handleLogOut
  })

  if (user && primaryWallet) {
    const displayName = user.email || user.alias || 'Connected'
    const eoaAddress = primaryWallet.address
    const isZeroDev = smartWalletAddress && smartWalletAddress !== eoaAddress
    const contractAddress = smartWalletAddress || eoaAddress

    return (
      <div css={connectedContainerStyle}>
        {!showDetails ? (
          // Compact view
          <div css={compactViewStyle}>
            <span css={userInfoStyle}>
              {displayName.length > 15 ? `${displayName.slice(0, 12)}...` : displayName}
            </span>
            <button css={detailsButtonStyle} onClick={handleToggleDetails} title="Show wallet details">
              👤
            </button>
            <button css={disconnectButtonStyle} onClick={handleDisconnect} title="Disconnect Wallet">
              ⚡
            </button>
          </div>
        ) : (
          // Detailed view
          <div css={detailedViewStyle}>
            <div css={detailsHeaderStyle}>
              <h4 css={detailsTitleStyle}>Wallet Details</h4>
              <button css={closeDetailsButtonStyle} onClick={handleToggleDetails}>
                ✕
              </button>
            </div>
            
            <div css={detailsContentStyle}>
              {/* User Info */}
              <div css={detailSectionStyle}>
                <strong css={sectionLabelStyle}>👤 User</strong>
                <div css={userDetailStyle}>
                  <span css={userNameStyle}>{user.email || user.alias || 'Anonymous'}</span>
                  {user.email && (
                    <span css={emailDetailStyle}>{user.email}</span>
                  )}
                </div>
              </div>

              {/* Wallet Type */}
              <div css={detailSectionStyle}>
                <strong css={sectionLabelStyle}>🔗 Wallet Type</strong>
                <div css={walletTypeStyle}>
                  {isZeroDev ? (
                    <span css={smartWalletStyle}>🔒 ZeroDev Smart Wallet (Gasless)</span>
                  ) : (
                    <span css={regularWalletStyle}>💰 Regular Wallet (Gas Required)</span>
                  )}
                </div>
              </div>

              {/* Address Info */}
              <div css={detailSectionStyle}>
                <strong css={sectionLabelStyle}>📍 Addresses</strong>
                
                {/* Display Address (EOA) */}
                <div css={addressRowStyle}>
                  <span css={addressLabelStyle}>Display:</span>
                  <span css={addressValueStyle} onClick={() => copyToClipboard(eoaAddress, 'Display Address')}>
                    {formatAddress(eoaAddress)}
                  </span>
                  <button css={copyButtonStyle} onClick={() => copyToClipboard(eoaAddress, 'Display Address')}>
                    📋
                  </button>
                </div>

                {/* Contract Interaction Address */}
                <div css={addressRowStyle}>
                  <span css={addressLabelStyle}>Game:</span>
                  <span css={addressValueStyle} onClick={() => copyToClipboard(contractAddress, 'Game Address')}>
                    {formatAddress(contractAddress)}
                  </span>
                  <button css={copyButtonStyle} onClick={() => copyToClipboard(contractAddress, 'Game Address')}>
                    📋
                  </button>
                  {isZeroDev && (
                    <span css={addressNoteStyle}>(Smart Wallet)</span>
                  )}
                </div>

                {/* Address Explanation */}
                <div css={addressExplanationStyle}>
                  {isZeroDev ? (
                    <>
                      <p>🔍 <strong>Display Address:</strong> Your wallet's main address</p>
                      <p>🎮 <strong>Game Address:</strong> Smart wallet used for games (gasless transactions)</p>
                    </>
                  ) : (
                    <p>🔍 Both addresses are the same - you're using a regular wallet</p>
                  )}
                </div>
              </div>

              {/* ZeroDev Test Information */}
              {isZeroDev && (
                <div css={detailSectionStyle}>
                  <strong css={sectionLabelStyle}>🧪 ZeroDev Test Info</strong>
                  
                  <div css={testInfoContainerStyle}>
                    {/* Paymaster Status */}
                    <div css={testRowStyle}>
                      <span css={testLabelStyle}>💰 Paymaster:</span>
                      <span css={testValueStyle}>
                        {primaryWallet.connector?.key?.includes('zerodev') ? '✅ Active' : '❓ Unknown'}
                      </span>
                    </div>

                    {/* Smart Wallet Deployment */}
                    <div css={testRowStyle}>
                      <span css={testLabelStyle}>🚀 Deployment:</span>
                      <span css={testValueStyle}>
                        {smartWalletAddress ? '✅ Deployed' : '⏳ Pending'}
                      </span>
                    </div>

                    {/* Gasless Transactions */}
                    <div css={testRowStyle}>
                      <span css={testLabelStyle}>⛽ Gas Policy:</span>
                      <span css={testValueStyle}>Sponsored</span>
                    </div>

                    {/* Network Compatibility */}
                    <div css={testRowStyle}>
                      <span css={testLabelStyle}>🌐 Network:</span>
                      <span css={testValueStyle}>Per-chain deployment</span>
                    </div>

                    {/* Address Consistency Test */}
                    <div css={testRowStyle}>
                      <span css={testLabelStyle}>🔄 Address Match:</span>
                      <span css={testValueStyle}>
                        {eoaAddress !== contractAddress ? '✅ Different (Expected)' : '❌ Same (Unexpected)'}
                      </span>
                    </div>

                    {/* Test Actions */}
                    <div css={testActionsStyle}>
                      <button 
                        css={testButtonStyle}
                        onClick={() => {
                          console.log('🧪 ZeroDev Debug Info:', {
                            connectorKey: primaryWallet.connector?.key,
                            eoaAddress: eoaAddress,
                            smartWalletAddress: smartWalletAddress,
                            addressDifferent: eoaAddress !== contractAddress,
                            connectorMethods: Object.keys(primaryWallet.connector || {}),
                            hasAAProvider: !!(primaryWallet.connector as any)?.getAccountAbstractionProvider,
                            timestamp: new Date().toISOString()
                          })
                          alert('ZeroDev debug info logged to console! Check browser console for details.')
                        }}
                      >
                        🔍 Debug Log
                      </button>

                      <button 
                        css={testButtonStyle}
                        onClick={async () => {
                          try {
                            // Test getting smart wallet details
                            const connector = primaryWallet.connector
                            const aaProvider = (connector as any)?.getAccountAbstractionProvider?.({
                              withSponsorship: true
                            })
                            
                            console.log('🧪 ZeroDev AA Provider Test:', {
                              hasProvider: !!aaProvider,
                              accountAddress: aaProvider?.account?.address,
                              providerMethods: aaProvider ? Object.keys(aaProvider) : [],
                              accountMethods: aaProvider?.account ? Object.keys(aaProvider.account) : []
                            })
                            
                            alert('ZeroDev AA provider test completed! Check console for details.')
                          } catch (error) {
                            console.error('❌ ZeroDev AA provider test failed:', error)
                            alert(`ZeroDev test failed: ${error.message}`)
                          }
                        }}
                      >
                        🔬 Test AA
                      </button>
                    </div>

                    {/* Debug Information */}
                    <div css={debugInfoStyle}>
                      <p><strong>Connector Type:</strong> {primaryWallet.connector?.key || 'Unknown'}</p>
                      <p><strong>Smart Contract:</strong> {smartWalletAddress ? 'Yes' : 'No'}</p>
                      <p><strong>Expected Behavior:</strong> Gasless transactions for game actions</p>
                      <p><strong>Address Mapping:</strong> EOA → Smart Wallet for contract calls</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Regular Wallet Test Information */}
              {!isZeroDev && (
                <div css={detailSectionStyle}>
                  <strong css={sectionLabelStyle}>🧪 Wallet Test Info</strong>
                  
                  <div css={testInfoContainerStyle}>
                    <div css={testRowStyle}>
                      <span css={testLabelStyle}>💰 Gas Fees:</span>
                      <span css={testValueStyle}>Required for transactions</span>
                    </div>

                    <div css={testRowStyle}>
                      <span css={testLabelStyle}>🔄 Address:</span>
                      <span css={testValueStyle}>Single address for all interactions</span>
                    </div>

                    <div css={debugInfoStyle}>
                      <p><strong>Wallet Type:</strong> {primaryWallet.connector?.key || 'Unknown'}</p>
                      <p><strong>Transaction Mode:</strong> Standard (gas required)</p>
                      <p><strong>Address Usage:</strong> Same address for display and contracts</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div css={actionsStyle}>
                <button css={disconnectButtonLargeStyle} onClick={handleDisconnect}>
                  ⚡ Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <button css={connectButtonStyle} onClick={handleConnect} title="Connect Wallet">
      🔗 Connect
    </button>
  )
}

// Updated styles
const connectButtonStyle = css`
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 12px;
  padding: 8px 16px;
  color: #FFD700;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.2));
    border-color: #FFD700;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const connectedContainerStyle = css`
  position: relative;
  backdrop-filter: blur(5px);
`

const compactViewStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 128, 0, 0.1);
  border: 2px solid rgba(0, 255, 0, 0.3);
  border-radius: 12px;
  padding: 6px 12px;
`

const detailedViewStyle = css`
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 16px;
  min-width: 350px;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  color: #fff;
`

const detailsHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
`

const detailsTitleStyle = css`
  color: #ffd700;
  margin: 0;
  font-size: 1.1rem;
`

const closeDetailsButtonStyle = css`
  background: transparent;
  border: none;
  color: #ccc;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px;
  
  &:hover {
    color: #fff;
  }
`

const detailsContentStyle = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const detailSectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const sectionLabelStyle = css`
  color: #ffd700;
  font-size: 0.9rem;
  margin-bottom: 4px;
`

const userDetailStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const userNameStyle = css`
  color: #fff;
  font-weight: 600;
`

const emailDetailStyle = css`
  color: #ccc;
  font-size: 0.8rem;
`

const walletTypeStyle = css`
  font-size: 0.9rem;
`

const smartWalletStyle = css`
  color: #4ade80;
  font-weight: 600;
`

const regularWalletStyle = css`
  color: #fbbf24;
  font-weight: 600;
`

const addressRowStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`

const addressLabelStyle = css`
  color: #ccc;
  font-size: 0.8rem;
  min-width: 60px;
`

const addressValueStyle = css`
  font-family: monospace;
  color: #ffd700;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
  }
`

const copyButtonStyle = css`
  background: transparent;
  border: none;
  color: #ffd700;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px;
  
  &:hover {
    transform: scale(1.1);
  }
`

const addressNoteStyle = css`
  color: #4ade80;
  font-size: 0.7rem;
  font-style: italic;
`

const addressExplanationStyle = css`
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  
  p {
    margin: 0 0 4px 0;
    font-size: 0.8rem;
    color: #ccc;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  strong {
    color: #ffd700;
  }
`

const actionsStyle = css`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 215, 0, 0.3);
`

const disconnectButtonLargeStyle = css`
  background: rgba(255, 99, 71, 0.2);
  border: 1px solid rgba(255, 99, 71, 0.4);
  border-radius: 8px;
  padding: 8px 16px;
  color: #FF6347;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  
  &:hover {
    background: rgba(255, 99, 71, 0.3);
    border-color: #FF6347;
    transform: translateY(-1px);
  }
`

const userInfoStyle = css`
  color: #90EE90;
  font-size: 0.8rem;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const detailsButtonStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 6px;
  padding: 4px 8px;
  color: #FFD700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.3);
    border-color: #FFD700;
    transform: scale(1.05);
  }
`

const disconnectButtonStyle = css`
  background: rgba(255, 99, 71, 0.2);
  border: 1px solid rgba(255, 99, 71, 0.4);
  border-radius: 6px;
  padding: 4px 8px;
  color: #FF6347;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 99, 71, 0.3);
    border-color: #FF6347;
    transform: scale(1.05);
  }
`

const testInfoContainerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const testRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const testLabelStyle = css`
  color: #ccc;
  font-size: 0.8rem;
`

const testValueStyle = css`
  font-family: monospace;
  color: #ffd700;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
  }
`

const testActionsStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const testButtonStyle = css`
  background: transparent;
  border: none;
  color: #ffd700;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px;
  
  &:hover {
    transform: scale(1.1);
  }
`

const debugInfoStyle = css`
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  
  p {
    margin: 0 0 4px 0;
    font-size: 0.8rem;
    color: #ccc;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  strong {
    color: #ffd700;
  }
` 