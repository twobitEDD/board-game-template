/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import type { GameConfig } from '../GameDisplay'
import type { GameState } from './NewAgeGameBoard'
import { NewAgeTile } from './NewAgeTile'
import { NumberTileId, GameParkUtils } from '../gamepark'

interface NewAgePlayerPanelProps {
  gameConfig: GameConfig
  gameState: GameState
}

export function NewAgePlayerPanel({ gameConfig, gameState }: NewAgePlayerPanelProps) {
  // Helper function to get tile numeric value
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

  // Calculate total remaining tiles for each player
  const getPlayerRemainingTiles = (playerIndex: number) => {
    const handTiles = gameState.playerHands[playerIndex]?.length || 0
    const drawPileTiles = gameState.playerDrawPiles[playerIndex]?.length || 0
    return handTiles + drawPileTiles
  }

  return (
    <div css={panelStyle}>
      <div css={headerStyle}>
        <h2 css={titleStyle}>Weavers</h2>
        <div css={gameInfoStyle}>
          Goal: {gameConfig.winningScore} points
        </div>
      </div>

      <div css={playersContainerStyle}>
        {gameConfig.playerNames.map((playerName, index) => {
          const remainingTiles = getPlayerRemainingTiles(index)
          const handTiles = gameState.playerHands[index]?.length || 0
          const drawPileTiles = gameState.playerDrawPiles[index]?.length || 0
          
          return (
            <div 
              key={index} 
              css={[
                playerCardStyle, 
                index === gameState.currentPlayer && activePlayerStyle,
                gameState.winner === index && winnerStyle
              ]}
            >
              {/* Player Header */}
              <div css={playerHeaderStyle}>
                <div css={playerNameStyle}>
                  {playerName}
                  {index === gameState.currentPlayer && (
                    <span css={currentPlayerBadgeStyle}>Active</span>
                  )}
                  {gameState.winner === index && (
                    <span css={winnerBadgeStyle}>Winner!</span>
                  )}
                </div>
                <div css={playerScoreStyle}>
                  {gameState.scores[index]} pts
                </div>
              </div>

              {/* Enhanced Tile Count Display */}
              <div css={tileCountSectionStyle}>
                <div css={tileCountHeaderStyle}>
                  <span css={tileCountLabelStyle}>Remaining Threads</span>
                  <span css={tileCountTotalStyle}>{remainingTiles}</span>
                </div>
                <div css={tileBreakdownStyle}>
                  <div css={tileBreakdownItemStyle}>
                    <span css={tileBreakdownLabelStyle}>Hand:</span>
                    <span css={tileBreakdownValueStyle}>{handTiles}</span>
                  </div>
                  <div css={tileBreakdownItemStyle}>
                    <span css={tileBreakdownLabelStyle}>Pile:</span>
                    <span css={tileBreakdownValueStyle}>{drawPileTiles}</span>
                  </div>
                </div>
                {remainingTiles <= 5 && (
                  <div css={lowTilesWarningStyle}>
                    ⚠️ Low on threads!
                  </div>
                )}
              </div>

              {/* Player Hand */}
              <div css={handSectionStyle}>
                <div css={handTitleStyle}>
                  Current Hand ({handTiles} threads)
                </div>
                <div css={handGridStyle}>
                  {gameState.playerHands[index].map((tile, tileIndex) => (
                    <NewAgeTile
                      key={`${tile.id}-${tileIndex}`}
                      value={getTileValue(tile.id)}
                      state="unplayed"
                      size={24}
                      isSelected={false}
                      onClick={() => {}}
                    />
                  ))}
                  {gameState.playerHands[index].length === 0 && (
                    <div css={emptyHandStyle}>No threads in hand</div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div css={progressSectionStyle}>
                <div css={progressLabelStyle}>Progress to Goal</div>
                <div css={progressBarStyle}>
                  <div 
                    css={progressFillStyle(gameState.scores[index] / gameConfig.winningScore)}
                  />
                </div>
                <div css={progressTextStyle}>
                  {Math.round((gameState.scores[index] / gameConfig.winningScore) * 100)}%
                </div>
              </div>

              {/* Tiles on Board Section */}
              <div css={boardTilesSectionStyle}>
                <div css={boardTilesTitleStyle}>
                  Tiles on Board ({gameState.playerTileCounts?.[index] || 0})
                </div>
                <div css={boardTilesGridStyle}>
                  {gameState.boardTiles
                    .filter(tile => tile.placedByPlayer === index)
                    .slice(0, 8) // Show max 8 tiles
                    .map((tile, tileIndex) => (
                      <NewAgeTile
                        key={`board-${tile.id}-${tileIndex}`}
                        value={getTileValue(tile.id)}
                        state={tile.state || 'played'}
                        countdownTurns={tile.countdownTurns}
                        size={20}
                        isSelected={false}
                        onClick={() => {}}
                      />
                    ))}
                  {gameState.boardTiles.filter(tile => tile.placedByPlayer === index).length === 0 && (
                    <div css={noBoardTilesStyle}>No tiles placed yet</div>
                  )}
                  {gameState.boardTiles.filter(tile => tile.placedByPlayer === index).length > 8 && (
                    <div css={moreTilesStyle}>
                      +{gameState.boardTiles.filter(tile => tile.placedByPlayer === index).length - 8} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Game Status */}
      <div css={statusSectionStyle}>
        <h3 css={statusTitleStyle}>Game Status</h3>
        <div css={statusItemStyle}>
          <span css={statusLabelStyle}>Mode:</span>
          <span css={statusValueStyle}>Classic Weaving</span>
        </div>
        <div css={statusItemStyle}>
          <span css={statusLabelStyle}>Turn:</span>
          <span css={statusValueStyle}>{gameState.turnNumber}</span>
        </div>
        <div css={statusItemStyle}>
          <span css={statusLabelStyle}>Total Threads Left:</span>
          <span css={statusValueStyle}>
            {gameState.playerHands.reduce((sum, hand) => sum + hand.length, 0) + 
             gameState.playerDrawPiles.reduce((sum, pile) => sum + pile.length, 0)}
          </span>
        </div>
        <div css={statusItemStyle}>
          <span css={statusLabelStyle}>Burning Tiles:</span>
          <span css={statusValueStyle}>
            {gameState.burningTiles?.length || 0}
            {gameState.burningTiles && gameState.burningTiles.length > 0 && (
              <span css={burningWarningStyle}> 🔥</span>
            )}
          </span>
        </div>
        {gameState.gameEnded && (
          <div css={gameEndedStyle}>
            🎉 Game Complete!
          </div>
        )}
      </div>
    </div>
  )
}

const panelStyle = css`
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const headerStyle = css`
  text-align: center;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 16px;
`

const titleStyle = css`
  color: #FFD700;
  font-family: 'Fredoka One', cursive;
  font-size: 1.3rem;
  margin: 0 0 8px 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`

const gameInfoStyle = css`
  color: #F5DEB3;
  font-size: 0.9rem;
  opacity: 0.9;
`

const playersContainerStyle = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
`

const playerCardStyle = css`
  position: relative;
  background: rgba(255, 215, 0, 0.08);
  border: 2px solid rgba(255, 215, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
`

const activePlayerStyle = css`
  position: relative;
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, 
      rgba(255, 215, 0, 0.2) 0%, 
      transparent 50%, 
      rgba(255, 215, 0, 0.2) 100%
    );
    border-radius: 14px;
    z-index: -1;
    animation: shimmer 2s ease-in-out infinite;
    pointer-events: none;
  }
`

const winnerStyle = css`
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.3) 0%, 
    rgba(255, 140, 0, 0.2) 100%
  );
  border-color: #FFD700;
  box-shadow: 0 0 24px rgba(255, 215, 0, 0.5);
`

const playerHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`

const playerNameStyle = css`
  color: #FFD700;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`

const currentPlayerBadgeStyle = css`
  background: rgba(255, 215, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.7rem;
  font-weight: 500;
  animation: glow 2s ease-in-out infinite;
`

const winnerBadgeStyle = css`
  background: linear-gradient(45deg, 
    rgba(255, 215, 0, 0.5) 0%, 
    rgba(255, 140, 0, 0.7) 100%
  );
  border: 1px solid #FFD700;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  animation: countdown-pulse 1.5s ease-in-out infinite;
`

const playerScoreStyle = css`
  color: #87CEEB;
  font-size: 1.2rem;
  font-weight: 700;
`

const handSectionStyle = css`
  margin-bottom: 12px;
`

const handTitleStyle = css`
  color: #F5DEB3;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 8px;
  opacity: 0.9;
`

const handGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(24px, 1fr));
  gap: 4px;
  max-height: 60px;
  overflow-y: auto;
`

const emptyHandStyle = css`
  grid-column: 1 / -1;
  text-align: center;
  color: rgba(245, 222, 179, 0.6);
  font-size: 0.8rem;
  font-style: italic;
  padding: 8px;
`

const progressSectionStyle = css`
  margin-top: 8px;
`

const progressLabelStyle = css`
  color: #F5DEB3;
  font-size: 0.7rem;
  margin-bottom: 4px;
  opacity: 0.8;
`

const progressBarStyle = css`
  width: 100%;
  height: 8px;
  background: rgba(47, 79, 79, 0.5);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
`

const progressFillStyle = (progress: number) => {
  // Ensure progress is a valid number with bounds checking
  const safeProgress = typeof progress === 'number' && !isNaN(progress) && progress >= 0 ? progress : 0
  const boundedProgress = Math.min(Math.max(safeProgress, 0), 1) // 0-1 range
  const widthPercentage = Math.round(boundedProgress * 100) // Round to integer percentage
  
  return css`
    width: ${widthPercentage}%;
    height: 100%;
    background: linear-gradient(90deg, 
      rgba(34, 139, 34, 0.8) 0%, 
      rgba(255, 215, 0, 0.9) 100%
    );
    border-radius: 4px;
    transition: width 0.5s ease;
  `
}

const progressTextStyle = css`
  color: rgba(255, 215, 0, 0.8);
  font-size: 0.7rem;
  text-align: right;
`

const statusSectionStyle = css`
  border-top: 2px solid rgba(255, 215, 0, 0.3);
  padding-top: 16px;
`

const statusTitleStyle = css`
  color: #FFD700;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
`

const statusItemStyle = css`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`

const statusLabelStyle = css`
  color: #F5DEB3;
  font-size: 0.9rem;
  opacity: 0.9;
`

const statusValueStyle = css`
  color: #87CEEB;
  font-size: 0.9rem;
  font-weight: 600;
`

const gameEndedStyle = css`
  text-align: center;
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.3) 0%, 
    rgba(255, 140, 0, 0.2) 100%
  );
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 12px;
  color: #FFD700;
  font-weight: 700;
  margin-top: 12px;
  animation: glow 2s ease-in-out infinite;
`

const tileCountSectionStyle = css`
  margin-bottom: 12px;
`

const tileCountHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const tileCountLabelStyle = css`
  color: #F5DEB3;
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.9;
`

const tileCountTotalStyle = css`
  color: #87CEEB;
  font-size: 1.2rem;
  font-weight: 700;
`

const tileBreakdownStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const tileBreakdownItemStyle = css`
  display: flex;
  flex-direction: column;
`

const tileBreakdownLabelStyle = css`
  color: #F5DEB3;
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.9;
`

const tileBreakdownValueStyle = css`
  color: #87CEEB;
  font-size: 0.9rem;
  font-weight: 600;
`

const lowTilesWarningStyle = css`
  text-align: center;
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.3) 0%, 
    rgba(255, 140, 0, 0.2) 100%
  );
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 8px;
  color: #FFD700;
  font-weight: 700;
  margin-top: 12px;
  animation: glow 2s ease-in-out infinite;
`

const boardTilesSectionStyle = css`
  margin-top: 12px;
`

const boardTilesTitleStyle = css`
  color: #F5DEB3;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 8px;
  opacity: 0.9;
`

const boardTilesGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20px, 1fr));
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
`

const noBoardTilesStyle = css`
  grid-column: 1 / -1;
  text-align: center;
  color: rgba(245, 222, 179, 0.6);
  font-size: 0.8rem;
  font-style: italic;
  padding: 8px;
`

const moreTilesStyle = css`
  grid-column: 1 / -1;
  text-align: center;
  color: rgba(255, 215, 0, 0.8);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 8px;
`

const burningWarningStyle = css`
  color: #FF4500;
  font-size: 0.8rem;
  font-weight: 700;
  margin-left: 4px;
  animation: pulse 1s ease-in-out infinite;
` 