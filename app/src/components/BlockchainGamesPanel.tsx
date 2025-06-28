/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react'
import { css } from '@emotion/react'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { DynamicConnectButton } from './DynamicConnectButton'
import { NetworkPicker } from './NetworkPicker'

interface BlockchainGame {
  id: number
  state: number
  creator: string
  maxPlayers: number
  currentPlayerIndex: number
  turnNumber: number
  playerAddresses: string[]
  playerScores: number[]
  createdAt: number
  allowIslands: boolean
}

interface BlockchainGamesPanelProps {
  onJoinGame?: (gameId: number) => void
}

export function BlockchainGamesPanel({ onJoinGame }: BlockchainGamesPanelProps = {}) {
  const { 
    createGame, 
    joinGame, 
    currentGame, 
    playerInfo, 
    loading, 
    error, 
    isConnected,
    getAllGames,
    contractAddress,
    networkName
  } = useBlockchainGame()
  
  const { primaryWallet } = useDynamicContext()
  const userAddress = primaryWallet?.address

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [gameName, setGameName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(2)
  const [allowIslands, setAllowIslands] = useState(false)
  const [availableGames, setAvailableGames] = useState<BlockchainGame[]>([])
  const [refreshingGames, setRefreshingGames] = useState(false)

  // Refresh available games when connected
  useEffect(() => {
    if (isConnected) {
      refreshGamesList()
    }
  }, [isConnected])

  const refreshGamesList = async () => {
    if (!isConnected) return
    
    setRefreshingGames(true)
    try {
      const games = await getAllGames()
      setAvailableGames(games)
    } catch (error) {
      console.error('Failed to refresh games list:', error)
    } finally {
      setRefreshingGames(false)
    }
  }

  const handleCreateGame = async () => {
    if (!gameName.trim()) {
      alert('Please enter a game name')
      return
    }

    try {
      await createGame(maxPlayers, allowIslands, 100, gameName.trim())
      setShowCreateForm(false)
      setGameName('')
      // Refresh the games list after creating
      await refreshGamesList()
    } catch (error) {
      console.error('Failed to create game:', error)
      alert('Failed to create game. Check console for details.')
    }
  }

  const handleJoinGame = async (gameId: number) => {
    try {
      console.log('🎮 Joining blockchain game:', gameId)
      
      // Join the game on the blockchain
      const result = await joinGame(gameId, 'Player')
      console.log('✅ Successfully joined game:', result)
      
      // Notify parent component if callback is provided
      if (onJoinGame) {
        onJoinGame(gameId)
      } else {
        alert(`Successfully joined game ${gameId}!`)
      }
      
      // Refresh games list
      await refreshGamesList()
    } catch (error) {
      console.error('❌ Failed to join game:', error)
      alert(`Failed to join game: ${error.message}`)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString()
  }

  const getGameStateText = (state: number) => {
    switch (state) {
      case 0: return 'Setup'
      case 1: return 'In Progress'
      case 2: return 'Completed'
      case 3: return 'Cancelled'
      default: return 'Unknown'
    }
  }

  // Debug logging - this will show in the browser console
  console.log('🔍 BlockchainGamesPanel state:', {
    isConnected,
    userAddress,
    contractAddress,
    loading,
    error,
    currentGame: currentGame?.id,
    playerInfo: playerInfo?.name,
    gameName
  })

  return (
    <div css={panelStyle}>
      <h2 css={titleStyle}>⛓️ Blockchain Games</h2>
      <div css={contractStyle}>
        Contract: {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : 'Not Connected'} ({networkName || 'Unknown Network'})
      </div>
      
      {/* Debug info */}
      <div css={debugStyle}>
        Status: {isConnected ? '✅ Connected' : '❌ Not Connected'}
        {isConnected && <div>Wallet: {userAddress}</div>}
      </div>
      
      {!isConnected ? (
        <div css={connectSectionStyle}>
          <p>Connect your wallet to create blockchain games</p>
          <DynamicConnectButton />
          <div css={instructionStyle}>
            👆 Click here to connect your wallet first!
          </div>
        </div>
      ) : (
        <div>
          <p css={walletStyle}>
            Connected: {formatAddress(userAddress!)}
          </p>
          
          {/* Network Picker Component */}
          <NetworkPicker />
          
          {/* Available Games List */}
          <div css={gamesSectionStyle}>
            <div css={sectionHeaderStyle}>
              <h3>🎮 Available Games</h3>
              <button 
                css={refreshButtonStyle}
                onClick={refreshGamesList}
                disabled={refreshingGames}
              >
                {refreshingGames ? '⟳' : '🔄'} Refresh
              </button>
            </div>

            {availableGames.length === 0 ? (
              <div css={noGamesStyle}>
                {refreshingGames ? 'Loading games...' : 'No games available. Create one below!'}
              </div>
            ) : (
              <div css={gamesListStyle}>
                {availableGames.map((game) => (
                  <div key={game.id} css={gameCardStyle}>
                    <div css={gameCardHeaderStyle}>
                      <span css={gameIdStyle}>Game #{game.id}</span>
                      <span css={gameStateStyle(game.state)}>
                        {getGameStateText(game.state)}
                      </span>
                    </div>
                    <div css={gameCardBodyStyle}>
                      <div css={gameInfoRowStyle}>
                        <span>Creator:</span>
                        <span css={addressStyle}>{formatAddress(game.creator)}</span>
                      </div>
                      <div css={gameInfoRowStyle}>
                        <span>Players:</span>
                        <span>{game.playerAddresses.length}/{game.maxPlayers}</span>
                      </div>
                      <div css={gameInfoRowStyle}>
                        <span>Created:</span>
                        <span>{formatTime(game.createdAt)}</span>
                      </div>
                      <div css={gameInfoRowStyle}>
                        <span>Islands:</span>
                        <span>{game.allowIslands ? '✅' : '❌'}</span>
                      </div>
                    </div>
                    <div css={gameCardActionsStyle}>
                      {game.state === 0 && game.playerAddresses.length < game.maxPlayers && 
                       !game.playerAddresses.includes(userAddress!) ? (
                        <button
                          css={joinButtonStyle}
                          onClick={() => handleJoinGame(game.id)}
                          disabled={loading}
                        >
                          {loading ? 'Joining...' : 'Join Game'}
                        </button>
                      ) : game.playerAddresses.includes(userAddress!) ? (
                        <div css={joinedActionsStyle}>
                          <span css={alreadyJoinedStyle}>✅ Joined</span>
                          <button
                            css={playGameButtonStyle}
                            onClick={() => {
                              console.log('🎮 Entering joined game:', game.id)
                              if (onJoinGame) {
                                onJoinGame(game.id)
                              }
                            }}
                          >
                            🎯 Play Game
                          </button>
                        </div>
                      ) : (
                        <span css={gameFullStyle}>Game Full</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {!currentGame ? (
            <div css={createSectionStyle}>
              {!showCreateForm ? (
                <div>
                  <button 
                    css={createButtonStyle} 
                    onClick={() => {
                      console.log('🎯 Create New Game button clicked!')
                      setShowCreateForm(true)
                    }}
                    disabled={loading}
                  >
                    {loading ? '⏳ Creating...' : '🎮 Create New Game'}
                  </button>
                  <div css={instructionStyle}>
                    👆 Click to start creating a blockchain game
                  </div>
                </div>
              ) : (
                <div css={formStyle}>
                  <h4 css={formTitleStyle}>Create Blockchain Game</h4>
                  <input
                    css={inputStyle}
                    placeholder="Enter your player name"
                    value={gameName}
                    onChange={(e) => {
                      console.log('📝 Player name changed:', e.target.value)
                      setGameName(e.target.value)
                    }}
                    disabled={loading}
                  />
                  <div css={formRowStyle}>
                    <label css={labelStyle}>
                      Max Players:
                      <select 
                        css={selectStyle}
                        value={maxPlayers} 
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                      >
                        <option value={1}>1 Player</option>
                        <option value={2}>2 Players</option>
                        <option value={3}>3 Players</option>
                        <option value={4}>4 Players</option>
                      </select>
                    </label>
                  </div>
                  <div css={formRowStyle}>
                    <label css={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={allowIslands}
                        onChange={(e) => setAllowIslands(e.target.checked)}
                      />
                      Allow Islands
                    </label>
                  </div>
                  <div css={buttonGroupStyle}>
                    <button 
                      css={submitButtonStyle} 
                      onClick={handleCreateGame}
                      disabled={loading || !gameName.trim()}
                    >
                      {loading ? '⏳ Creating...' : '🚀 Create Game'}
                    </button>
                    <button 
                      css={cancelButtonStyle} 
                      onClick={() => {
                        console.log('❌ Cancel button clicked')
                        setShowCreateForm(false)
                        setGameName('')
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                  <div css={instructionStyle}>
                    ⬆️ Enter name and click "Create Game" to make blockchain transaction
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div css={gameInfoStyle}>
              <h3 css={gameHeaderStyle}>🎮 Game #{currentGame.id}</h3>
              <div css={gameDetailsStyle}>
                <div css={gameDetailStyle}>
                  <span>Status:</span>
                  <span css={statusStyle}>
                    {currentGame.state === 0 ? 'Setup' : 
                     currentGame.state === 1 ? 'In Progress' : 'Completed'}
                  </span>
                </div>
                <div css={gameDetailStyle}>
                  <span>Players:</span>
                  <span>{currentGame.playerAddresses.length}/{currentGame.maxPlayers}</span>
                </div>
                {playerInfo && (
                  <>
                    <div css={gameDetailStyle}>
                      <span>Your Score:</span>
                      <span css={scoreStyle}>{playerInfo.score}</span>
                    </div>
                    <div css={gameDetailStyle}>
                      <span>Tiles in Hand:</span>
                      <span>{playerInfo.hand.length}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Styles
const panelStyle = css`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #ffd700;
  border-radius: 15px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.2);
  color: #fff;
`

const titleStyle = css`
  color: #ffd700;
  text-align: center;
  margin-bottom: 10px;
  font-size: 24px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`

const contractStyle = css`
  text-align: center;
  font-size: 12px;
  color: #888;
  margin-bottom: 20px;
  font-family: monospace;
`

const connectSectionStyle = css`
  text-align: center;
  padding: 30px 20px;
  
  p {
    color: #ccc;
    margin-bottom: 20px;
  }
`

const walletStyle = css`
  color: #ffd700;
  text-align: center;
  margin-bottom: 20px;
  font-family: monospace;
  background: rgba(255, 215, 0, 0.1);
  padding: 8px;
  border-radius: 6px;
`

const createSectionStyle = css`
  text-align: center;
`

const createButtonStyle = css`
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const formStyle = css`
  background: rgba(255, 215, 0, 0.05);
  border: 1px solid #ffd700;
  border-radius: 10px;
  padding: 20px;
  max-width: 300px;
  margin: 0 auto;
`

const formTitleStyle = css`
  color: #ffd700;
  margin: 0 0 15px 0;
  text-align: center;
  font-size: 18px;
`

const inputStyle = css`
  width: 100%;
  padding: 10px;
  border: 1px solid #ffd700;
  border-radius: 6px;
  background: rgba(255, 215, 0, 0.1);
  color: #fff;
  margin-bottom: 15px;
  
  &::placeholder {
    color: #888;
  }
`

const buttonGroupStyle = css`
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-top: 15px;
`

const submitButtonStyle = css`
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  flex: 1;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const cancelButtonStyle = css`
  background: transparent;
  color: #ffd700;
  border: 1px solid #ffd700;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  flex: 1;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const gameInfoStyle = css`
  text-align: center;
`

const gameHeaderStyle = css`
  color: #ffd700;
  margin-bottom: 15px;
`

const gameDetailsStyle = css`
  background: rgba(255, 215, 0, 0.05);
  border: 1px solid #ffd700;
  border-radius: 10px;
  padding: 15px;
`

const gameDetailStyle = css`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const statusStyle = css`
  color: #4ade80;
  font-weight: bold;
`

const scoreStyle = css`
  color: #ffd700;
  font-weight: bold;
`

const debugStyle = css`
  text-align: center;
  margin-bottom: 20px;
`

const instructionStyle = css`
  color: #888;
  margin-top: 10px;
`

const gamesSectionStyle = css`
  margin-bottom: 20px;
`

const sectionHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`

const refreshButtonStyle = css`
  background: transparent;
  color: #ffd700;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
  }
`

const noGamesStyle = css`
  text-align: center;
  color: #888;
`

const gamesListStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const gameCardStyle = css`
  background: rgba(255, 215, 0, 0.05);
  border: 1px solid #ffd700;
  border-radius: 10px;
  padding: 10px;
  width: calc(33.33% - 10px);
`

const gameCardHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`

const gameCardBodyStyle = css`
  margin-bottom: 10px;
`

const gameInfoRowStyle = css`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`

const gameCardActionsStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const gameIdStyle = css`
  font-weight: bold;
`

const gameStateStyle = (state: number) => css`
  color: ${state === 0 ? '#4ade80' : state === 1 ? '#ffd700' : '#ff4d4d'};
  font-weight: bold;
`

const addressStyle = css`
  color: #888;
`

const alreadyJoinedStyle = css`
  color: #4ade80;
  font-weight: bold;
`

const gameFullStyle = css`
  color: #ff4d4d;
  font-weight: bold;
`

const labelStyle = css`
  color: #888;
  margin-right: 10px;
`

const selectStyle = css`
  padding: 5px;
  border: 1px solid #ffd700;
  border-radius: 6px;
  background: rgba(255, 215, 0, 0.1);
  color: #fff;
`

const checkboxLabelStyle = css`
  color: #888;
`

const formRowStyle = css`
  margin-bottom: 10px;
`

const joinButtonStyle = css`
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(74, 222, 128, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const joinedActionsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`

const playGameButtonStyle = css`
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`