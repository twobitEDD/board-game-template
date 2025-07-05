/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useMemo } from 'react'
import { css } from '@emotion/react'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { useGameCache } from '../hooks/useGameCache'

interface GameSpectatorProps {
  gameId: number
  onClose?: () => void
  compact?: boolean // For gallery view
}

interface PlacedTile {
  x: number
  y: number
  number: number
}

export function GameSpectator({ gameId, onClose, compact = false }: GameSpectatorProps) {
  console.log(`🔍 GameSpectator: Initializing for game ${gameId}, compact: ${compact}`)
  
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([])
  const [gameMessage, setGameMessage] = useState('Loading game...')
  const [currentGame, setCurrentGame] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allPlayersScores, setAllPlayersScores] = useState<{[address: string]: number}>({})

  const blockchainGame = useBlockchainGame()

  // Fetch game data using getGameState directly
  const fetchGameData = async () => {
    try {
      console.log(`🔍 GameSpectator: Fetching game ${gameId} using blockchainGame.getGameState()`)
      setIsLoading(true)
      setError(null)
      
      // Try to get the specific game directly
      const game = await blockchainGame.getGameState(gameId)
      
      if (game) {
        console.log(`✅ GameSpectator: Found game ${gameId}:`, {
          state: game.state,
          players: game.playerAddresses.length,
          turnNumber: game.turnNumber,
          playerAddresses: game.playerAddresses,
          scores: game.playerScores
        })
        setCurrentGame(game)
        setError(null)
        
        // Create scores map
        const scoresMap: {[address: string]: number} = {}
        game.playerAddresses.forEach((addr: string, index: number) => {
          scoresMap[addr] = game.playerScores[index] || 0
        })
        setAllPlayersScores(scoresMap)
        
      } else {
        console.warn(`⚠️ GameSpectator: Game ${gameId} not found or could not be fetched`)
        // Don't set error if we have tiles - show limited view instead
        if (placedTiles.length === 0) {
          setError(`Game ${gameId} not found`)
        } else {
          console.log(`📊 GameSpectator: Showing limited view with ${placedTiles.length} tiles`)
        }
      }
    } catch (error) {
      console.error(`❌ GameSpectator: Error fetching game ${gameId}:`, error)
      // Don't set error if we have tiles - show limited view instead
      if (placedTiles.length === 0) {
        setError(`Failed to load game: ${error.message}`)
      } else {
        console.log(`📊 GameSpectator: Showing limited view with ${placedTiles.length} tiles despite error`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Load game data on mount and when gameId changes
  useEffect(() => {
    fetchGameData()
  }, [gameId])

  // Use correct fallback contract address for Base Sepolia
  const actualContractAddress = blockchainGame.contractAddress || '0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F'

  // Use cache system for placed tiles
  const { 
    placedTiles: cachedTiles,
    refreshData: refreshCache
  } = useGameCache({
    blockchainGameId: gameId,
    contractAddress: actualContractAddress,
    networkName: blockchainGame.networkName || 'Base Sepolia',
    chainId: blockchainGame.currentNetwork || 84532
  })

  // Update placed tiles from cache
  useEffect(() => {
    if (cachedTiles) {
      const formattedTiles = cachedTiles.map(tile => ({
        x: tile.x,
        y: tile.y,
        number: tile.number || tile.displayNumber
      }))
      setPlacedTiles(formattedTiles)
      console.log(`✅ GameSpectator: Updated ${formattedTiles.length} placed tiles from cache`)
    }
  }, [cachedTiles])

  // Enhanced debug info
  useEffect(() => {
    console.log(`🔍 GameSpectator Debug for game ${gameId}:`, {
      hasCurrentGame: !!currentGame,
      currentGameData: currentGame,
      isLoading,
      error,
      blockchainContract: actualContractAddress,
      placedTilesCount: placedTiles.length,
      cachedTilesCount: cachedTiles?.length || 0,
      networkName: blockchainGame.networkName,
      currentNetwork: blockchainGame.currentNetwork
    })
  }, [currentGame, isLoading, error, placedTiles, cachedTiles, actualContractAddress, gameId])

  // Update game message based on state
  useEffect(() => {
    if (error && placedTiles.length === 0) {
      setGameMessage(`Error: ${error}`)
    } else if (isLoading) {
      setGameMessage('Loading game...')
    } else if (!currentGame && placedTiles.length > 0) {
      setGameMessage('Limited view - Connect wallet for full game info')
    } else if (!currentGame) {
      setGameMessage('Game not found')
    } else if (currentGame.state === 0) {
      setGameMessage('Game is in setup phase - Connect wallet to join!')
    } else if (currentGame.state === 1) {
      const currentPlayerAddr = currentGame.playerAddresses[currentGame.currentPlayerIndex]
      setGameMessage(`Game in progress - ${currentPlayerAddr?.slice(0, 6)}...${currentPlayerAddr?.slice(-4)}'s turn`)
    } else if (currentGame.state === 2) {
      setGameMessage('Game completed!')
    } else {
      setGameMessage('Game cancelled')
    }
  }, [currentGame, error, isLoading, placedTiles.length])

  // Player information
  const players = useMemo(() => {
    if (!currentGame) return []
    
    return currentGame.playerAddresses.map((address: string, index: number) => ({
      address,
      name: `Player ${index + 1}`,
      score: currentGame.playerScores?.[index] || allPlayersScores[address] || 0,
      isCurrent: index === currentGame.currentPlayerIndex
    }))
  }, [currentGame, allPlayersScores])

  // Use cache refresh function
  const refreshData = refreshCache

  if (compact) {
    return (
      <div css={compactContainerStyle}>
        <div css={compactBoardStyle}>
          {Array.from({ length: 15 }, (_, row) =>
            Array.from({ length: 15 }, (_, col) => {
              const tile = placedTiles.find(t => t.x === col && t.y === row)
              const isCenter = row === 7 && col === 7
              
              return (
                <div
                  key={`${row}-${col}`}
                  css={[compactCellStyle, isCenter && compactCenterStyle]}
                >
                  {tile ? (
                    <span css={compactTileNumberStyle}>{tile.number}</span>
                  ) : isCenter ? (
                    <span css={compactCenterMarkerStyle}>★</span>
                  ) : null}
                </div>
              )
            })
          ).flat()}
        </div>
      </div>
    )
  }

  return (
    <div css={containerStyle}>
      {/* Header */}
      <div css={headerStyle}>
        <div css={headerLeftStyle}>
          <h1 css={titleStyle}>Game #{gameId} - Spectator Mode</h1>
          <div css={statusStyle}>{gameMessage}</div>
        </div>
        <div css={headerRightStyle}>
          <button css={refreshButtonStyle} onClick={refreshData} disabled={isLoading}>
            {isLoading ? '⏳' : '🔄'} Refresh
          </button>
          {onClose && (
            <button css={closeButtonStyle} onClick={onClose}>
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Player Info */}
      {players.length > 0 && (
        <div css={playersStyle}>
          <h3 css={sectionTitleStyle}>Players</h3>
          <div css={playersListStyle}>
            {players.map((player, index) => (
              <div key={player.address} css={[playerCardStyle, player.isCurrent && currentPlayerStyle]}>
                <div css={playerNameStyle}>
                  {player.name}
                  {player.isCurrent && <span css={currentIndicatorStyle}>●</span>}
                </div>
                <div css={playerAddressStyle}>
                  {player.address.slice(0, 6)}...{player.address.slice(-4)}
                </div>
                <div css={playerScoreStyle}>{player.score} pts</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Game Info */}
      {currentGame && (
        <div css={enhancedGameInfoStyle}>
          <div css={gameStatsGridStyle}>
            <div css={statCardStyle}>
              <div css={statValueStyle}>{currentGame.turnNumber}</div>
              <div css={statLabelStyle}>Turn</div>
            </div>
            <div css={statCardStyle}>
              <div css={statValueStyle}>{currentGame.playerAddresses.length}/{currentGame.maxPlayers}</div>
              <div css={statLabelStyle}>Players</div>
            </div>
            <div css={statCardStyle}>
              <div css={statValueStyle}>{currentGame.tilesRemaining}</div>
              <div css={statLabelStyle}>Tiles Left</div>
            </div>
            <div css={statCardStyle}>
              <div css={statValueStyle}>{placedTiles.length}</div>
              <div css={statLabelStyle}>Placed</div>
            </div>
          </div>
          
          <div css={gameStatusCardStyle}>
            <div css={statusIconStyle}>
              {currentGame.state === 0 ? '⏳' : 
               currentGame.state === 1 ? '🎮' : 
               currentGame.state === 2 ? '🏆' : '❌'}
            </div>
            <div css={statusTextStyle}>
              {currentGame.state === 0 ? 'Setup Phase' : 
               currentGame.state === 1 ? 'In Progress' : 
               currentGame.state === 2 ? 'Completed' : 'Cancelled'}
            </div>
          </div>
        </div>
      )}

      {/* Limited View Notice */}
      {!currentGame && placedTiles.length > 0 && (
        <div css={limitedViewNoticeStyle}>
          <div css={limitedViewContentStyle}>
            <span css={limitedViewIconStyle}>👁️</span>
            <span css={limitedViewTextStyle}>Limited View</span>
            <span css={limitedViewHintStyle}>Connect wallet to see player info and scores</span>
          </div>
        </div>
      )}

      {/* Enhanced Limited View */}
      {!currentGame && placedTiles.length > 0 && (
        <div css={enhancedLimitedViewStyle}>
          <div css={limitedStatsStyle}>
            <div css={limitedStatCardStyle}>
              <div css={limitedStatValueStyle}>{placedTiles.length}</div>
              <div css={limitedStatLabelStyle}>Tiles Placed</div>
            </div>
            <div css={limitedStatCardStyle}>
              <div css={limitedStatValueStyle}>👁️</div>
              <div css={limitedStatLabelStyle}>Spectator Mode</div>
            </div>
          </div>
        </div>
      )}

      {/* Game Board */}
      <div css={boardContainerStyle}>
        <div css={boardStyle}>
          {Array.from({ length: 15 }, (_, row) =>
            Array.from({ length: 15 }, (_, col) => {
              const tile = placedTiles.find(t => t.x === col && t.y === row)
              const isCenter = row === 7 && col === 7
              
              return (
                <div
                  key={`${row}-${col}`}
                  css={[cellStyle, isCenter && centerCellStyle]}
                >
                  {tile ? (
                    <div css={tileStyle}>
                      <span css={tileNumberStyle}>{tile.number}</span>
                    </div>
                  ) : isCenter ? (
                    <div css={centerMarkerStyle}>★</div>
                  ) : null}
                </div>
              )
            })
          ).flat()}
        </div>
      </div>

      {/* Call to Action */}
      {!currentGame && placedTiles.length > 0 && (
        <div css={callToActionStyle}>
          <div css={ctaContentStyle}>
            <div css={ctaIconStyle}>🎮</div>
            <div css={ctaTitleStyle}>Want to Join the Game?</div>
            <div css={ctaDescriptionStyle}>
              Connect your wallet to see player scores, join the game, and make moves!
            </div>
            <div css={ctaFeaturesStyle}>
              <div css={ctaFeatureStyle}>👥 See all players and scores</div>
              <div css={ctaFeatureStyle}>🎯 Join games in setup phase</div>
              <div css={ctaFeatureStyle}>🎲 Make strategic moves</div>
            </div>
          </div>
        </div>
      )}

      {/* Game Info */}
      <div css={gameInfoStyle}>
        <div css={infoItemStyle}>
          <span css={infoLabelStyle}>Turn:</span>
          <span css={infoValueStyle}>{currentGame?.turnNumber || 0}</span>
        </div>
        <div css={infoItemStyle}>
          <span css={infoLabelStyle}>Tiles on Board:</span>
          <span css={infoValueStyle}>{placedTiles.length}</span>
        </div>
        <div css={infoItemStyle}>
          <span css={infoLabelStyle}>Pool Remaining:</span>
          <span css={infoValueStyle}>{currentGame?.tilesRemaining || 0}</span>
        </div>
        <div css={infoItemStyle}>
          <span css={infoLabelStyle}>Status:</span>
          <span css={infoValueStyle}>
            {currentGame?.state === 0 ? 'Setup' : 
             currentGame?.state === 1 ? 'In Progress' : 
             currentGame?.state === 2 ? 'Completed' : 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Styles
const containerStyle = css`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const headerLeftStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const headerRightStyle = css`
  display: flex;
  gap: 1rem;
`

const titleStyle = css`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`

const statusStyle = css`
  font-size: 0.9rem;
  opacity: 0.8;
`

const refreshButtonStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const closeButtonStyle = css`
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background: rgba(255, 0, 0, 0.3);
  }
`

const playersStyle = css`
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.1);
`

const sectionTitleStyle = css`
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`

const playersListStyle = css`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`

const playerCardStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  min-width: 150px;
  text-align: center;
`

const currentPlayerStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
`

const playerNameStyle = css`
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`

const currentIndicatorStyle = css`
  color: #ffd700;
  font-size: 0.8rem;
`

const limitedViewNoticeStyle = css`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 16px 0;
`

const limitedViewContentStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #FFC107;
  font-size: 0.9rem;
`

const limitedViewIconStyle = css`
  font-size: 1rem;
`

const limitedViewTextStyle = css`
  font-weight: bold;
`

const limitedViewHintStyle = css`
  opacity: 0.8;
  font-size: 0.8rem;
`

const enhancedGameInfoStyle = css`
  padding: 1rem 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const gameStatsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`

const statCardStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const statValueStyle = css`
  font-size: 1.5rem;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 0.25rem;
`

const statLabelStyle = css`
  font-size: 0.8rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const gameStatusCardStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  backdrop-filter: blur(10px);
`

const statusIconStyle = css`
  font-size: 1.5rem;
`

const statusTextStyle = css`
  font-size: 1rem;
  font-weight: 600;
`

const enhancedLimitedViewStyle = css`
  padding: 1rem 2rem;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05));
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
`

const limitedStatsStyle = css`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`

const limitedStatCardStyle = css`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  backdrop-filter: blur(10px);
`

const limitedStatValueStyle = css`
  font-size: 1.5rem;
  font-weight: bold;
  color: #FFC107;
  margin-bottom: 0.25rem;
`

const limitedStatLabelStyle = css`
  font-size: 0.8rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const callToActionStyle = css`
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05));
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 16px;
  margin: 2rem;
  padding: 2rem;
  text-align: center;
  backdrop-filter: blur(10px);
  animation: subtlePulse 3s ease-in-out infinite;
  
  @keyframes subtlePulse {
    0%, 100% {
      box-shadow: 0 0 0 rgba(76, 175, 80, 0.3);
    }
    50% {
      box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
    }
  }
`

const ctaContentStyle = css`
  max-width: 500px;
  margin: 0 auto;
`

const ctaIconStyle = css`
  font-size: 3rem;
  margin-bottom: 1rem;
`

const ctaTitleStyle = css`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 0.5rem;
`

const ctaDescriptionStyle = css`
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`

const ctaFeaturesStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
`

const ctaFeatureStyle = css`
  font-size: 0.9rem;
  opacity: 0.8;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const playerAddressStyle = css`
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 0.5rem;
`

const playerScoreStyle = css`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffd700;
`

const boardContainerStyle = css`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1));
`

const boardStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 35px);
  grid-template-rows: repeat(15, 35px);
  gap: 1px;
  background: rgba(0, 0, 0, 0.4);
  padding: 15px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
`

const cellStyle = css`
  width: 35px;
  height: 35px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const centerCellStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
`

const tileStyle = css`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`

const tileNumberStyle = css`
  font-size: 0.9rem;
`

const centerMarkerStyle = css`
  color: #ffd700;
  font-size: 1.2rem;
`

const gameInfoStyle = css`
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const infoItemStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`

const infoLabelStyle = css`
  font-size: 0.8rem;
  opacity: 0.7;
`

const infoValueStyle = css`
  font-size: 1.1rem;
  font-weight: 600;
`

// Compact styles for gallery view
const compactContainerStyle = css`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const compactBoardStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 8px);
  grid-template-rows: repeat(15, 8px);
  gap: 0.5px;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px;
  border-radius: 4px;
`

const compactCellStyle = css`
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const compactCenterStyle = css`
  background: rgba(255, 215, 0, 0.3);
`

const compactTileNumberStyle = css`
  font-size: 6px;
  color: white;
  font-weight: bold;
`

const compactCenterMarkerStyle = css`
  font-size: 6px;
  color: #ffd700;
`