/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useMemo } from 'react'
import { css } from '@emotion/react'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { useGameCache } from '../hooks/useGameCache'

interface GameBoardProps {
  gameId: number
  playerRole: {
    isPlayer: boolean
    isSpectator: boolean
    canMakeMove: boolean
    playerIndex: number | null
    address: string | null
  }
  compact?: boolean // For gallery view
  onClose?: () => void
}

interface PlacedTile {
  x: number
  y: number
  number: number
}

interface TilePlacement {
  number: number
  x: number
  y: number
}

export function GameBoard({ gameId, playerRole, compact = false, onClose }: GameBoardProps) {
  console.log(`🎮 GameBoard: Initializing for game ${gameId}`, {
    isPlayer: playerRole.isPlayer,
    canMakeMove: playerRole.canMakeMove,
    playerIndex: playerRole.playerIndex,
    compact
  })
  
  // Game state
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([])
  const [currentGame, setCurrentGame] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allPlayersScores, setAllPlayersScores] = useState<{[address: string]: number}>({})

  // Player-specific state (only used when isPlayer is true)
  const [playerHand, setPlayerHand] = useState<number[]>([])
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [pendingPlacements, setPendingPlacements] = useState<TilePlacement[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const blockchainGame = useBlockchainGame()

  // Fetch game data
  const fetchGameData = async () => {
    try {
      console.log(`🔍 GameBoard: Fetching game ${gameId} data`)
      setIsLoading(true)
      setError(null)
      
      const allGames = await blockchainGame.getAllGames()
      const game = allGames.find(g => g.id === gameId)
      
      if (game) {
        console.log(`✅ GameBoard: Found game ${gameId}:`, {
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
        console.warn(`⚠️ GameBoard: Game ${gameId} not found in blockchain games`)
        setError(`Game ${gameId} not found`)
      }
    } catch (error) {
      console.error(`❌ GameBoard: Error fetching game ${gameId}:`, error)
      setError(`Failed to load game: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load game data on mount and when gameId changes
  useEffect(() => {
    fetchGameData()
  }, [gameId])

  // Update player hand when blockchainGame.playerInfo changes (only for players)
  useEffect(() => {
    if (playerRole.isPlayer && blockchainGame.playerInfo) {
      setPlayerHand(blockchainGame.playerInfo.hand || [])
      console.log(`🔄 GameBoard: Player hand updated:`, blockchainGame.playerInfo.hand)
    }
  }, [blockchainGame.playerInfo, playerRole.isPlayer])

  // Calculate actual values that will be passed to cache
  const actualContractAddress = blockchainGame.contractAddress || '0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F'
  const actualNetworkName = blockchainGame.networkName || 'Base Sepolia'
  const actualChainId = blockchainGame.currentNetwork || 84532

  // Use cache system for efficient tile fetching
  const { 
    placedTiles: cachedTiles, 
    currentGame: cachedGame, 
    allPlayersScores: cachedScores,
    isLoading: cacheLoading,
    error: cacheError,
    refreshData: refreshCache
  } = useGameCache({
    blockchainGameId: gameId,
    contractAddress: actualContractAddress,
    networkName: actualNetworkName,
    chainId: actualChainId
  })

  // Update local state when cache data changes
  useEffect(() => {
    if (cachedTiles) {
      setPlacedTiles(cachedTiles.map(tile => ({
        x: tile.x,
        y: tile.y,
        number: tile.number || tile.displayNumber
      })))
      console.log(`✅ GameBoard: Updated ${cachedTiles.length} placed tiles from cache`)
    }
  }, [cachedTiles])

  // Use cached game data if available
  useEffect(() => {
    if (cachedGame) {
      setCurrentGame(cachedGame)
      setAllPlayersScores(cachedScores)
      setError(null)
      console.log(`✅ GameBoard: Updated game data from cache for game ${gameId}`)
    }
  }, [cachedGame, cachedScores, gameId])

  // Handle cache errors
  useEffect(() => {
    if (cacheError) {
      setError(cacheError)
    }
  }, [cacheError])

  // Player action handlers (only used when isPlayer is true)
  const handleTileSelect = (tileNumber: number) => {
    if (!playerRole.canMakeMove) return
    setSelectedTile(selectedTile === tileNumber ? null : tileNumber)
    console.log(`🎯 Selected tile: ${tileNumber}`)
  }

  const handleCellClick = (x: number, y: number) => {
    if (!playerRole.canMakeMove || !selectedTile) return
    
    // Check if cell is already occupied
    const isOccupied = placedTiles.some(tile => tile.x === x && tile.y === y) ||
                      pendingPlacements.some(placement => placement.x === x && placement.y === y)
    
    if (isOccupied) {
      console.log(`❌ Cell (${x}, ${y}) is already occupied`)
      return
    }

    // Add to pending placements
    const newPlacement: TilePlacement = { number: selectedTile, x, y }
    setPendingPlacements(prev => [...prev, newPlacement])
    setSelectedTile(null) // Deselect after placing
    
    console.log(`📍 Added tile ${selectedTile} to (${x}, ${y})`)
  }

  const removePendingPlacement = (index: number) => {
    setPendingPlacements(prev => prev.filter((_, i) => i !== index))
  }

  const clearPendingPlacements = () => {
    setPendingPlacements([])
    setSelectedTile(null)
  }

  const submitTurn = async () => {
    if (pendingPlacements.length === 0) {
      console.log('❌ No tiles to place')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      console.log(`🚀 Submitting turn with ${pendingPlacements.length} placements:`, pendingPlacements)
      
      const txHash = await blockchainGame.playTurn(gameId, pendingPlacements)
      
      console.log(`✅ Turn submitted successfully:`, txHash)
      
      // Clear pending placements and refresh data
      setPendingPlacements([])
      setSelectedTile(null)
      await refreshCache()
      await fetchGameData()
      
    } catch (error) {
      console.error('❌ Failed to submit turn:', error)
      setError(`Failed to submit turn: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipTurn = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      console.log(`⏭️ Skipping turn for game ${gameId}`)
      
      const txHash = await blockchainGame.skipTurn(gameId)
      
      console.log(`✅ Turn skipped successfully:`, txHash)
      
      // Clear any pending placements and refresh data
      setPendingPlacements([])
      setSelectedTile(null)
      await refreshCache()
      await fetchGameData()
      
    } catch (error) {
      console.error('❌ Failed to skip turn:', error)
      setError(`Failed to skip turn: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update game message based on state
  const gameMessage = useMemo(() => {
    const loading = isLoading || cacheLoading
    const errorMsg = error || cacheError
    
    if (errorMsg) {
      return `Error: ${errorMsg}`
    } else if (loading) {
      return 'Loading game...'
    } else if (!currentGame) {
      return 'Game not found'
    } else if (currentGame.state === 0) {
      return 'Game is in setup phase'
    } else if (currentGame.state === 1) {
      const currentPlayerAddr = currentGame.playerAddresses[currentGame.currentPlayerIndex]
      return `Game in progress - ${currentPlayerAddr?.slice(0, 6)}...${currentPlayerAddr?.slice(-4)}'s turn`
    } else if (currentGame.state === 2) {
      return 'Game completed!'
    } else {
      return 'Game cancelled'
    }
  }, [currentGame, error, cacheError, isLoading, cacheLoading])

  // Player information
  const players = useMemo(() => {
    if (!currentGame) return []
    
    return currentGame.playerAddresses.map((address: string, index: number) => ({
      address,
      name: `Player ${index + 1}`,
      score: currentGame.playerScores?.[index] || allPlayersScores[address] || 0,
      isCurrent: index === currentGame.currentPlayerIndex,
      isYou: playerRole.isPlayer && index === playerRole.playerIndex
    }))
  }, [currentGame, allPlayersScores, playerRole])

  // Render a board cell
  const renderCell = (x: number, y: number) => {
    const placedTile = placedTiles.find(tile => tile.x === x && tile.y === y)
    const pendingTile = pendingPlacements.find(placement => placement.x === x && placement.y === y)
    const isCenter = x === 7 && y === 7
    
    const tile = placedTile || pendingTile
    
    return (
      <div
        key={`${x}-${y}`}
        css={[
          cellStyle,
          isCenter && centerCellStyle,
          playerRole.canMakeMove && selectedTile && !tile && clickableCellStyle
        ]}
        onClick={() => playerRole.isPlayer && handleCellClick(x, y)}
      >
        {tile ? (
          <div css={[tileStyle, pendingTile && pendingTileStyle]}>
            <span css={tileNumberStyle}>{tile.number}</span>
          </div>
        ) : isCenter ? (
          <div css={centerMarkerStyle}>★</div>
        ) : null}
      </div>
    )
  }

  // Compact view for gallery
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

  // Full game view
  return (
    <div css={containerStyle}>
      {/* Header */}
      <div css={headerStyle}>
        <div css={headerLeftStyle}>
          <h1 css={titleStyle}>
            Game #{gameId} - {playerRole.isPlayer ? 'Player Mode' : 'Spectator Mode'}
          </h1>
          <div css={statusStyle}>{gameMessage}</div>
        </div>
        <div css={headerRightStyle}>
          <button css={refreshButtonStyle} onClick={refreshCache} disabled={isLoading || cacheLoading}>
            {isLoading || cacheLoading ? '⏳' : '🔄'} Refresh
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
              <div key={player.address} css={[
                playerCardStyle, 
                player.isCurrent && currentPlayerStyle,
                player.isYou && yourPlayerStyle
              ]}>
                <div css={playerNameStyle}>
                  {player.name}
                  {player.isYou && <span css={youIndicatorStyle}>YOU</span>}
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

      <div css={mainContentStyle}>
        {/* Game Board */}
        <div css={boardContainerStyle}>
          <div css={boardStyle}>
            {Array.from({ length: 15 }, (_, row) =>
              Array.from({ length: 15 }, (_, col) => renderCell(col, row))
            ).flat()}
          </div>
        </div>

        {/* Player Interface (only shown for players) */}
        {playerRole.isPlayer && (
          <div css={interfaceStyle}>
            {/* Player Hand */}
            <div css={handSectionStyle}>
              <h3 css={sectionTitleStyle}>Your Hand ({playerHand.length} tiles)</h3>
              <div css={handStyle}>
                {playerHand.map((tileNumber, index) => (
                  <div
                    key={`${tileNumber}-${index}`}
                    css={[
                      handTileStyle,
                      selectedTile === tileNumber && selectedHandTileStyle,
                      playerRole.canMakeMove && clickableHandTileStyle
                    ]}
                    onClick={() => handleTileSelect(tileNumber)}
                  >
                    {tileNumber}
                  </div>
                ))}
              </div>
              {selectedTile !== null && (
                <div css={selectedTileInfoStyle}>
                  Selected: {selectedTile} (Click a board cell to place)
                </div>
              )}
            </div>

            {/* Pending Placements */}
            {pendingPlacements.length > 0 && (
              <div css={pendingSectionStyle}>
                <h3 css={sectionTitleStyle}>Pending Placements ({pendingPlacements.length})</h3>
                <div css={pendingListStyle}>
                  {pendingPlacements.map((placement, index) => (
                    <div key={index} css={pendingItemStyle}>
                      <span>Tile {placement.number} → ({placement.x}, {placement.y})</span>
                      <button css={removeButtonStyle} onClick={() => removePendingPlacement(index)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div css={actionsSectionStyle}>
              {playerRole.canMakeMove ? (
                <div css={actionsStyle}>
                  <button
                    css={[actionButtonStyle, submitButtonStyle]}
                    onClick={submitTurn}
                    disabled={isSubmitting || pendingPlacements.length === 0}
                  >
                    {isSubmitting ? '⏳ Submitting...' : `🎲 Submit Turn (${pendingPlacements.length} tiles)`}
                  </button>
                  
                  <button
                    css={[actionButtonStyle, skipButtonStyle]}
                    onClick={skipTurn}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '⏳ Skipping...' : '⏭️ Skip Turn'}
                  </button>
                  
                  {pendingPlacements.length > 0 && (
                    <button
                      css={[actionButtonStyle, clearButtonStyle]}
                      onClick={clearPendingPlacements}
                      disabled={isSubmitting}
                    >
                      🗑️ Clear All
                    </button>
                  )}
                </div>
              ) : (
                <div css={waitingStyle}>
                  ⏳ Waiting for your turn...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
        {playerRole.isPlayer && (
          <div css={infoItemStyle}>
            <span css={infoLabelStyle}>Your Score:</span>
            <span css={infoValueStyle}>{currentGame?.playerScores?.[playerRole.playerIndex!] || 0}</span>
          </div>
        )}
        <div css={infoItemStyle}>
          <span css={infoLabelStyle}>Status:</span>
          <span css={infoValueStyle}>
            {currentGame?.state === 0 ? 'Setup' : 
             currentGame?.state === 1 ? 'In Progress' : 
             currentGame?.state === 2 ? 'Completed' : 'Unknown'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div css={errorStyle}>
          ❌ {error}
        </div>
      )}
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
  color: #ffd700;
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

const yourPlayerStyle = css`
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
`

const playerNameStyle = css`
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`

const youIndicatorStyle = css`
  background: rgba(76, 175, 80, 0.8);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
`

const currentIndicatorStyle = css`
  color: #ffd700;
  font-size: 0.8rem;
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

const mainContentStyle = css`
  flex: 1;
  display: flex;
  overflow: hidden;
`

const boardContainerStyle = css`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`

const boardStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 40px);
  grid-template-rows: repeat(15, 40px);
  gap: 1px;
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
`

const cellStyle = css`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`

const centerCellStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
`

const clickableCellStyle = css`
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
`

const tileStyle = css`
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-weight: bold;
`

const pendingTileStyle = css`
  background: rgba(255, 215, 0, 0.8);
  animation: pulse 1s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`

const tileNumberStyle = css`
  font-size: 1rem;
`

const centerMarkerStyle = css`
  color: #ffd700;
  font-size: 1.4rem;
`

const interfaceStyle = css`
  width: 400px;
  background: rgba(0, 0, 0, 0.2);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
`

const handSectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const handStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const handTileStyle = css`
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
`

const clickableHandTileStyle = css`
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`

const selectedHandTileStyle = css`
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.8);
  transform: scale(1.1);
`

const selectedTileInfoStyle = css`
  font-size: 0.9rem;
  color: #ffd700;
  text-align: center;
`

const pendingSectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const pendingListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const pendingItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 215, 0, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
`

const removeButtonStyle = css`
  background: rgba(255, 0, 0, 0.3);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(255, 0, 0, 0.5);
  }
`

const actionsSectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const actionsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const actionButtonStyle = css`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const submitButtonStyle = css`
  background: #4CAF50;
  color: white;
  
  &:hover:not(:disabled) {
    background: #45a049;
    transform: translateY(-2px);
  }
`

const skipButtonStyle = css`
  background: #FF9800;
  color: white;
  
  &:hover:not(:disabled) {
    background: #e68900;
    transform: translateY(-2px);
  }
`

const clearButtonStyle = css`
  background: #f44336;
  color: white;
  
  &:hover:not(:disabled) {
    background: #da190b;
    transform: translateY(-2px);
  }
`

const waitingStyle = css`
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  opacity: 0.7;
`

const gameInfoStyle = css`
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
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
  color: #ffd700;
`

const errorStyle = css`
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.5);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 2rem;
  color: #ffcccb;
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