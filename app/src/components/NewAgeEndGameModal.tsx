/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

interface PlayerResult {
  name: string
  score: number
  turns: number
  totalTilesPlaced: number
  averageScore: number
}

interface GameStats {
  totalTurns: number
  totalTilesPlaced: number
  gameTime: string
  tilesRemaining: number
}

interface NewAgeEndGameModalProps {
  isOpen: boolean
  onClose: () => void
  onNewGame: () => void
  onMainMenu: () => void
  playerResult: PlayerResult
  gameStats: GameStats
  achievements: string[]
  gameMode: string
}

export function NewAgeEndGameModal({ 
  isOpen, 
  onClose, 
  onNewGame,
  onMainMenu,
  playerResult, 
  gameStats, 
  achievements,
  gameMode
}: NewAgeEndGameModalProps) {
  if (!isOpen) return null

  const isHighScore = playerResult.score >= 1000
  const isPerfectGame = gameStats.tilesRemaining === 0

  return (
    <div css={overlayStyle} onClick={onClose}>
      <div css={modalStyle} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div css={headerStyle}>
          <div css={completionIconStyle}>
            {isPerfectGame ? '🏆' : isHighScore ? '⭐' : '✨'}
          </div>
          <h1 css={titleStyle}>
            {isPerfectGame ? 'PERFECT WEAVING!' : isHighScore ? 'EXCELLENT WEAVING!' : 'WEAVING COMPLETE!'}
          </h1>
          <div css={subtitleStyle}>{playerResult.name}</div>
        </div>

        <div css={contentStyle}>
          {/* Final Score */}
          <div css={scoreSection}>
            <div css={finalScoreLabelStyle}>Final Score</div>
            <div css={finalScoreValueStyle}>{playerResult.score.toLocaleString()}</div>
            <div css={scoreModeStyle}>{gameMode} Mode</div>
          </div>

          {/* Game Statistics */}
          <div css={statsSection}>
            <h3 css={sectionTitleStyle}>📊 Game Statistics</h3>
            <div css={statsGridStyle}>
              <div css={statItemStyle}>
                <div css={statValueStyle}>{gameStats.totalTurns}</div>
                <div css={statLabelStyle}>Turns</div>
              </div>
              <div css={statItemStyle}>
                <div css={statValueStyle}>{gameStats.totalTilesPlaced}</div>
                <div css={statLabelStyle}>Tiles Placed</div>
              </div>
              <div css={statItemStyle}>
                <div css={statValueStyle}>{playerResult.averageScore.toFixed(1)}</div>
                <div css={statLabelStyle}>Avg per Turn</div>
              </div>
              <div css={statItemStyle}>
                <div css={statValueStyle}>{gameStats.gameTime}</div>
                <div css={statLabelStyle}>Game Time</div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div css={achievementsSection}>
              <h3 css={sectionTitleStyle}>🏅 Achievements Unlocked</h3>
              <div css={achievementsListStyle}>
                {achievements.map((achievement, index) => (
                  <div key={index} css={achievementItemStyle}>
                    {achievement}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Summary */}
          <div css={summarySection}>
            <div css={summaryItemStyle}>
              <span css={summaryLabelStyle}>Efficiency:</span>
              <span css={summaryValueStyle}>
                {playerResult.averageScore >= 100 ? 'Excellent' : 
                 playerResult.averageScore >= 50 ? 'Good' : 'Developing'}
              </span>
            </div>
            <div css={summaryItemStyle}>
              <span css={summaryLabelStyle}>Completion:</span>
              <span css={summaryValueStyle}>
                {isPerfectGame ? 'Perfect (All tiles used)' : `${gameStats.tilesRemaining} tiles remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div css={footerStyle}>
          <button css={secondaryButtonStyle} onClick={onMainMenu}>
            Main Menu
          </button>
          <button css={primaryButtonStyle} onClick={onNewGame}>
            New Game
          </button>
          <button css={tertiaryButtonStyle} onClick={onClose}>
            View Board
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
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  padding: 20px;
  box-sizing: border-box;
`

const modalStyle = css`
  background: linear-gradient(135deg, 
    rgba(20, 40, 60, 0.98) 0%, 
    rgba(30, 50, 70, 0.98) 50%, 
    rgba(20, 40, 60, 0.98) 100%);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  color: #E8E8E8;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
`

const headerStyle = css`
  padding: 30px 24px 20px;
  text-align: center;
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.15) 0%, 
    rgba(100, 200, 255, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
`

const completionIconStyle = css`
  font-size: 4rem;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.6));
`

const titleStyle = css`
  font-family: 'Fredoka One', Arial, sans-serif;
  font-size: 2.2rem;
  font-weight: bold;
  color: #FFD700;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
  letter-spacing: 1px;
`

const subtitleStyle = css`
  font-size: 1.2rem;
  color: #B8B8B8;
  font-weight: 600;
`

const contentStyle = css`
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const scoreSection = css`
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.1) 0%, 
    rgba(255, 215, 0, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.2);
`

const finalScoreLabelStyle = css`
  font-size: 1rem;
  color: #B8B8B8;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const finalScoreValueStyle = css`
  font-family: 'Fredoka One', Arial, sans-serif;
  font-size: 3rem;
  color: #FFD700;
  font-weight: bold;
  margin-bottom: 4px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
`

const scoreModeStyle = css`
  font-size: 0.9rem;
  color: #888;
  font-style: italic;
`

const statsSection = css`
  background: linear-gradient(135deg, 
    rgba(100, 200, 255, 0.08) 0%, 
    rgba(100, 200, 255, 0.04) 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(100, 200, 255, 0.15);
`

const sectionTitleStyle = css`
  font-size: 1.2rem;
  color: #FFD700;
  margin: 0 0 16px 0;
  text-align: center;
  font-weight: bold;
`

const statsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`

const statItemStyle = css`
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`

const statValueStyle = css`
  font-family: 'Fredoka One', Arial, sans-serif;
  font-size: 1.8rem;
  color: #64C8FF;
  font-weight: bold;
  margin-bottom: 4px;
`

const statLabelStyle = css`
  font-size: 0.8rem;
  color: #B8B8B8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const achievementsSection = css`
  background: linear-gradient(135deg, 
    rgba(255, 165, 0, 0.08) 0%, 
    rgba(255, 165, 0, 0.04) 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 165, 0, 0.15);
`

const achievementsListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const achievementItemStyle = css`
  background: rgba(255, 215, 0, 0.1);
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #FFD700;
  font-size: 0.9rem;
  color: #E8E8E8;
`

const summarySection = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const summaryItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const summaryLabelStyle = css`
  color: #B8B8B8;
  font-weight: 500;
`

const summaryValueStyle = css`
  color: #E8E8E8;
  font-weight: bold;
`

const footerStyle = css`
  padding: 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.3) 0%, 
    rgba(0, 0, 0, 0.2) 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
`

const primaryButtonStyle = css`
  padding: 12px 24px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 120px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  }
`

const secondaryButtonStyle = css`
  padding: 12px 24px;
  background: linear-gradient(135deg, 
    rgba(100, 200, 255, 0.8) 0%, 
    rgba(64, 160, 255, 0.8) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 120px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(100, 200, 255, 0.4);
  }
`

const tertiaryButtonStyle = css`
  padding: 12px 24px;
  background: linear-gradient(135deg, 
    rgba(128, 128, 128, 0.6) 0%, 
    rgba(96, 96, 96, 0.6) 100%);
  color: #E8E8E8;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 120px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(128, 128, 128, 0.3);
  }
`
