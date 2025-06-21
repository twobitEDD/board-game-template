/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'

interface TileItem {
  id: NumberTileId
  uniqueId: string
  location: {
    type: string
    x?: number
    y?: number
    player?: any
  }
}

interface PlayerResult {
  name: string
  score: number
  turns: number
  totalTilesPlaced: number
  longestSequence: number
  averageScore: number
}

interface GameStats {
  totalTurns: number
  totalTilesPlaced: number
  totalSequences: number
  gameTime: string
}

interface EndGameModalProps {
  isOpen: boolean
  onClose: () => void
  winner: PlayerResult
  loser?: PlayerResult
  gameStats: GameStats
  potValue: number // Total value of tiles at stake
  winnings: {
    tiles: TileItem[]
    cash: number
  }
}

export function EndGameModal({ 
  isOpen, 
  onClose, 
  winner, 
  loser, 
  gameStats, 
  potValue, 
  winnings 
}: EndGameModalProps) {
  if (!isOpen) return null

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

  const scoreDifference = loser ? winner.score - loser.score : 0
  const isCloseGame = scoreDifference > 0 && scoreDifference < 100

  return (
    <div css={overlayStyle} onClick={onClose}>
      <div css={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Victory Header */}
        <div css={headerStyle}>
          <div css={victoryIconStyle}>🏆</div>
          <h1 css={victoryTitleStyle}>VICTORY!</h1>
          <div css={winnerNameStyle}>{winner.name} Wins!</div>
          {isCloseGame && <div css={closeGameStyle}>What a close game!</div>}
        </div>

        {/* Score Comparison */}
        <div css={scoreComparisonStyle}>
          <div css={scoreCardStyle}>
            <div css={playerLabelStyle}>WINNER</div>
            <div css={playerNameStyle}>{winner.name}</div>
            <div css={winnerScoreStyle}>{winner.score}</div>
            <div css={statsRowStyle}>
              <span>Avg per turn: {winner.averageScore.toFixed(1)}</span>
              <span>Longest: {winner.longestSequence}</span>
            </div>
          </div>

          {loser && (
            <>
              <div css={vsStyle}>VS</div>
              <div css={[scoreCardStyle, loserCardStyle]}>
                <div css={playerLabelStyle}>PLAYER</div>
                <div css={playerNameStyle}>{loser.name}</div>
                <div css={loserScoreStyle}>{loser.score}</div>
                <div css={statsRowStyle}>
                  <span>Avg per turn: {loser.averageScore.toFixed(1)}</span>
                  <span>Longest: {loser.longestSequence}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Winnings Section */}
        <div css={winningsStyle}>
          <h3 css={winningSectionTitleStyle}>🎁 Your Winnings</h3>
          
          <div css={potValueStyle}>
            <div css={potLabelStyle}>Total Pot Value</div>
            <div css={potAmountStyle}>${potValue.toFixed(2)}</div>
          </div>

          <div css={winningsGridStyle}>
            <div css={winningsItemStyle}>
              <div css={winningsIconStyle}>🎯</div>
              <div css={winningsLabelStyle}>Tiles Won</div>
              <div css={winningsValueStyle}>{winnings.tiles.length} tiles</div>
            </div>

            <div css={winningsItemStyle}>
              <div css={winningsIconStyle}>💰</div>
              <div css={winningsLabelStyle}>Cash Value</div>
              <div css={winningsValueStyle}>${winnings.cash.toFixed(2)}</div>
            </div>

            <div css={winningsItemStyle}>
              <div css={winningsIconStyle}>📈</div>
              <div css={winningsLabelStyle}>Market Bonus</div>
              <div css={winningsValueStyle}>+15%</div>
            </div>
          </div>

          {/* Tiles Display */}
          {winnings.tiles.length > 0 && (
            <div css={tilesWonSectionStyle}>
              <div css={tilesWonLabelStyle}>Tiles Added to Your Collection:</div>
              <div css={tilesWonDisplayStyle}>
                {winnings.tiles.slice(0, 12).map((tile, index) => (
                  <div key={index} css={wonTileChipStyle}>
                    {getTileValue(tile.id)}
                  </div>
                ))}
                {winnings.tiles.length > 12 && (
                  <div css={moreTilesStyle}>+{winnings.tiles.length - 12} more</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Game Statistics */}
        <div css={gameStatsStyle}>
          <h3 css={statsSectionTitleStyle}>📊 Game Statistics</h3>
          <div css={statsGridStyle}>
            <div css={statItemStyle}>
              <div css={statValueStyle}>{gameStats.totalTurns}</div>
              <div css={statLabelStyle}>Total Turns</div>
            </div>
            <div css={statItemStyle}>
              <div css={statValueStyle}>{gameStats.totalTilesPlaced}</div>
              <div css={statLabelStyle}>Tiles Placed</div>
            </div>
            <div css={statItemStyle}>
              <div css={statValueStyle}>{gameStats.totalSequences}</div>
              <div css={statLabelStyle}>Sequences</div>
            </div>
            <div css={statItemStyle}>
              <div css={statValueStyle}>{gameStats.gameTime}</div>
              <div css={statLabelStyle}>Game Time</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div css={footerStyle}>
          <button css={secondaryButtonStyle} onClick={onClose}>
            View Board
          </button>
          <button css={primaryButtonStyle} onClick={onClose}>
            Collect Winnings
          </button>
        </div>
      </div>
    </div>
  )
}

// Styles
const overlayStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  padding: 20px;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 5px;
    padding-top: 10px;
  }
`

const modalStyle = css`
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  border-radius: 24px;
  border: 3px solid rgba(255, 215, 0, 0.3);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(255, 215, 0, 0.2);
  max-width: 600px;
  width: 100%;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  color: white;
  position: relative;
  
  @media (max-width: 768px) {
    max-height: calc(100vh - 20px);
    border-radius: 20px;
    border-width: 2px;
    max-width: none;
  }
  
  @media (max-width: 480px) {
    max-height: calc(100vh - 10px);
    border-radius: 15px;
    border-width: 1px;
  }
`

const headerStyle = css`
  text-align: center;
  padding: 30px 20px 20px;
  background: radial-gradient(circle at center, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 20px 15px 15px;
  }
  
  @media (max-width: 480px) {
    padding: 15px 10px 10px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.1) 50%, transparent 70%);
    animation: shimmer 2s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const victoryIconStyle = css`
  font-size: 64px;
  margin-bottom: 10px;
  animation: bounce 1.5s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 48px;
    margin-bottom: 8px;
  }
  
  @media (max-width: 480px) {
    font-size: 40px;
    margin-bottom: 6px;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
`

const victoryTitleStyle = css`
  font-size: 48px;
  font-weight: 900;
  margin: 0;
  background: linear-gradient(45deg, #FFD700, #FFA500, #FFD700);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: goldShine 2s ease-in-out infinite;
  text-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 36px;
  }
  
  @media (max-width: 480px) {
    font-size: 28px;
  }

  @keyframes goldShine {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
`

const winnerNameStyle = css`
  font-size: 24px;
  font-weight: 700;
  margin: 10px 0 5px 0;
  color: #FFD700;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
  
  @media (max-width: 480px) {
    font-size: 18px;
  }
`

const closeGameStyle = css`
  font-size: 14px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 5px;
`

const scoreComparisonStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  margin: 0 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    margin: 0 15px;
    padding: 15px;
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    margin: 0 10px;
    padding: 12px;
    gap: 12px;
  }
`

const scoreCardStyle = css`
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  background: rgba(76, 175, 80, 0.2);
  border: 2px solid rgba(76, 175, 80, 0.4);
  min-width: 150px;
  
  @media (max-width: 768px) {
    padding: 15px;
    min-width: 120px;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    min-width: auto;
    padding: 12px;
  }
`

const loserCardStyle = css`
  background: rgba(158, 158, 158, 0.2);
  border-color: rgba(158, 158, 158, 0.4);
`

const playerLabelStyle = css`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  opacity: 0.8;
  margin-bottom: 5px;
`

const playerNameStyle = css`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
`

const winnerScoreStyle = css`
  font-size: 32px;
  font-weight: 900;
  color: #FFD700;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`

const loserScoreStyle = css`
  font-size: 28px;
  font-weight: 700;
  color: #CCCCCC;
  margin-bottom: 8px;
`

const statsRowStyle = css`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  opacity: 0.8;
  gap: 10px;
`

const vsStyle = css`
  font-size: 20px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.6);
  padding: 0 10px;
  
  @media (max-width: 480px) {
    display: none;
  }
`

const winningsStyle = css`
  margin: 30px 20px 20px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%);
  border-radius: 16px;
  border: 2px solid rgba(255, 215, 0, 0.2);
  
  @media (max-width: 768px) {
    margin: 20px 15px 15px;
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    margin: 15px 10px 10px;
    padding: 12px;
  }
`

const winningSectionTitleStyle = css`
  margin: 0 0 15px 0;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: #FFD700;
`

const potValueStyle = css`
  text-align: center;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
`

const potLabelStyle = css`
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 5px;
`

const potAmountStyle = css`
  font-size: 28px;
  font-weight: 900;
  color: #FFD700;
`

const winningsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    gap: 12px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`

const winningsItemStyle = css`
  text-align: center;
  padding: 15px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const winningsIconStyle = css`
  font-size: 24px;
  margin-bottom: 8px;
`

const winningsLabelStyle = css`
  font-size: 11px;
  opacity: 0.8;
  margin-bottom: 5px;
`

const winningsValueStyle = css`
  font-size: 16px;
  font-weight: 700;
  color: #FFD700;
`

const tilesWonSectionStyle = css`
  margin-top: 20px;
`

const tilesWonLabelStyle = css`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
`

const tilesWonDisplayStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
`

const wonTileChipStyle = css`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #000;
  padding: 6px 10px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
`

const moreTilesStyle = css`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-style: italic;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`

const gameStatsStyle = css`
  margin: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const statsSectionTitleStyle = css`
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
`

const statsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
`

const statItemStyle = css`
  text-align: center;
`

const statValueStyle = css`
  font-size: 20px;
  font-weight: 700;
  color: #4CAF50;
  margin-bottom: 5px;
`

const statLabelStyle = css`
  font-size: 10px;
  opacity: 0.8;
`

const footerStyle = css`
  padding: 20px;
  display: flex;
  gap: 15px;
  justify-content: center;
`

const primaryButtonStyle = css`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #000;
  border: none;
  border-radius: 12px;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);

  &:hover {
    background: linear-gradient(135deg, #FFA500 0%, #FFD700 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 215, 0, 0.5);
  }
`

const secondaryButtonStyle = css`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 13px 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
  }
` 