/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { GameConfig } from '../components/GameSetup'

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
  gameMessage = '',
  currentPlayerIndex = 0
}: PlayerPanelsProps) {
  console.log('PlayerPanels rendering with config:', gameConfig)
  
  // Create players based on game config
  const playerColors = ['#2196F3', '#F44336', '#4CAF50', '#FF9800']
  const playerNames = gameConfig?.playerNames || []
  const playerCount = gameConfig?.playerCount || 1
  
  let players: Player[] = []
  
  try {
    players = playerNames.length > 0 
      ? playerNames.map((name, index) => ({
          id: `player${index + 1}`,
          name: name || `Player ${index + 1}`,
          color: playerColors[index] || '#9E9E9E',
          score: playerScores[index] || 0, // Use actual score for each player
          isActive: index === currentPlayerIndex // Current player is active
        }))
      : Array.from({ length: playerCount }, (_, index) => ({
          id: `player${index + 1}`,
          name: `Player ${index + 1}`,
          color: playerColors[index] || '#9E9E9E',
          score: playerScores[index] || 0, // Use actual score for each player
          isActive: index === currentPlayerIndex
        }))
    
    console.log('Generated players:', players)
  } catch (error) {
    console.error('Error creating players:', error)
    // Fallback to single player
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
    <div css={panelsContainerStyle}>
      <div css={panelHeaderStyle}>
        <h3 css={panelTitleStyle}>
          {isSinglePlayer ? 'Solo Practice' : 'Players'}
        </h3>
        <div css={gameInfoHeaderStyle}>
          <span>
            {isSinglePlayer 
              ? '🎯 Solo Mode' 
              : gameConfig.playType === 'local' ? '👥 Local' : '🌐 Online'
            }
          </span>
          <button css={backToSetupButtonStyle} onClick={onBackToSetup}>
            ← Setup
          </button>
        </div>
      </div>
      
      <div css={playersListStyle}>
        {players.map((player) => (
          <div 
            key={player.id}
            css={playerCardStyle}
            style={player.isActive ? {
              background: 'rgba(255, 255, 255, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            } : {}}
          >
            <div css={playerAvatarStyle(player.color)}>
              {player.name.charAt(0)}
            </div>
            <div css={playerInfoStyle}>
              <div css={playerNameStyle}>{player.name}</div>
              <div css={playerScoreStyle}>{player.score} pts</div>
            </div>
            {player.isActive && (
              <div css={activeIndicatorStyle}>●</div>
            )}
          </div>
        ))}
      </div>
      
      <div css={gameStatusStyle}>
        <h4 css={statusTitleStyle}>Game Status</h4>
        <div css={statusItemStyle}>
          <span css={statusLabelStyle}>Turn:</span>
          <span css={statusValueStyle}>{turnNumber}</span>
        </div>
        <div css={statusItemStyle}>
          <span css={statusLabelStyle}>Tiles Left:</span>
          <span css={statusValueStyle}>{tilesRemaining}</span>
        </div>
        {gameMessage && (
          <div css={currentMessageStyle}>
            <div css={messageLabelStyle}>Status:</div>
            <div css={messageTextStyle}>{gameMessage}</div>
          </div>
        )}
      </div>
      
      <div css={gameRulesStyle}>
        <h4 css={rulesTitleStyle}>
          {isSinglePlayer ? 'Solo Challenge' : 'Quick Rules'}
        </h4>
        <ul css={rulesListStyle}>
          <li>Place number tiles on the board</li>
          <li>Create sequences that sum to multiples of 5</li>
          <li>Tiles must connect to existing tiles</li>
          <li>Score points for valid sequences</li>
          {isSinglePlayer ? (
            <>
              <li>Practice and improve your skills</li>
              <li>Try to reach 500 points efficiently!</li>
            </>
          ) : (
            <li>First to 500 points wins!</li>
          )}
        </ul>
      </div>
    </div>
  )
}

const panelsContainerStyle = css`
  width: 280px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.2);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
  overflow-y: auto;
`

const panelHeaderStyle = css`
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`

const panelTitleStyle = css`
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`

const playersListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const playerCardStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
`

const playerAvatarStyle = (color: string) => css`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${color || '#9E9E9E'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
`

const playerInfoStyle = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const playerNameStyle = css`
  color: white;
  font-weight: 600;
  font-size: 14px;
`

const playerScoreStyle = css`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
`

const activeIndicatorStyle = css`
  color: #4CAF50;
  font-size: 12px;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const gameRulesStyle = css`
  margin-top: auto;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const rulesTitleStyle = css`
  margin: 0 0 10px 0;
  color: white;
  font-size: 14px;
  font-weight: 600;
`

const rulesListStyle = css`
  margin: 0;
  padding-left: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  line-height: 1.4;
  
  li {
    margin-bottom: 4px;
  }
`

const gameInfoHeaderStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`

const backToSetupButtonStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 6px 12px;
  color: white;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
`

const gameStatusStyle = css`
  padding: 15px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(76, 175, 80, 0.2);
  margin-bottom: 10px;
`

const statusTitleStyle = css`
  margin: 0 0 10px 0;
  color: white;
  font-size: 14px;
  font-weight: 600;
`

const statusItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`

const statusLabelStyle = css`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 500;
`

const statusValueStyle = css`
  color: white;
  font-size: 12px;
  font-weight: 700;
`

const currentMessageStyle = css`
  margin-top: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const messageLabelStyle = css`
  color: rgba(255, 255, 255, 0.8);
  font-size: 10px;
  font-weight: 600;
  margin-bottom: 4px;
`

const messageTextStyle = css`
  color: white;
  font-size: 11px;
  line-height: 1.3;
  word-wrap: break-word;
`
