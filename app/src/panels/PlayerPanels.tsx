/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { GameConfig } from '../components/GameSetup'
import { EmbroideredText, QuiltedSurface, FabricButton } from '../components/YarnWorldTheme'

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
  // Yarn-themed player colors
  const playerColors = ['#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD']
  const playerNames = gameConfig?.playerNames || []
  const playerCount = gameConfig?.playerCount || 1
  
  let players: Player[] = []
  
  try {
    players = playerNames.length > 0 
      ? playerNames.map((name, index) => ({
          id: `player${index + 1}`,
          name: name || `Player ${index + 1}`,
          color: playerColors[index] || '#FFB6C1',
          score: playerScores[index] || 0,
          isActive: index === currentPlayerIndex
        }))
      : Array.from({ length: playerCount }, (_, index) => ({
          id: `player${index + 1}`,
          name: `Player ${index + 1}`,
          color: playerColors[index] || '#FFB6C1',
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
    <div css={craftingCabinetStyle}>
      {/* Cabinet Header */}
      <QuiltedSurface padding="15px" color="#F8F0E3">
        <div css={cabinetHeaderStyle}>
          <EmbroideredText size="1.2rem" color="#8B4513">
            🧵 {isSinglePlayer ? 'Solo Workshop' : 'Crafters'}
          </EmbroideredText>
          <div css={workshopInfoStyle}>
            <EmbroideredText size="0.8rem" color="#654321">
              {isSinglePlayer 
                ? '🎯 Practice Mode' 
                : gameConfig.playType === 'local' ? '👥 Local Group' : '🌐 Online Circle'
              }
            </EmbroideredText>
            <FabricButton 
              color="#E8D5C1" 
              onClick={onBackToSetup}
            >
              ← Workshop Setup
            </FabricButton>
          </div>
        </div>
      </QuiltedSurface>
      
      {/* Players List */}
      <div css={craftersListStyle}>
        {players.map((player) => (
          <QuiltedSurface 
            key={player.id}
            padding="12px" 
            color={player.isActive ? "#F8F0E3" : "#F0E8D5"}
          >
            <div css={crafterCardStyle(player.isActive)}>
              <div css={crafterAvatarStyle(player.color)}>
                <span css={avatarInitialStyle}>
                  {player.name.charAt(0)}
                </span>
                <div css={yarnBallAccentStyle(player.color)} />
              </div>
              <div css={crafterInfoStyle}>
                <EmbroideredText size="0.9rem" color="#8B4513">
                  {player.name}
                </EmbroideredText>
                <div css={scoreDisplayStyle}>
                  <EmbroideredText size="0.8rem" color="#654321">
                    {player.score} stitches
                  </EmbroideredText>
                </div>
              </div>
              {player.isActive && (
                <div css={activeCrafterStyle}>🧶</div>
              )}
            </div>
          </QuiltedSurface>
        ))}
      </div>
      
      {/* Crafting Status */}
      <QuiltedSurface padding="15px" color="#E8F5E8">
        <div css={craftingStatusStyle}>
          <EmbroideredText size="1rem" color="#8B4513">
            📏 Quilting Progress
          </EmbroideredText>
          <div css={statusGridStyle}>
            <div css={statusItemStyle}>
              <EmbroideredText size="0.8rem" color="#654321">
                Round:
              </EmbroideredText>
              <div css={statusBadgeStyle}>
                <EmbroideredText size="0.8rem" color="#8B4513">
                  {turnNumber}
                </EmbroideredText>
              </div>
            </div>
            <div css={statusItemStyle}>
              <EmbroideredText size="0.8rem" color="#654321">
                Patches:
              </EmbroideredText>
              <div css={statusBadgeStyle}>
                <EmbroideredText size="0.8rem" color="#8B4513">
                  {tilesRemaining}
                </EmbroideredText>
              </div>
            </div>
          </div>
          {gameMessage && (
            <div css={statusMessageStyle}>
              <EmbroideredText size="0.7rem" color="#654321">
                💬 {gameMessage}
              </EmbroideredText>
            </div>
          )}
        </div>
      </QuiltedSurface>
      
      {/* Crafting Guide */}
      <QuiltedSurface padding="15px" color="#FFF8E1">
        <div css={craftingGuideStyle}>
          <EmbroideredText size="1rem" color="#8B4513">
            📖 {isSinglePlayer ? 'Practice Guide' : 'Quilting Rules'}
          </EmbroideredText>
          <div css={guideListStyle}>
            <div css={guideItemStyle}>
              <span css={guideIconStyle}>🧩</span>
              <EmbroideredText size="0.7rem" color="#654321">
                Sew patches onto the quilt
              </EmbroideredText>
            </div>
            <div css={guideItemStyle}>
              <span css={guideIconStyle}>🎯</span>
              <EmbroideredText size="0.7rem" color="#654321">
                Create rows summing to multiples of 5
              </EmbroideredText>
            </div>
            <div css={guideItemStyle}>
              <span css={guideIconStyle}>🔗</span>
              <EmbroideredText size="0.7rem" color="#654321">
                Connect new patches to existing ones
              </EmbroideredText>
            </div>
            <div css={guideItemStyle}>
              <span css={guideIconStyle}>⭐</span>
              <EmbroideredText size="0.7rem" color="#654321">
                Earn stitches for valid sequences
              </EmbroideredText>
            </div>
            {isSinglePlayer ? (
              <>
                <div css={guideItemStyle}>
                  <span css={guideIconStyle}>🏆</span>
                  <EmbroideredText size="0.7rem" color="#654321">
                    Practice to improve your technique
                  </EmbroideredText>
                </div>
                <div css={guideItemStyle}>
                  <span css={guideIconStyle}>🎨</span>
                  <EmbroideredText size="0.7rem" color="#654321">
                    Try to reach 500 stitches efficiently!
                  </EmbroideredText>
                </div>
              </>
            ) : (
              <div css={guideItemStyle}>
                <span css={guideIconStyle}>🏆</span>
                <EmbroideredText size="0.7rem" color="#654321">
                  First to 500 stitches wins the quilt!
                </EmbroideredText>
              </div>
            )}
          </div>
        </div>
      </QuiltedSurface>
    </div>
  )
}

// Yarn World Styling
const craftingCabinetStyle = css`
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 15px;
  gap: 15px;
  overflow-y: auto;
  
  /* Craft room cabinet with yarn textures */
  background: 
    linear-gradient(180deg, 
      rgba(245, 230, 211, 0.95) 0%,
      rgba(240, 226, 206, 0.95) 50%,
      rgba(235, 220, 201, 0.95) 100%);
  
  /* Cabinet wood grain */
  background-image: 
    repeating-linear-gradient(0deg, 
      rgba(139, 69, 19, 0.08) 0px, 
      rgba(139, 69, 19, 0.08) 2px, 
      transparent 2px, 
      transparent 25px);
  
  /* Cabinet styling */
  border-radius: 0 0 0 15px;
  position: relative;
`

const cabinetHeaderStyle = css`
  text-align: center;
`

const workshopInfoStyle = css`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`

const craftersListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const crafterCardStyle = (isActive: boolean) => css`
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  
  ${isActive && css`
    &::before {
      content: '';
      position: absolute;
      top: -6px;
      left: -6px;
      right: -6px;
      bottom: -6px;
      border: 2px dashed #DAA520;
      border-radius: 12px;
      background: rgba(218, 165, 32, 0.1);
    }
  `}
`

const crafterAvatarStyle = (color: string) => css`
  position: relative;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${color} 0%, rgba(255,255,255,0.3) 50%, ${color} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(139, 69, 19, 0.4);
  box-shadow: 
    0 4px 8px rgba(139, 69, 19, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.4);
  
  /* Fabric texture */
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 1px, transparent 1px);
  background-size: 4px 4px;
`

const avatarInitialStyle = css`
  position: relative;
  z-index: 2;
`

const yarnBallAccentStyle = (color: string) => css`
  position: absolute;
  top: -3px;
  right: -3px;
  width: 12px;
  height: 12px;
  background: radial-gradient(circle, ${color} 0%, rgba(0,0,0,0.2) 100%);
  border-radius: 50%;
  border: 1px solid rgba(139, 69, 19, 0.6);
  z-index: 3;
`

const crafterInfoStyle = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const scoreDisplayStyle = css`
  display: flex;
  align-items: center;
  gap: 4px;
  
  &::before {
    content: '⭐';
    font-size: 0.8rem;
  }
`

const activeCrafterStyle = css`
  font-size: 1.2rem;
  animation: gentleFloat 2s ease-in-out infinite;
  
  @keyframes gentleFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-2px); }
  }
`

const craftingStatusStyle = css`
  text-align: center;
`

const statusGridStyle = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 12px 0;
`

const statusItemStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`

const statusBadgeStyle = css`
  background: rgba(139, 69, 19, 0.1);
  border: 2px solid rgba(139, 69, 19, 0.3);
  border-radius: 8px;
  padding: 6px 12px;
  
  /* Badge stitching effect */
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.4),
    inset 0 -1px 2px rgba(0, 0, 0, 0.1);
`

const statusMessageStyle = css`
  margin-top: 12px;
  padding: 8px;
  background: rgba(255, 248, 220, 0.6);
  border-radius: 6px;
  border: 1px dashed rgba(139, 69, 19, 0.3);
  word-wrap: break-word;
  text-align: left;
`

const craftingGuideStyle = css`
  text-align: center;
`

const guideListStyle = css`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const guideItemStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(139, 69, 19, 0.2);
  
  /* Fabric texture */
  background-image: 
    repeating-linear-gradient(45deg, 
      rgba(139, 69, 19, 0.02) 0px, 
      rgba(139, 69, 19, 0.02) 1px, 
      transparent 1px, 
      transparent 8px);
`

const guideIconStyle = css`
  font-size: 0.9rem;
  flex-shrink: 0;
`
