/** @jsxImportSource @emotion/react */
import React, { useEffect, useRef, useCallback } from 'react'
import { css } from '@emotion/react'

interface GameState {
  id: number
  state: number
  playerAddresses: string[]
  playerScores: number[]
  playerNames: string[]
  currentPlayerIndex: number
  turnNumber: number
  maxPlayers: number
  creator: string
  isLoading: boolean
  error: string | null
  tilesRemaining: number
  lastUpdate: number
}

interface RealTimeSyncProps {
  gameId: number
  enabled: boolean
  onGameUpdate: (gameState: GameState) => void
  fetchGameState: () => Promise<GameState | null>
  syncInterval?: number // ms between syncs
}

export function RealTimeSync({ 
  gameId, 
  enabled, 
  onGameUpdate, 
  fetchGameState,
  syncInterval = 3000 // 3 seconds default
}: RealTimeSyncProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const syncCountRef = useRef<number>(0)

  /**
   * Perform a sync operation
   */
  const performSync = useCallback(async () => {
    if (!enabled) return

    try {
      const gameState = await fetchGameState()
      
      if (gameState) {
        // Only update if there's actually new data
        if (gameState.lastUpdate > lastUpdateRef.current) {
          onGameUpdate(gameState)
          lastUpdateRef.current = gameState.lastUpdate
          syncCountRef.current++
          
          console.log(`🔄 Game ${gameId} synced (${syncCountRef.current}):`, {
            turn: gameState.turnNumber,
            state: gameState.state,
            currentPlayer: gameState.currentPlayerIndex
          })
        }
      }
    } catch (error) {
      console.warn('Sync failed for game', gameId, ':', error)
    }
  }, [enabled, gameId, fetchGameState, onGameUpdate])

  /**
   * Start/stop sync based on enabled state
   */
  useEffect(() => {
    if (enabled) {
      // Immediate sync on enable
      performSync()
      
      // Set up interval
      intervalRef.current = setInterval(performSync, syncInterval)
      
      console.log(`⚡ Real-time sync enabled for game ${gameId} (${syncInterval}ms interval)`)
    } else {
      // Clear interval on disable
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      console.log(`⏸️ Real-time sync disabled for game ${gameId}`)
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, gameId, performSync, syncInterval])

  /**
   * Adaptive sync frequency based on game state
   */
  useEffect(() => {
    // Could implement adaptive sync here:
    // - Faster sync during active gameplay
    // - Slower sync for completed games
    // - Pause sync for setup games
    
    // For now, we'll keep it simple
  }, [])

  // This is a utility component that doesn't render anything visible
  return (
    <>
      {process.env.NODE_ENV === 'development' && (
        <div css={debugIndicatorStyle(enabled)}>
          🔄 {enabled ? 'Live' : 'Paused'} ({syncCountRef.current})
        </div>
      )}
    </>
  )
}

const debugIndicatorStyle = (enabled: boolean) => css`
  position: fixed;
  top: 10px;
  left: 10px;
  background: ${enabled ? 'rgba(76, 175, 80, 0.9)' : 'rgba(156, 39, 176, 0.9)'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-family: monospace;
  z-index: 1001;
  animation: ${enabled ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }
`

// Explicit default export
export default RealTimeSync 