/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'
import { QuiltingWorkshopTheme } from './QuiltingWorkshopTheme'

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
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: 20px;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }
`

const modalStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(139, 69, 19, 0.96) 0%, 
      rgba(160, 82, 45, 0.96) 30%, 
      rgba(218, 165, 32, 0.96) 70%, 
      rgba(139, 69, 19, 0.96) 100%);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  color: ${QuiltingWorkshopTheme.colors.text};
  overflow: hidden;
  
  /* Warm cozy atmosphere like reference */
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.12) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(139, 69, 19, 0.08) 1px, transparent 1px);
  background-size: 35px 35px, 25px 25px;
  
  @media (max-width: 768px) {
    max-height: calc(100vh - 20px);
    border-radius: 16px;
    width: 100%;
    max-width: none;
  }
  
  @media (max-width: 480px) {
    border-radius: 12px;
  }
`

const headerStyle = css`
  flex-shrink: 0;
  padding: 24px;
  background: 
    linear-gradient(135deg, 
      rgba(255, 215, 0, 0.25) 0%, 
      rgba(218, 165, 32, 0.2) 50%, 
      rgba(255, 215, 0, 0.15) 100%);
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 16px;
  }
`

const victoryIconStyle = css`
  font-size: 3rem;
  margin-bottom: 8px;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
`

const victoryTitleStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 2.5rem;
  font-weight: bold;
  color: ${QuiltingWorkshopTheme.colors.accent};
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.7rem;
  }
`

const winnerNameStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 1.3rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`

const closeGameStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.9rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  font-style: italic;
  margin-top: 8px;
`

const scoreComparisonStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
`

const scoreCardStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(255, 215, 0, 0.15) 0%, 
      rgba(218, 165, 32, 0.12) 100%);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  min-width: 120px;
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 200px;
  }
`

const loserCardStyle = css`
  opacity: 0.8;
`

const playerLabelStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.8rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const playerNameStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.1rem;
  color: ${QuiltingWorkshopTheme.colors.text};
  font-weight: bold;
  margin-bottom: 8px;
`

const winnerScoreStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 2rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
`

const loserScoreStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.8rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  font-weight: bold;
  margin-bottom: 8px;
`

const statsRowStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.75rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const vsStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.5rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`

const winningsStyle = css`
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`

const winningSectionTitleStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.3rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  margin: 0 0 16px 0;
  text-align: center;
`

const potValueStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(255, 215, 0, 0.2) 0%, 
      rgba(218, 165, 32, 0.15) 100%);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  margin-bottom: 16px;
`

const potLabelStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.9rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  margin-bottom: 4px;
`

const potAmountStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.8rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  font-weight: bold;
`

const winningsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
`

const winningsItemStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(139, 69, 19, 0.3) 0%, 
      rgba(160, 82, 45, 0.2) 100%);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`

const winningsIconStyle = css`
  font-size: 1.5rem;
  margin-bottom: 4px;
`

const winningsLabelStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.8rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  margin-bottom: 4px;
`

const winningsValueStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 1rem;
  color: ${QuiltingWorkshopTheme.colors.text};
  font-weight: bold;
`

const tilesWonSectionStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(255, 215, 0, 0.1) 0%, 
      rgba(218, 165, 32, 0.08) 100%);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
`

const tilesWonLabelStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.9rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  margin-bottom: 8px;
`

const tilesWonDisplayStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const wonTileChipStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(255, 215, 0, 0.4) 0%, 
      rgba(218, 165, 32, 0.3) 100%);
  color: ${QuiltingWorkshopTheme.colors.text};
  padding: 4px 8px;
  border-radius: 6px;
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-weight: bold;
  font-size: 0.8rem;
`

const moreTilesStyle = css`
  padding: 4px 8px;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.8rem;
  font-style: italic;
`

const gameStatsStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(139, 69, 19, 0.15) 0%, 
      rgba(160, 82, 45, 0.12) 100%);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`

const statsSectionTitleStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.1rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  margin: 0 0 12px 0;
  text-align: center;
`

const statsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
`

const statItemStyle = css`
  text-align: center;
`

const statValueStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.5rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  font-weight: bold;
  margin-bottom: 4px;
`

const statLabelStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.7rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const footerStyle = css`
  flex-shrink: 0;
  padding: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
  background: 
    linear-gradient(135deg, 
      rgba(139, 69, 19, 0.2) 0%, 
      rgba(160, 82, 45, 0.15) 100%);
  
  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`

const primaryButtonStyle = css`
  padding: 12px 24px;
  background: 
    linear-gradient(135deg, 
      ${QuiltingWorkshopTheme.colors.accent} 0%, 
      rgba(218, 165, 32, 0.9) 100%);
  color: ${QuiltingWorkshopTheme.colors.primary};
  border: none;
  border-radius: 8px;
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5);
  }
  
  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 0.9rem;
  }
`

const secondaryButtonStyle = css`
  padding: 12px 24px;
  background: 
    linear-gradient(135deg, 
      rgba(139, 69, 19, 0.8) 0%, 
      rgba(160, 82, 45, 0.8) 100%);
  color: ${QuiltingWorkshopTheme.colors.text};
  border: none;
  border-radius: 8px;
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(139, 69, 19, 0.4);
  }
  
  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 0.9rem;
  }
` 