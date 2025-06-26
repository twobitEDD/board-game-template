/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { css } from '@emotion/react'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { NewAgeGameBoard } from './NewAgeGameBoard'
import type { GameConfig } from '../GameDisplay'
import type { TileItem } from '../types/GameTypes'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'

interface BlockchainGameBoardProps {
  gameConfig: GameConfig
  blockchainGameId: number
  onBackToSetup: () => void
}

// Extended tile interface for blockchain with numeric values
interface BlockchainTile extends TileItem {
  number: number // Display number (0-9)
}

// Local getTileValue function (consistent with rest of codebase)
const getTileValue = (tileId: NumberTileId): number => {
  switch (tileId) {
    case NumberTileId.Zero: return 0
    case NumberTileId.One: return 1
    case NumberTileId.Two: return 2
    case NumberTileId.Three: return 3
    case NumberTileId.Four: return 4
    case NumberTileId.Five: return 5
    case NumberTileId.Six: return 6
    case NumberTileId.Seven: return 7
    case NumberTileId.Eight: return 8
    case NumberTileId.Nine: return 9
    default: return 0
  }
}

// Convert numeric tile value to NumberTileId
const getNumberTileId = (value: number): NumberTileId => {
  switch (value) {
    case 0: return NumberTileId.Zero
    case 1: return NumberTileId.One
    case 2: return NumberTileId.Two
    case 3: return NumberTileId.Three
    case 4: return NumberTileId.Four
    case 5: return NumberTileId.Five
    case 6: return NumberTileId.Six
    case 7: return NumberTileId.Seven
    case 8: return NumberTileId.Eight
    case 9: return NumberTileId.Nine
    default: return NumberTileId.Zero
  }
}

export function BlockchainGameBoard({ 
  gameConfig, 
  blockchainGameId, 
  onBackToSetup 
}: BlockchainGameBoardProps) {
  const {
    currentGame,
    playerInfo,
    playTurn,
    skipTurn,
    getTilePoolStatus,
    refreshGameData,
    loading: hookLoading,
    error: hookError
  } = useBlockchainGame()

  const [selectedTile, setSelectedTile] = useState<BlockchainTile | null>(null)
  const [gameMessage, setGameMessage] = useState('Loading blockchain game...')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tilePoolStatus, setTilePoolStatus] = useState<number[]>([])
  const [placedTiles, setPlacedTiles] = useState<any[]>([])
  const [stagedPlacements, setStagedPlacements] = useState<Array<{x: number, y: number, number: number}>>([])
  const [isConfirming, setIsConfirming] = useState(false)

  // Load initial blockchain state and set up polling
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true)
        await refreshGameData(blockchainGameId)
        
        // Load tile pool status
        const poolStatus = await getTilePoolStatus(blockchainGameId)
        setTilePoolStatus(poolStatus.remainingCounts)
        
        // Load placed tiles from board
        await loadBoardTiles()
        
        setError(null)
      } catch (error) {
        console.error('❌ Failed to load game data:', error)
        setError(`Error loading game: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    
    if (blockchainGameId) {
      loadGameData()
      
      // Set up polling for real-time updates every 5 seconds
      const pollInterval = setInterval(loadGameData, 5000)
      
      return () => clearInterval(pollInterval)
    }
  }, [blockchainGameId, refreshGameData, getTilePoolStatus])

  // Load board tiles from blockchain
  const loadBoardTiles = useCallback(async () => {
    try {
      // For now, we'll just track placed tiles in state
      // In a full implementation, you'd query the contract for all placed tiles
      // This is a simplified version for the demo
      setPlacedTiles([])
    } catch (error) {
      console.warn('Failed to load board tiles:', error)
    }
  }, [])

  // Update game message based on game state
  useEffect(() => {
    if (!currentGame || !playerInfo) return
    
    if (currentGame.state === 0) {
      setGameMessage('Game is in setup phase')
    } else if (currentGame.state === 1) {
      const isMyTurn = currentGame.playerAddresses[currentGame.currentPlayerIndex]?.toLowerCase() === 
                      currentGame.playerAddresses.find(addr => playerInfo.hasJoined)?.toLowerCase()
      
      if (isMyTurn) {
        setGameMessage(`Your turn! Place tiles from your hand or skip to draw new tiles.`)
          } else {
        const currentPlayerAddr = currentGame.playerAddresses[currentGame.currentPlayerIndex]
            setGameMessage(`Waiting for ${currentPlayerAddr?.slice(0, 6)}...${currentPlayerAddr?.slice(-4)} to play`)
      }
    } else if (currentGame.state === 2) {
      setGameMessage('Game completed!')
    } else {
      setGameMessage('Game cancelled')
    }
  }, [currentGame, playerInfo])

  // Handle tile staging (local placement, no blockchain call yet)
  const handleTileStaging = useCallback((x: number, y: number) => {
    if (!selectedTile || !currentGame || !playerInfo) {
      setGameMessage('Please select a tile first!')
      return
    }

    // Check if it's the player's turn
    const isMyTurn = currentGame.playerAddresses[currentGame.currentPlayerIndex]?.toLowerCase() === 
                    currentGame.playerAddresses.find(addr => playerInfo.hasJoined)?.toLowerCase()
    
    if (!isMyTurn) {
      setGameMessage('Not your turn!')
      return
    }

    // Check if position is already occupied (by confirmed tiles or staged tiles)
    const isOccupiedByPlaced = placedTiles.some(tile => tile.x === x && tile.y === y)
    const isOccupiedByStaged = stagedPlacements.some(placement => placement.x === x && placement.y === y)
    
    if (isOccupiedByPlaced || isOccupiedByStaged) {
      setGameMessage('Position already occupied!')
      return
    }

    // Check if player has this tile in hand
    const hasThisTile = playerInfo.hand.includes(selectedTile.number)
    if (!hasThisTile) {
      setGameMessage('You don\'t have this tile in your hand!')
      return
    }

    // Check if tile is already used in staged placements
    const tileAlreadyStaged = stagedPlacements.some(placement => placement.number === selectedTile.number)
    if (tileAlreadyStaged) {
      setGameMessage('This tile is already staged for placement!')
      return
    }

    // Stage the placement
    setStagedPlacements(prev => [...prev, {
      x,
      y,
      number: selectedTile.number
    }])
    
    setSelectedTile(null)
    setGameMessage(`Tile ${selectedTile.number} staged at (${x}, ${y}). Add more tiles or confirm your turn.`)
  }, [selectedTile, currentGame, playerInfo, placedTiles, stagedPlacements])

  // Confirm turn - send all staged placements to blockchain
  const handleConfirmTurn = useCallback(async () => {
    if (!currentGame || !playerInfo || stagedPlacements.length === 0) {
      setGameMessage('No tiles staged for placement!')
      return
    }

    // Check if it's the player's turn
    const isMyTurn = currentGame.playerAddresses[currentGame.currentPlayerIndex]?.toLowerCase() === 
                    currentGame.playerAddresses.find(addr => playerInfo.hasJoined)?.toLowerCase()
    
    if (!isMyTurn) {
      setGameMessage('Not your turn!')
      return
    }

    try {
      setIsConfirming(true)
      setGameMessage(`Confirming turn with ${stagedPlacements.length} tile(s)...`)
      
      // Send all staged placements to blockchain in one transaction
      const txHash = await playTurn(blockchainGameId, stagedPlacements)
      
      setGameMessage(`Turn confirmed! Transaction: ${txHash.slice(0, 10)}...`)
      
      // Move staged placements to placed tiles for immediate feedback
      setPlacedTiles(prev => [...prev, ...stagedPlacements.map(placement => ({
        ...placement,
        turnPlaced: currentGame.turnNumber
      }))])
      
      // Clear staged placements
      setStagedPlacements([])
      
    } catch (error) {
      console.error('❌ Failed to confirm turn:', error)
      setGameMessage(`Failed to confirm turn: ${error.message}`)
    } finally {
      setIsConfirming(false)
    }
  }, [currentGame, playerInfo, stagedPlacements, blockchainGameId, playTurn])

  // Clear staged placements
  const handleClearStaged = useCallback(() => {
    setStagedPlacements([])
    setGameMessage('Staged placements cleared.')
  }, [])

  // Handle skip turn
  const handleSkipTurn = useCallback(async () => {
    if (!currentGame || !playerInfo) return
    
    const isMyTurn = currentGame.playerAddresses[currentGame.currentPlayerIndex]?.toLowerCase() === 
                    currentGame.playerAddresses.find(addr => playerInfo.hasJoined)?.toLowerCase()
    
    if (!isMyTurn) {
      setGameMessage('Not your turn!')
      return
    }

    // Clear any staged placements first
    setStagedPlacements([])

    try {
      setGameMessage('Skipping turn to draw tiles...')
      const txHash = await skipTurn(blockchainGameId)
      setGameMessage(`Turn skipped! Drawing new tiles... ${txHash.slice(0, 10)}...`)
    } catch (error) {
      console.error('❌ Failed to skip turn:', error)
      setGameMessage(`Failed to skip turn: ${error.message}`)
    }
  }, [currentGame, playerInfo, blockchainGameId, skipTurn])

  // Create hand tiles for the UI from the new contract format
  const handTiles = useMemo(() => {
    if (!playerInfo || !playerInfo.hand) {
      return []
    }
    
    // New contract gives us tiles as display numbers (0-9) directly
    return playerInfo.hand.map((tileNumber: number, index: number) => ({
      id: getNumberTileId(tileNumber),
      uniqueId: `blockchain-hand-${index}`,
      location: { type: 'Hand' as const, player: 'current' },
      number: tileNumber // Display number (0-9)
    } as BlockchainTile))
  }, [playerInfo])

  // Convert blockchain state to local game format
  const localGameConfig = useMemo(() => {
    if (!currentGame) return gameConfig
    
    return {
      ...gameConfig,
      playerCount: currentGame.playerAddresses.length,
      playerNames: currentGame.playerAddresses.map((addr: string, i: number) => 
        `Player ${i + 1} (${addr.slice(0, 6)}...${addr.slice(-4)})`
      )
    }
  }, [currentGame, gameConfig])

  if (loading) {
    return (
      <div css={loadingStyle}>
        <div css={spinnerStyle}></div>
        <p>Loading blockchain game...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div css={errorStyle}>
        <h2>Error Loading Blockchain Game</h2>
        <p>{error}</p>
        <button css={backButtonStyle} onClick={onBackToSetup}>
          Back to Setup
        </button>
      </div>
    )
  }

  if (!currentGame || !playerInfo) {
    return (
      <div css={loadingStyle}>
        <p>Connecting to blockchain game...</p>
      </div>
    )
  }

  return (
    <div css={containerStyle}>
      {/* Main Game Area */}
      <div css={mainAreaStyle(false)}>
        {/* Header */}
        <div css={headerStyle}>
          <div css={headerLeftStyle}>
            <button css={backButtonStyle} onClick={onBackToSetup} title="Back to Setup">
              ↩
            </button>
            <h1 css={titleStyle}>SUMMON FIVES</h1>
            <div css={gameModeStyle}>
              🔗 Blockchain Game #{blockchainGameId} (50-Tile Pool)
            </div>
          </div>

          <div css={headerCenterStyle}>
            <div css={turnInfoStyle}>
              <span css={turnLabelStyle}>Turn</span>
              <span css={turnNumberStyle}>{currentGame.turnNumber}</span>
            </div>
            <div css={separatorStyle}>•</div>
            <div css={infoRowStyle}>
              <div css={scoreInfoStyle}>
                <span css={scoreNumberStyle}>{playerInfo.score}</span>
                <span css={scoreLabelStyle}>Points</span>
              </div>
              <div css={separatorStyle}>•</div>
              <div css={tilesInfoStyle}>
                <span css={tilesNumberStyle}>{handTiles.length}</span>
                <span css={tilesLabelStyle}>Hand</span>
              </div>
              <div css={separatorStyle}>•</div>
              <div css={tilesInfoStyle}>
                <span css={tilesNumberStyle}>{currentGame.tilesRemaining}</span>
                <span css={tilesLabelStyle}>Pool</span>
              </div>
              <div css={separatorStyle}>•</div>
              <div css={currentPlayerStyle}>
                {currentGame.playerAddresses[currentGame.currentPlayerIndex]?.toLowerCase() === 
                 currentGame.playerAddresses.find(addr => playerInfo.hasJoined)?.toLowerCase() 
                  ? 'Your Turn' 
                  : `Player ${currentGame.currentPlayerIndex + 1}'s Turn`}
              </div>
            </div>
          </div>

          <div css={headerRightStyle}>
            <div css={gameStateIndicatorStyle}>
              {currentGame.state === 0 ? '⏳ Setup' : 
               currentGame.state === 1 ? '✅ Playing' : 
               currentGame.state === 2 ? '🏁 Complete' : '❌ Cancelled'}
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div css={boardAreaStyle}>
          <div css={boardContainerStyle}>
            <div css={gameboardStyle}>
              {Array.from({ length: 15 }, (_, row) =>
                Array.from({ length: 15 }, (_, col) => {
                  // Convert grid coordinates to blockchain coordinates
                  const blockchainX = col
                  const blockchainY = row
                  
                  // Find if there's a tile at this position
                  const placedTile = placedTiles.find(
                    tile => tile.x === blockchainX && tile.y === blockchainY
                  )
                  const stagedTile = stagedPlacements.find(
                    placement => placement.x === blockchainX && placement.y === blockchainY
                  )
                  
                  return (
                    <div
                      key={`${row}-${col}`}
                      css={boardSpaceStyle}
                      onClick={() => handleTileStaging(blockchainX, blockchainY)}
                    >
                      {placedTile ? (
                        <div css={placedTileStyle}>
                          <span css={tileNumberStyle}>{placedTile.number}</span>
                        </div>
                      ) : stagedTile ? (
                        <div css={stagedTileStyle}>
                          <span css={tileNumberStyle}>{stagedTile.number}</span>
                        </div>
                      ) : (
                        <div css={emptySpaceStyle}>
                          {row === 7 && col === 7 ? '★' : ''}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
          
          {/* Game Message */}
          {gameMessage && (
            <div css={statusStyle}>
              {gameMessage}
            </div>
          )}
        </div>
      </div>
      
      {/* Sidebar */}
      <div css={sidebarStyle(false)}>
      {/* Player Hand */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Your Hand ({handTiles.length} tiles)</h3>
          <div css={handGridStyle}>
            {handTiles.map((tile) => (
            <div 
              key={tile.uniqueId}
              css={[
                handTileStyle, 
                selectedTile?.uniqueId === tile.uniqueId && selectedTileStyle
              ]}
                onClick={() => setSelectedTile(selectedTile?.uniqueId === tile.uniqueId ? null : tile)}
              >
                {tile.number}
            </div>
          ))}
        </div>
      </div>

        {/* Staged Placements */}
        {stagedPlacements.length > 0 && (
          <div css={sectionStyle}>
            <h3 css={sectionTitleStyle}>Staged Tiles ({stagedPlacements.length})</h3>
            <div css={stagedListStyle}>
              {stagedPlacements.map((placement, index) => (
                <div key={index} css={stagedItemStyle}>
                  <span css={stagedTileNumberStyle}>{placement.number}</span>
                  <span css={stagedPositionStyle}>({placement.x}, {placement.y})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Controls */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Actions</h3>
          <div css={controlsStyle}>
            {stagedPlacements.length > 0 ? (
              <>
                <button 
                  css={confirmButtonStyle}
                  onClick={handleConfirmTurn}
                  disabled={isConfirming || hookLoading}
                >
                  {isConfirming ? 'Confirming...' : `Confirm Turn (${stagedPlacements.length} tiles)`}
                </button>
                <button 
                  css={clearButtonStyle}
                  onClick={handleClearStaged}
                  disabled={isConfirming || hookLoading}
                >
                  Clear Staged
                </button>
              </>
            ) : (
              <button 
                css={skipButtonStyle}
                onClick={handleSkipTurn}
                disabled={hookLoading}
              >
                {hookLoading ? 'Processing...' : 'Skip Turn (Draw Tiles)'}
              </button>
            )}
          </div>
        </div>

        {/* Tile Pool Status */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Tile Pool ({currentGame.tilesRemaining} remaining)</h3>
          <div css={tilePoolStyle}>
            {tilePoolStatus.map((count, number) => (
              <div key={number} css={poolItemStyle}>
                <span css={poolNumberStyle}>{number}</span>
                <span css={poolCountStyle}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Info */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Game Info</h3>
          <div css={gameInfoStyle}>
            <div css={infoItemStyle}>
              <span>Players:</span>
              <span>{currentGame.playerAddresses.length}/{currentGame.maxPlayers}</span>
            </div>
            <div css={infoItemStyle}>
              <span>Turn:</span>
              <span>{currentGame.turnNumber}</span>
            </div>
            <div css={infoItemStyle}>
              <span>Score:</span>
              <span>{playerInfo.score}</span>
            </div>
            <div css={infoItemStyle}>
              <span>Status:</span>
              <span>{currentGame.state === 1 ? 'Playing' : 'Waiting'}</span>
            </div>
          </div>
        </div>

        {/* Debug Info (compact) */}
        <div css={sectionStyle}>
          <details css={debugSectionStyle}>
            <summary css={debugTitleStyle}>Debug Info</summary>
            <div css={debugContentStyle}>
              <div css={debugItemStyle}>Game ID: {blockchainGameId}</div>
              <div css={debugItemStyle}>State: {currentGame.state}</div>
              <div css={debugItemStyle}>Current Player: {currentGame.currentPlayerIndex}</div>
              <div css={debugItemStyle}>Tiles in Pool: {currentGame.tilesRemaining}</div>
              <div css={debugItemStyle}>Hand Size: {handTiles.length}</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

// Styles (keeping the existing ones and adding new ones)
const containerStyle = css`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  color: #e5e5e5;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`

const loadingStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  color: #e5e5e5;
`

const spinnerStyle = css`
  width: 40px;
  height: 40px;
  border: 4px solid #3a3a5c;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const errorStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  color: #e5e5e5;
  text-align: center;
  padding: 20px;
  
  h2 {
    color: #f87171;
    margin-bottom: 16px;
  }
  
  p {
    margin-bottom: 24px;
    max-width: 500px;
    line-height: 1.5;
  }
`

const backButtonStyle = css`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background: #4338ca;
  }
`

const mainAreaStyle = (collapsed: boolean) => css`
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
`

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`

const headerLeftStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const titleStyle = css`
  font-size: 20px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
`

const gameModeStyle = css`
  font-size: 12px;
  color: #a1a1aa;
  background: rgba(99, 102, 241, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
`

const headerCenterStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const turnInfoStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const turnLabelStyle = css`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const turnNumberStyle = css`
  font-size: 18px;
  font-weight: 700;
  color: #6366f1;
`

const separatorStyle = css`
  color: #4b5563;
  font-size: 12px;
`

const infoRowStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const scoreInfoStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const scoreNumberStyle = css`
  font-size: 16px;
  font-weight: 600;
  color: #10b981;
`

const scoreLabelStyle = css`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const tilesInfoStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const tilesNumberStyle = css`
  font-size: 16px;
  font-weight: 600;
  color: #f59e0b;
`

const tilesLabelStyle = css`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const currentPlayerStyle = css`
  font-size: 14px;
  font-weight: 500;
  color: #e5e5e5;
  background: rgba(99, 102, 241, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
`

const headerRightStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const gameStateIndicatorStyle = css`
  font-size: 12px;
  color: #10b981;
  background: rgba(16, 185, 129, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
`

const boardAreaStyle = css`
  flex: 1;
  padding: 20px;
  overflow: hidden;
`

const sidebarStyle = (collapsed: boolean) => css`
  width: ${collapsed ? '60px' : '320px'};
  background: rgba(0, 0, 0, 0.4);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  overflow-y: auto;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
`

const sectionStyle = css`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const sectionTitleStyle = css`
  font-size: 14px;
  font-weight: 600;
  color: #e5e5e5;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const handGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
`

const handTileStyle = css`
  width: 40px;
  height: 40px;
  background: rgba(99, 102, 241, 0.2);
  border: 2px solid rgba(99, 102, 241, 0.4);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #e5e5e5;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(99, 102, 241, 0.3);
    border-color: rgba(99, 102, 241, 0.6);
    transform: translateY(-2px);
  }
`

const selectedTileStyle = css`
  background: rgba(99, 102, 241, 0.4) !important;
  border-color: #6366f1 !important;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
`

const controlsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const skipButtonStyle = css`
  background: #f59e0b;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #d97706;
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
`

const tilePoolStyle = css`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
`

const poolItemStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const poolNumberStyle = css`
  font-size: 12px;
  font-weight: 600;
  color: #e5e5e5;
`

const poolCountStyle = css`
  font-size: 10px;
  color: #a1a1aa;
`

const gameInfoStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const infoItemStyle = css`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #a1a1aa;
  
  span:last-child {
    color: #e5e5e5;
    font-weight: 500;
  }
`

const debugSectionStyle = css`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
`

const debugTitleStyle = css`
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #a1a1aa;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`

const debugContentStyle = css`
  padding: 8px 12px;
  font-size: 11px;
  color: #6b7280;
`

const debugItemStyle = css`
  margin-bottom: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  
  &:last-child {
    margin-bottom: 0;
  }
`

// Board-specific styles
const boardContainerStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`

const gameboardStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 40px);
  grid-template-rows: repeat(15, 40px);
  gap: 2px;
  padding: 5px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(5px);
  width: fit-content;
  height: fit-content;
`

const boardSpaceStyle = css`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(99, 102, 241, 0.2);
    transform: scale(1.05);
  }
`

const emptySpaceStyle = css`
  width: 100%;
  height: 100%;
  border: 2px dashed rgba(99, 102, 241, 0.3);
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  font-size: 1.2rem;
  font-weight: 600;

  &:hover {
    border-color: rgba(99, 102, 241, 0.6);
    background: rgba(99, 102, 241, 0.1);
  }
`

const placedTileStyle = css`
  width: 100%;
  height: 100%;
  background: rgba(99, 102, 241, 0.4);
  border: 2px solid #6366f1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
`

const tileNumberStyle = css`
  color: white;
  font-weight: bold;
  font-size: 1rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`

const statusStyle = css`
  text-align: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #e5e5e5;
  font-size: 14px;
  font-weight: 500;
  margin-top: 16px;
  border-radius: 6px;
`

// Staged tile styles
const stagedTileStyle = css`
  width: 100%;
  height: 100%;
  background: rgba(251, 191, 36, 0.4);
  border: 2px solid #f59e0b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`

const stagedListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
`

const stagedItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 4px;
  font-size: 12px;
`

const stagedTileNumberStyle = css`
  background: #f59e0b;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
`

const stagedPositionStyle = css`
  color: #a1a1aa;
  font-size: 11px;
  font-family: 'Monaco', 'Menlo', monospace;
`

const confirmButtonStyle = css`
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background-color 0.2s;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);

  &:hover:not(:disabled) {
    background: #059669;
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
    box-shadow: none;
  }
`

const clearButtonStyle = css`
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #dc2626;
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
`


