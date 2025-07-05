/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react'
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

interface PlayerRole {
  isPlayer: boolean
  isSpectator: boolean
  canMakeMove: boolean
  playerIndex: number | null
  address: string | null
}

interface PermissionManagerProps {
  role: PlayerRole
  gameState: GameState
  onRoleChange: (role: PlayerRole) => void
}

export function PermissionManager({ role, gameState, onRoleChange }: PermissionManagerProps) {
  const [showJoinPrompt, setShowJoinPrompt] = useState(false)
  const [joinAttempting, setJoinAttempting] = useState(false)

  /**
   * Check if user can join as a player
   */
  const canJoinAsPlayer = () => {
    return (
      gameState.state === 0 && // Game in setup
      gameState.playerAddresses.length < gameState.maxPlayers && // Has space
      role.address && // User has wallet connected
      !role.isPlayer // Not already a player
    )
  }

  /**
   * Show join prompt when conditions are met
   */
  useEffect(() => {
    if (canJoinAsPlayer() && !showJoinPrompt && !joinAttempting) {
      setTimeout(() => setShowJoinPrompt(true), 1000) // Show after 1 second
    } else if (!canJoinAsPlayer()) {
      setShowJoinPrompt(false)
    }
  }, [gameState, role, showJoinPrompt, joinAttempting])

  /**
   * Handle join game attempt
   */
  const handleJoinGame = async () => {
    setJoinAttempting(true)
    setShowJoinPrompt(false)
    
    try {
      // TODO: Implement actual join game logic here
      console.log('🚀 Attempting to join game', gameState.id, 'as player')
      
      // For now, simulate a join attempt
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // TODO: Check if join was successful and update role accordingly
      // This would come from the actual blockchain transaction result
      
      console.log('✅ Join attempt completed')
    } catch (error) {
      console.error('❌ Failed to join game:', error)
    } finally {
      setJoinAttempting(false)
    }
  }

  /**
   * Get role status display
   */
  const getRoleStatus = () => {
    if (role.isPlayer && role.canMakeMove) {
      return { text: '🎮 Your Turn!', color: '#4CAF50', pulse: true }
    } else if (role.isPlayer) {
      return { text: '🎮 Player (Waiting)', color: '#2196F3', pulse: false }
    } else {
      return { text: '👁️ Spectator', color: '#9C27B0', pulse: false }
    }
  }

  const roleStatus = getRoleStatus()

  return (
    <>
      {/* Role Status Indicator */}
      <div css={roleIndicatorStyle(roleStatus.color, roleStatus.pulse)}>
        {roleStatus.text}
        {role.playerIndex !== null && ` (P${role.playerIndex + 1})`}
      </div>

      {/* Join Game Prompt */}
      {showJoinPrompt && (
        <div css={joinPromptStyle}>
          <div css={joinPromptContentStyle}>
            <h3>🎮 Join Game {gameState.id}?</h3>
            <p>
              This game has space for {gameState.maxPlayers} players and currently has{' '}
              {gameState.playerAddresses.length}. Would you like to join as a player?
            </p>
            <div css={joinPromptButtonsStyle}>
              <button 
                css={joinButtonStyle}
                onClick={handleJoinGame}
                disabled={joinAttempting}
              >
                {joinAttempting ? '🔄 Joining...' : '✅ Join as Player'}
              </button>
              <button 
                css={spectateButtonStyle}
                onClick={() => setShowJoinPrompt(false)}
              >
                👁️ Just Spectate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Attempting Overlay */}
      {joinAttempting && (
        <div css={joinAttemptingStyle}>
          <div css={joinAttemptingContentStyle}>
            <div css={spinnerStyle}>🔄</div>
            <h3>Joining Game...</h3>
            <p>Please confirm the transaction in your wallet</p>
          </div>
        </div>
      )}

      {/* Permissions Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div css={debugPermissionsStyle}>
          <strong>🔐 Permissions:</strong><br/>
          Can Join: {canJoinAsPlayer() ? '✅' : '❌'}<br/>
          Can Move: {role.canMakeMove ? '✅' : '❌'}<br/>
          Player Index: {role.playerIndex ?? 'N/A'}<br/>
          Address: {role.address ? `${role.address.slice(0, 6)}...` : 'None'}
        </div>
      )}
    </>
  )
}

const roleIndicatorStyle = (color: string, pulse: boolean) => css`
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: ${color};
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  z-index: 1002;
  animation: ${pulse ? 'pulse 1.5s infinite' : 'none'};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  
  @keyframes pulse {
    0% { opacity: 0.8; transform: translateX(-50%) scale(1); }
    50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
    100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
  }
`

const joinPromptStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const joinPromptContentStyle = css`
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  
  @keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  h3 {
    margin: 0 0 16px 0;
    color: #333;
  }
  
  p {
    margin: 0 0 20px 0;
    color: #666;
    line-height: 1.5;
  }
`

const joinPromptButtonsStyle = css`
  display: flex;
  gap: 12px;
  justify-content: center;
`

const joinButtonStyle = css`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #45a049;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`

const spectateButtonStyle = css`
  background: #9C27B0;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #8E24AA;
    transform: translateY(-1px);
  }
`

const joinAttemptingStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
`

const joinAttemptingContentStyle = css`
  background: white;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  
  h3 {
    margin: 0 0 12px 0;
    color: #333;
  }
  
  p {
    margin: 0;
    color: #666;
  }
`

const spinnerStyle = css`
  font-size: 2rem;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

const debugPermissionsStyle = css`
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-family: monospace;
  z-index: 1000;
  max-width: 200px;
` 