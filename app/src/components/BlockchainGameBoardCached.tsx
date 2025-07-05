/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { css } from '@emotion/react'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { useGameCache } from '../hooks/useGameCache'
import { NewAgeTile } from './NewAgeTile'
import type { GameConfig } from '../GameDisplay'
import type { TileItem } from '../types/GameTypes'
import { NumberTileId, GameParkUtils } from '../gamepark'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { BlockchainEndGameModal } from './BlockchainEndGameModal'

interface BlockchainGameBoardProps {
  gameConfig: GameConfig
  blockchainGameId: number
  onBackToSetup: () => void
}

interface BlockchainTile extends TileItem {
  number: number
}

const { getNumberTileId, getTileValue } = GameParkUtils

export function BlockchainGameBoardCached({ 
  gameConfig, 
  blockchainGameId, 
  onBackToSetup 
}: BlockchainGameBoardProps) {
  // BLOCKCHAIN OPERATIONS (write-only - no RPC abuse)
  const {
    playTurn,
    skipTurn,
    contractAddress,
    networkName,
    currentNetwork
  } = useBlockchainGame()

  // CACHE SYSTEM (all read operations - NO RPC ABUSE!)
  const {
    currentGame,
    playerInfo,
    allPlayersScores,
    placedTiles,
    tilePoolStatus,
    isLoading,
    error,
    refreshData,
    cacheStats
  } = useGameCache({
    blockchainGameId,
    contractAddress: contractAddress || '',
    networkName: networkName || 'Hardhat Local',
    chainId: currentNetwork || undefined
  })

  const { primaryWallet } = useDynamicContext()

  // UI STATE
  const [selectedTile, setSelectedTile] = useState<BlockchainTile | null>(null)
  const [gameMessage, setGameMessage] = useState('Loading from cache...')
  const [messageType, setMessageType] = useState<'info' | 'error' | 'success'>('info')
  const [messageTimeoutId, setMessageTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [stagedPlacements, setStagedPlacements] = useState<Array<{x: number, y: number, number: number, tileUniqueId: string}>>([])
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showEndGameModal, setShowEndGameModal] = useState(false)
  const [hasShownEndGameModal, setHasShownEndGameModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Safe message setter with timeout support
  const setGameMessageWithType = useCallback((message: string, type: 'info' | 'error' | 'success', timeout = 5000) => {
    setGameMessage(message)
    setMessageType(type)
    
    // Clear existing timeout
    if (messageTimeoutId) {
      clearTimeout(messageTimeoutId)
    }
    
    // Set new timeout for non-info messages
    if (type !== 'info') {
      const timeoutId = setTimeout(() => {
        setGameMessage(getDefaultMessage())
        setMessageType('info')
        setMessageTimeoutId(null)
      }, timeout)
      setMessageTimeoutId(timeoutId)
    }
  }, [messageTimeoutId])

  // Get default message based on game state
  const getDefaultMessage = useCallback(() => {
    if (!currentGame) return 'Loading from cache...'
    
    if (currentGame.state === 0) {
      return 'Game is in setup phase'
    } else if (currentGame.state === 1) {
      const isMyTurn = currentGame.playerAddresses[currentGame.currentPlayerIndex]?.toLowerCase() === 
                      primaryWallet?.address?.toLowerCase()
      return isMyTurn ? 'Your turn! Place tiles or skip.' : 'Waiting for other players...'
    } else if (currentGame.state === 2) {
      return 'Game completed!'
    } else {
      return 'Game cancelled'
    }
  }, [currentGame, primaryWallet])

  // Manual refresh using cache
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsSyncing(true)
      console.log('🔄 Manual refresh using cache system')
      await refreshData()
      setGameMessageWithType('✅ Data refreshed successfully!', 'success')
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
      setGameMessageWithType('❌ Refresh failed', 'error')
    } finally {
      setIsSyncing(false)
    }
  }, [refreshData, setGameMessageWithType])

  // Update game message when data changes
  useEffect(() => {
    if (!messageTimeoutId && currentGame) {
      setGameMessage(getDefaultMessage())
    }
  }, [currentGame, playerInfo, getDefaultMessage, messageTimeoutId])

  // Create hand tiles from cache data
  const handTiles = useMemo(() => {
    if (!playerInfo?.hand) return []
    
    return playerInfo.hand.map((tileNumber: number, index: number) => ({
      id: getNumberTileId(tileNumber),
      uniqueId: `hand-${blockchainGameId}-${playerInfo.lastMoveTime}-${index}`,
      location: { type: 'Hand' as const, player: 'current' },
      number: tileNumber
    } as BlockchainTile)).filter(tile => 
      !stagedPlacements.some(placement => placement.tileUniqueId === tile.uniqueId)
    )
  }, [playerInfo, stagedPlacements, blockchainGameId])

  // Handle tile staging
  const handleTileStaging = useCallback((x: number, y: number) => {
    if (!selectedTile || !currentGame || !playerInfo) {
      setGameMessageWithType('❌ Please select a tile first!', 'error')
      return
    }

    const isMyTurn = currentGame.playerAddresses[currentGame.currentPlayerIndex]?.toLowerCase() === 
                    primaryWallet?.address?.toLowerCase()
    if (!isMyTurn) {
      setGameMessageWithType('❌ Not your turn!', 'error')
      return
    }

    // Basic validation
    if (x < 0 || x >= 15 || y < 0 || y >= 15) {
      setGameMessageWithType('❌ Outside board boundaries', 'error')
      return
    }

    // Check if position is occupied
    if (stagedPlacements.some(p => p.x === x && p.y === y)) {
      setGameMessageWithType('❌ Position already occupied!', 'error')
      return
    }

    // Stage the placement
    setStagedPlacements(prev => [...prev, {
      x, y,
      number: selectedTile.number,
      tileUniqueId: selectedTile.uniqueId
    }])
    
    setSelectedTile(null)
    setGameMessageWithType(`✅ Tile ${selectedTile.number} staged at (${x}, ${y})`, 'success')
  }, [selectedTile, currentGame, playerInfo, primaryWallet, stagedPlacements, setGameMessageWithType])

  // Helper functions for tile state management
  const getTileState = (tile: any, isStaged: boolean = false): 'unplayed' | 'played' | 'burning' | 'empty' => {
    if (isStaged) {
      return 'unplayed'
    }
    return 'played'
  }

  const getTileCountdown = (tile: any): number | undefined => {
    // For now, no burning tiles in blockchain games
    return undefined
  }

  const getTileValue = (tile: any): number => {
    return tile.number || 0
  }

  // Confirm turn
  const handleConfirmTurn = useCallback(async () => {
    if (!currentGame || !playerInfo || stagedPlacements.length === 0) {
      setGameMessageWithType('❌ No tiles staged for placement!', 'error')
      return
    }

    try {
      setIsConfirming(true)
      setGameMessage(`Confirming turn with ${stagedPlacements.length} tile(s)...`)
      
      const placements = stagedPlacements.map(({ x, y, number }) => ({ x, y, number }))
      await playTurn(blockchainGameId, placements)
      
      setStagedPlacements([])
      setGameMessageWithType('✅ Turn confirmed!', 'success')
      
      // Refresh cache after successful turn
      setTimeout(() => refreshData(), 2000)
      
    } catch (error) {
      console.error('❌ Turn confirmation failed:', error)
      setGameMessageWithType(`❌ Failed to confirm turn: ${error?.message}`, 'error')
    } finally {
      setIsConfirming(false)
    }
  }, [currentGame, playerInfo, stagedPlacements, blockchainGameId, playTurn, refreshData, setGameMessageWithType])

  // Handle skip turn
  const handleSkipTurn = useCallback(async () => {
    if (!currentGame || !playerInfo) return
    
    setStagedPlacements([])
    try {
      setGameMessage('Skipping turn to draw tiles...')
      await skipTurn(blockchainGameId)
      setGameMessageWithType('✅ Turn skipped!', 'success')
      setTimeout(() => refreshData(), 2000)
    } catch (error) {
      setGameMessageWithType(`❌ Failed to skip turn: ${error?.message}`, 'error')
    }
  }, [currentGame, playerInfo, blockchainGameId, skipTurn, refreshData, setGameMessageWithType])

  if (error) {
    return (
      <div css={errorStyle}>
        <h2>Error Loading Game</h2>
        <p>{error}</p>
        <button onClick={onBackToSetup}>Back to Setup</button>
      </div>
    )
  }

  return (
    <div css={containerStyle}>
      {/* Game Header with Scoreboard */}
      <div css={headerStyle}>
        <div css={headerLeftStyle}>
          <h2>🎮 FIVES - Game #{blockchainGameId} (CACHED)</h2>
          <button css={backButtonStyle} onClick={onBackToSetup}>
            ← Back to Setup
          </button>
        </div>
        
        {/* SCOREBOARD - NOW USING CACHE DATA */}
        {currentGame && currentGame.playerAddresses && Object.keys(allPlayersScores).length > 0 && (
          <div css={scoreboardStyle}>
            <h3>🏆 Scores</h3>
            <div css={scoresGridStyle}>
              {currentGame.playerAddresses
                .map((address, index) => ({
                  address,
                  index,
                  score: allPlayersScores[address] || 0,
                  isCurrentPlayer: index === currentGame.currentPlayerIndex,
                  isMe: address?.toLowerCase() === primaryWallet?.address?.toLowerCase()
                }))
                .sort((a, b) => b.score - a.score)
                .map((player, rank) => (
                  <div key={player.address} css={[
                    playerScoreStyle,
                    player.isCurrentPlayer && activePlayerStyle,
                    player.isMe && myPlayerStyle
                  ]}>
                    <span css={rankStyle}>#{rank + 1}</span>
                    <span css={addressStyle}>
                      {player.address?.slice(0, 6)}...{player.address?.slice(-4)}
                      {player.isMe && ' (You)'}
                    </span>
                    <span css={scoreStyle}>{player.score}</span>
                    {player.isCurrentPlayer && <span css={currentIndicatorStyle}>⚡</span>}
                  </div>
                ))}
            </div>
          </div>
        )}
        
        <div css={headerRightStyle}>
          <button 
            css={refreshButtonStyle} 
            onClick={handleManualRefresh}
            disabled={isSyncing || isLoading}
          >
            {isSyncing || isLoading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Game Message */}
      <div css={[messageStyle, getMessageTypeStyle(messageType)]}>
        {gameMessage}
      </div>

      {/* Main Game Area */}
      <div css={gameAreaStyle}>
        {/* Game Board */}
        <div css={boardContainerStyle}>
          <div css={boardGridStyle}>
            {Array.from({ length: 15 }, (_, y) =>
              Array.from({ length: 15 }, (_, x) => {
                const stagedTile = stagedPlacements.find(p => p.x === x && p.y === y)
                const placedTile = placedTiles.find((t: any) => t.x === x && t.y === y)
                const isCenter = x === 7 && y === 7
                
                return (
                  <div
                    key={`${x}-${y}`}
                    css={[
                      boardCellStyle,
                      isCenter && centerCellStyle,
                      stagedTile && stagedCellStyle,
                      placedTile && placedCellStyle
                    ]}
                    onClick={() => handleTileStaging(x, y)}
                  >
                    {stagedTile && (
                      <NewAgeTile
                        value={getTileValue(stagedTile)}
                        state={getTileState(stagedTile, true)}
                        countdownTurns={getTileCountdown(stagedTile)}
                        isSelected={false}
                        onClick={() => {}} // Staged tiles are not clickable
                      />
                    )}
                    {placedTile && !stagedTile && (
                      <NewAgeTile
                        value={getTileValue(placedTile)}
                        state={getTileState(placedTile, false)}
                        countdownTurns={getTileCountdown(placedTile)}
                        isSelected={false}
                        onClick={() => {}} // Placed tiles are not clickable
                      />
                    )}
                    {isCenter && !stagedTile && !placedTile && (
                      <div css={centerMarkerStyle}>★</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Hand */}
        <div css={handContainerStyle}>
          <h3>Your Hand ({handTiles.length} tiles)</h3>
          <div css={handGridStyle}>
            {handTiles.map(tile => (
              <NewAgeTile
                key={tile.uniqueId}
                value={getTileValue(tile)}
                state="unplayed"
                countdownTurns={getTileCountdown(tile)}
                isSelected={selectedTile?.uniqueId === tile.uniqueId}
                onClick={() => setSelectedTile(
                  selectedTile?.uniqueId === tile.uniqueId ? null : tile
                )}
              />
            ))}
          </div>
          
          {/* Action Buttons */}
          <div css={actionButtonsStyle}>
            <button
              css={confirmButtonStyle}
              onClick={handleConfirmTurn}
              disabled={stagedPlacements.length === 0 || isConfirming}
            >
              {isConfirming ? 'Confirming...' : `Confirm Turn (${stagedPlacements.length})`}
            </button>
            
            <button
              css={clearButtonStyle}
              onClick={() => setStagedPlacements([])}
              disabled={stagedPlacements.length === 0}
            >
              Clear Staged
            </button>
            
            <button
              css={skipButtonStyle}
              onClick={handleSkipTurn}
            >
              Skip Turn
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div css={debugStyle}>
        <small>
          Game State: {currentGame?.state} | Turn: {currentGame?.turnNumber} | 
          Cache Status: {isLoading ? 'Loading' : 'Ready'} | 
          Hand Size: {handTiles.length} | 
          Placed Tiles: {placedTiles.length} | 
          Staged: {stagedPlacements.length} | 
          Scores: {Object.keys(allPlayersScores).length} players | 
          Pool: {tilePoolStatus.reduce((sum, count) => sum + count, 0)} tiles | 
          Cache: {cacheStats.gameLoaded ? '✅' : '❌'} game, {cacheStats.playerLoaded ? '✅' : '❌'} player
        </small>
      </div>

      {/* End Game Modal */}
      {showEndGameModal && currentGame?.state === 2 && (
        <BlockchainEndGameModal
          isOpen={showEndGameModal}
          onClose={() => setShowEndGameModal(false)}
          gameId={blockchainGameId}
          winner={{
            address: currentGame.playerAddresses[0] || '',
            name: 'Winner',
            score: Math.max(...Object.values(allPlayersScores)),
            finalHandSize: 0
          }}
          allPlayers={currentGame.playerAddresses.map((addr, i) => ({
            address: addr,
            name: `Player ${i + 1}`,
            score: allPlayersScores[addr] || 0,
            finalHandSize: 0
          }))}
          gameStats={{
            totalTurns: currentGame.turnNumber,
            finalTilePool: 0,
            gameTime: undefined
          }}
        />
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
`

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
`

const headerLeftStyle = css`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const headerRightStyle = css`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const scoreboardStyle = css`
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  padding: 1rem;
  min-width: 300px;
`

const scoresGridStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`

const playerScoreStyle = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
`

const activePlayerStyle = css`
  background: rgba(255, 215, 0, 0.3);
  border: 2px solid #ffd700;
`

const myPlayerStyle = css`
  background: rgba(0, 255, 0, 0.2);
  border: 2px solid #00ff00;
`

const rankStyle = css`
  font-weight: bold;
  min-width: 30px;
`

const addressStyle = css`
  flex: 1;
  font-family: monospace;
`

const scoreStyle = css`
  font-weight: bold;
  color: #ffd700;
`

const currentIndicatorStyle = css`
  color: #ffd700;
`

const backButtonStyle = css`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.3); }
`

const refreshButtonStyle = css`
  padding: 0.5rem 1rem;
  background: rgba(0, 255, 0, 0.3);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background: rgba(0, 255, 0, 0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const messageStyle = css`
  padding: 1rem;
  text-align: center;
  font-weight: bold;
  background: rgba(0, 0, 0, 0.4);
`

const getMessageTypeStyle = (type: 'info' | 'error' | 'success') => {
  const colors = {
    info: 'rgba(59, 130, 246, 0.3)',
    error: 'rgba(239, 68, 68, 0.3)',
    success: 'rgba(34, 197, 94, 0.3)'
  }
  return css`
    background: ${colors[type]};
  `
}

const gameAreaStyle = css`
  display: flex;
  flex: 1;
  gap: 2rem;
  padding: 2rem;
`

const boardContainerStyle = css`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`

const boardGridStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 40px);
  grid-template-rows: repeat(15, 40px);
  gap: 2px;
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 8px;
`

const boardCellStyle = css`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: rgba(255, 255, 255, 0.2); }
`

const centerCellStyle = css`
  background: rgba(255, 215, 0, 0.3);
  border-color: #ffd700;
`

const stagedCellStyle = css`
  background: rgba(0, 255, 0, 0.3);
  border-color: #00ff00;
`

const stagedTileStyle = css`
  font-weight: bold;
  color: white;
`

const centerMarkerStyle = css`
  color: #ffd700;
  font-size: 20px;
`

const handContainerStyle = css`
  width: 300px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 1rem;
`

const handGridStyle = css`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const handTileStyle = css`
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.3); }
`

const selectedTileStyle = css`
  background: rgba(255, 215, 0, 0.4);
  border-color: #ffd700;
`

const actionButtonsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const confirmButtonStyle = css`
  padding: 0.75rem;
  background: rgba(34, 197, 94, 0.3);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background: rgba(34, 197, 94, 0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const clearButtonStyle = css`
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.3);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background: rgba(239, 68, 68, 0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const skipButtonStyle = css`
  padding: 0.5rem;
  background: rgba(156, 163, 175, 0.3);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background: rgba(156, 163, 175, 0.4); }
`

const debugStyle = css`
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.5);
  color: #ccc;
  text-align: center;
`

const errorStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f87171;
  color: white;
  text-align: center;
  padding: 2rem;
`

const placedCellStyle = css`
  background: rgba(59, 130, 246, 0.4);
  border-color: #3b82f6;
`

const placedTileStyle = css`
  font-weight: bold;
  color: white;
  background: rgba(59, 130, 246, 0.6);
  border-radius: 3px;
  padding: 2px;
` 