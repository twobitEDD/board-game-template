/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { GameConfig } from '../components/GameSetup'
import { QuiltingWorkshopTheme } from '../components/QuiltingWorkshopTheme'

interface Player {
  id: string
  name: string
  color: string
  score: number
  isActive: boolean
}

interface PlayerPanelsProps {
  gameConfig: GameConfig
  onBackToSetup: () => void
  playerScores?: number[]
  turnNumber?: number
  tilesRemaining?: number
  gameMessage?: string
  currentPlayerIndex?: number
}

export function PlayerPanels({ 
  gameConfig, 
  onBackToSetup, 
  playerScores = [0], 
  turnNumber = 1, 
  tilesRemaining = 0,
  gameMessage: _gameMessage = '',
  currentPlayerIndex = 0
}: PlayerPanelsProps) {
  // Clean player colors
  const playerColors = ['#FFD700', '#87CEEB', '#98FB98', '#DDA0DD']
  const playerNames = gameConfig?.playerNames || []
  const playerCount = gameConfig?.playerCount || 1
  
  let players: Player[] = []
  
  try {
    players = playerNames.length > 0 
      ? playerNames.map((name, index) => ({
          id: `player${index + 1}`,
          name: name || `Player ${index + 1}`,
          color: playerColors[index] || '#FFD700',
          score: playerScores[index] || 0,
          isActive: index === currentPlayerIndex
        }))
      : Array.from({ length: playerCount }, (_, index) => ({
          id: `player${index + 1}`,
          name: `Player ${index + 1}`,
          color: playerColors[index] || '#FFD700',
          score: playerScores[index] || 0,
          isActive: index === currentPlayerIndex
        }))
  } catch (error) {
    console.error('Error creating players:', error)
    players = [{
      id: 'player1',
      name: 'Player 1',
      color: playerColors[0],
      score: playerScores[0] || 0,
      isActive: true
    }]
  }

  const isSinglePlayer = playerCount === 1

  return (
    <div css={sidebarPanelsStyle}>
      {/* Header */}
      <div css={panelHeaderStyle}>
        <h2 css={panelTitleStyle}>
          {isSinglePlayer ? 'Solo Session' : 'Players'}
        </h2>
        <button css={backButtonStyle} onClick={onBackToSetup}>
          ← Setup
        </button>
      </div>
      
      {/* Players List */}
      <div css={playersListStyle}>
        {players.map((player) => (
          <div key={player.id} css={playerCardStyle(player.isActive)}>
            <div css={playerAvatarStyle(player.color)}>
              {player.name.charAt(0)}
            </div>
            <div css={playerInfoStyle}>
              <div css={playerNameStyle}>
                {player.name}
              </div>
              <div css={playerScoreStyle}>
                {player.score} pts
              </div>
            </div>
            {player.isActive && (
              <div css={activeIndicatorStyle}>●</div>
            )}
          </div>
        ))}
      </div>
      
      {/* Game Status */}
      <div css={gameStatusStyle}>
        <h3 css={statusTitleStyle}>Game Status</h3>
        <div css={statusGridStyle}>
          <div css={statusItemStyle}>
            <span css={statusLabelStyle}>Turn:</span>
            <span css={statusValueStyle}>{turnNumber}</span>
          </div>
          <div css={statusItemStyle}>
            <span css={statusLabelStyle}>Tiles:</span>
            <span css={statusValueStyle}>{tilesRemaining}</span>
          </div>
        </div>
      </div>
      
      {/* Quick Guide */}
      <div css={quickGuideStyle}>
        <h3 css={guideTitleStyle}>Quick Guide</h3>
        <div css={guideListStyle}>
          <div css={guideItemStyle}>
            <span css={guideIconStyle}>🎯</span>
            <span css={guideTextStyle}>Sum to 3, 5, or 7</span>
          </div>
          <div css={guideItemStyle}>
            <span css={guideIconStyle}>🔗</span>
            <span css={guideTextStyle}>Connect to existing tiles</span>
          </div>
          <div css={guideItemStyle}>
            <span css={guideIconStyle}>⭐</span>
            <span css={guideTextStyle}>Score points for sequences</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Clean, minimal styles
const sidebarPanelsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
`

const panelHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
`

const panelTitleStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.2rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  margin: 0;
`

const backButtonStyle = css`
  background: rgba(139, 69, 19, 0.6);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  padding: 6px 12px;
  color: ${QuiltingWorkshopTheme.colors.text};
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(139, 69, 19, 0.8);
    border-color: rgba(255, 215, 0, 0.5);
  }
`

const playersListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const playerCardStyle = (isActive: boolean) => css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${isActive 
    ? 'rgba(255, 215, 0, 0.15)' 
    : 'rgba(139, 69, 19, 0.2)'};
  border-radius: 8px;
  border: 1px solid ${isActive 
    ? 'rgba(255, 215, 0, 0.4)' 
    : 'rgba(255, 215, 0, 0.2)'};
  transition: all 0.2s ease;
`

const playerAvatarStyle = (color: string) => css`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-weight: bold;
  color: #2d1810;
  font-size: 0.9rem;
`

const playerInfoStyle = css`
  flex: 1;
`

const playerNameStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-weight: 600;
  color: ${QuiltingWorkshopTheme.colors.text};
  font-size: 0.9rem;
  margin-bottom: 2px;
`

const playerScoreStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  font-size: 0.8rem;
`

const activeIndicatorStyle = css`
  color: ${QuiltingWorkshopTheme.colors.accent};
  font-size: 1rem;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const gameStatusStyle = css`
  padding: 16px;
  background: rgba(139, 69, 19, 0.15);
  border-radius: 8px;
`

const statusTitleStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  margin: 0 0 12px 0;
`

const statusGridStyle = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`

const statusItemStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const statusLabelStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.7rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const statusValueStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.1rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  font-weight: bold;
`

const quickGuideStyle = css`
  padding: 16px;
  background: rgba(139, 69, 19, 0.1);
  border-radius: 8px;
`

const guideTitleStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1rem;
  color: ${QuiltingWorkshopTheme.colors.accent};
  margin: 0 0 12px 0;
`

const guideListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const guideItemStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
`

const guideIconStyle = css`
  font-size: 0.9rem;
  width: 20px;
  text-align: center;
`

const guideTextStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.75rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  line-height: 1.3;
`
