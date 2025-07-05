/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react'
import { css } from '@emotion/react'
import { GameSpectator } from './GameSpectator'

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

interface GameViewProps {
  gameState: GameState
  playerRole: PlayerRole
  onAction: (action: string, data?: any) => Promise<boolean>
  onExit?: () => void
  lastSyncTime: number
}

export function GameView({ gameState, playerRole, onAction, onExit, lastSyncTime }: GameViewProps) {
  const [showActionPanel, setShowActionPanel] = useState(false)
  const [selectedTiles, setSelectedTiles] = useState<number[]>([])

  /**
   * Get game state display info
   */
  const getGameStatus = () => {
    switch (gameState.state) {
      case 0: return { text: '⏳ Setup', color: '#FF9800' }
      case 1: return { text: '🎮 Playing', color: '#4CAF50' }
      case 2: return { text: '🏆 Completed', color: '#2196F3' }
      case 3: return { text: '❌ Cancelled', color: '#F44336' }
      default: return { text: '❓ Unknown', color: '#9E9E9E' }
    }
  }

  /**
   * Get current player info
   */
  const getCurrentPlayerInfo = () => {
    if (gameState.playerAddresses.length === 0) return null
    
    const currentAddr = gameState.playerAddresses[gameState.currentPlayerIndex]
    const currentName = gameState.playerNames[gameState.currentPlayerIndex] || `Player ${gameState.currentPlayerIndex + 1}`
    const currentScore = gameState.playerScores[gameState.currentPlayerIndex] || 0
    
    return { address: currentAddr, name: currentName, score: currentScore }
  }

  const gameStatus = getGameStatus()
  const currentPlayer = getCurrentPlayerInfo()

  /**
   * Handle player actions
   */
  const handlePlayerAction = async (action: string, data?: any) => {
    const success = await onAction(action, data)
    
    if (success) {
      // Clear selections after successful action
      setSelectedTiles([])
      setShowActionPanel(false)
    }
    
    return success
  }

  return (
    <div css={containerStyle}>
      {/* Game Header */}
      <div css={headerStyle}>
        <div css={headerLeftStyle}>
          <h1 css={gameTitleStyle}>
            🎮 Game {gameState.id}
            <span css={gameStatusStyle(gameStatus.color)}>
              {gameStatus.text}
            </span>
          </h1>
          
          {gameState.state === 1 && currentPlayer && (
            <div css={currentPlayerStyle}>
              <strong>Current Turn:</strong> {currentPlayer.name} 
              <span css={scoreStyle}>({currentPlayer.score} pts)</span>
            </div>
          )}
        </div>
        
        <div css={headerRightStyle}>
          <div css={gameInfoStyle}>
            <div>Turn: {gameState.turnNumber}</div>
            <div>Tiles: {gameState.tilesRemaining}</div>
            <div css={syncIndicatorStyle}>
              Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
            </div>
          </div>
          
          {onExit && (
            <button css={exitButtonStyle} onClick={onExit}>
              ← Back to Gallery
            </button>
          )}
        </div>
      </div>

      {/* Players Panel */}
      <div css={playersPanelStyle}>
        <h3>👥 Players ({gameState.playerAddresses.length}/{gameState.maxPlayers})</h3>
        <div css={playersListStyle}>
          {gameState.playerAddresses.map((address, index) => {
            const isCurrentPlayer = index === gameState.currentPlayerIndex
            const isYou = playerRole.playerIndex === index
            const name = gameState.playerNames[index] || `Player ${index + 1}`
            const score = gameState.playerScores[index] || 0
            
            return (
              <div 
                key={address} 
                css={playerCardStyle(isCurrentPlayer, isYou)}
              >
                <div css={playerInfoStyle}>
                  <strong>{name}</strong>
                  {isYou && <span css={youBadgeStyle}>YOU</span>}
                  {isCurrentPlayer && gameState.state === 1 && <span css={turnBadgeStyle}>TURN</span>}
                </div>
                <div css={playerScoreStyle}>{score} points</div>
                <div css={playerAddressStyle}>
                  {address.slice(0, 8)}...{address.slice(-4)}
                </div>
              </div>
            )
          })}
          
          {/* Empty slots */}
          {Array.from({ length: gameState.maxPlayers - gameState.playerAddresses.length }).map((_, index) => (
            <div key={`empty-${index}`} css={emptySlotStyle}>
              <div>🔓 Open Slot</div>
              <div css={emptySlotTextStyle}>Waiting for player...</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Game Board */}
      <div css={gameBoardContainerStyle}>
        <GameSpectator 
          gameId={gameState.id} 
          compact={false}
        />
      </div>

      {/* Player Actions Panel (only for players) */}
      {playerRole.isPlayer && (
        <div css={actionsPanelStyle(playerRole.canMakeMove)}>
          {playerRole.canMakeMove ? (
            <div css={activeActionsStyle}>
              <h3>🎯 Your Turn - Make a Move</h3>
              <div css={actionButtonsStyle}>
                <button 
                  css={actionButtonStyle('#4CAF50')}
                  onClick={() => handlePlayerAction('move')}
                >
                  🎲 Place Tiles
                </button>
                <button 
                  css={actionButtonStyle('#FF9800')}
                  onClick={() => handlePlayerAction('skip')}
                >
                  ⏭️ Skip Turn
                </button>
                <button 
                  css={actionButtonStyle('#F44336')}
                  onClick={() => handlePlayerAction('forfeit')}
                >
                  🏳️ Forfeit
                </button>
              </div>
            </div>
          ) : (
            <div css={waitingActionsStyle}>
              <div>⏳ Waiting for your turn...</div>
              <div css={waitingTextStyle}>
                {currentPlayer ? `${currentPlayer.name} is playing` : 'Game in progress'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading/Error States */}
      {gameState.isLoading && (
        <div css={loadingOverlayStyle}>
          <div css={loadingContentStyle}>
            <div css={spinnerStyle}>🔄</div>
            <div>Loading game state...</div>
          </div>
        </div>
      )}

      {gameState.error && (
        <div css={errorOverlayStyle}>
          <div css={errorContentStyle}>
            <div>❌ Error</div>
            <div>{gameState.error}</div>
            {onExit && (
              <button css={errorButtonStyle} onClick={onExit}>
                Back to Gallery
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const containerStyle = css`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
`

const headerLeftStyle = css`
  flex: 1;
`

const headerRightStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const gameTitleStyle = css`
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 12px;
`

const gameStatusStyle = (color: string) => css`
  background: ${color};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: normal;
`

const currentPlayerStyle = css`
  font-size: 0.9rem;
  opacity: 0.9;
`

const scoreStyle = css`
  color: #FFD700;
  font-weight: bold;
`

const gameInfoStyle = css`
  text-align: right;
  font-size: 0.8rem;
  opacity: 0.8;
  line-height: 1.4;
`

const syncIndicatorStyle = css`
  font-size: 0.7rem;
  font-family: monospace;
`

const exitButtonStyle = css`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`

const playersPanelStyle = css`
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  
  h3 {
    margin: 0 0 12px 0;
    font-size: 1rem;
  }
`

const playersListStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`

const playerCardStyle = (isCurrentPlayer: boolean, isYou: boolean) => css`
  background: rgba(255, 255, 255, ${isCurrentPlayer ? '0.25' : '0.15'});
  border: 2px solid ${isCurrentPlayer ? '#4CAF50' : 'transparent'};
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
  
  ${isYou && css`
    background: rgba(255, 215, 0, 0.2);
    border-color: #FFD700;
  `}
`

const playerInfoStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`

const youBadgeStyle = css`
  background: #FFD700;
  color: #333;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
`

const turnBadgeStyle = css`
  background: #4CAF50;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  animation: pulse 1.5s infinite;
`

const playerScoreStyle = css`
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 4px;
`

const playerAddressStyle = css`
  font-family: monospace;
  font-size: 0.8rem;
  opacity: 0.7;
`

const emptySlotStyle = css`
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  opacity: 0.6;
`

const emptySlotTextStyle = css`
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 4px;
`

const gameBoardContainerStyle = css`
  flex: 1;
  overflow: hidden;
  position: relative;
`

const actionsPanelStyle = (canMakeMove: boolean) => css`
  background: rgba(255, 255, 255, ${canMakeMove ? '0.15' : '0.1'});
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px 24px;
  color: white;
  
  ${canMakeMove && css`
    animation: glow 2s ease-in-out infinite alternate;
    
    @keyframes glow {
      from { box-shadow: 0 0 5px rgba(76, 175, 80, 0.3); }
      to { box-shadow: 0 0 20px rgba(76, 175, 80, 0.6); }
    }
  `}
`

const activeActionsStyle = css`
  h3 {
    margin: 0 0 12px 0;
    color: #4CAF50;
    font-size: 1.1rem;
  }
`

const actionButtonsStyle = css`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const actionButtonStyle = (color: string) => css`
  background: ${color};
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`

const waitingActionsStyle = css`
  text-align: center;
  opacity: 0.7;
  
  div:first-child {
    font-size: 1.1rem;
    margin-bottom: 4px;
  }
`

const waitingTextStyle = css`
  font-size: 0.9rem;
  opacity: 0.8;
`

const loadingOverlayStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const loadingContentStyle = css`
  text-align: center;
  color: white;
  font-size: 1.2rem;
`

const errorOverlayStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const errorContentStyle = css`
  background: white;
  color: #333;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  
  div:first-child {
    font-size: 1.5rem;
    margin-bottom: 12px;
  }
  
  div:nth-child(2) {
    margin-bottom: 20px;
    line-height: 1.5;
  }
`

const errorButtonStyle = css`
  background: #2196F3;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
`

const spinnerStyle = css`
  font-size: 2rem;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
` 