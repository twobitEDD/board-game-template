/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState } from 'react'
import type { GameConfig } from '../GameDisplay'

interface NewAgeGameSetupProps {
  onStartGame: (config: GameConfig) => void
}

// Removed game mode variants - Fives has one core ruleset

export function NewAgeGameSetup({ onStartGame }: NewAgeGameSetupProps) {
  const [playerCount, setPlayerCount] = useState(1)
  const [playerNames, setPlayerNames] = useState(['Solo Weaver'])
  const [allowIslands, setAllowIslands] = useState(false)

  const updatePlayerCount = (count: number) => {
    setPlayerCount(count)
    const defaultNames = [
      'Solo Weaver',
      'Master Weaver', 
      'Apprentice Weaver',
      'Novice Weaver'
    ]
    const newNames = Array.from({ length: count }, (_, i) => 
      playerNames[i] || defaultNames[i] || `Weaver ${i + 1}`
    )
    setPlayerNames(newNames)
  }

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames]
    newNames[index] = name
    setPlayerNames(newNames)
  }

  const handleStartGame = () => {
    // Proper tile allocation for competitive gameplay - like original working game
    onStartGame({
      playerCount,
      playerNames,
      tilesPerPlayer: 50, // 50 tiles per player (enough for a full competitive game)
      winningScore: 99999, // No score limit - game ends when tiles are exhausted
      allowIslands
    })
  }

  return (
    <div css={containerStyle}>
      <div css={setupCardStyle}>
        {/* Header */}
        <div css={headerStyle}>
          <h1 css={titleStyle}>SUMMONING LOOMS</h1>
          <p css={subtitleStyle}>Weave the threads of destiny</p>
        </div>

        {/* Player Setup */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Weavers</h3>
          <div css={playerCountStyle}>
            {[1, 2, 3, 4].map(count => (
              <button
                key={count}
                css={[playerCountButtonStyle, playerCount === count && activeButtonStyle]}
                onClick={() => updatePlayerCount(count)}
              >
                {count} {count === 1 ? 'Weaver' : 'Weavers'}
              </button>
            ))}
          </div>
          
          <div css={playerNamesStyle}>
            {playerNames.map((name, index) => (
              <div key={index} css={playerInputContainerStyle}>
                <label css={playerLabelStyle}>Weaver {index + 1}</label>
                <input
                  css={playerInputStyle}
                  type="text"
                  value={name}
                  onChange={(e) => updatePlayerName(index, e.target.value)}
                  placeholder={`Weaver ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Game Rules Info */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Game Rules</h3>
          <div css={rulesInfoStyle}>
            <div css={ruleItemStyle}>
              <strong>50 threads per weaver</strong> - Each player gets a substantial collection of numbered tiles for strategic gameplay
            </div>
            <div css={ruleItemStyle}>
              <strong>Mathematical placement</strong> - Tiles must follow sum/difference rules
            </div>
            <div css={ruleItemStyle}>
              <strong>Spark & Fire</strong> - Some tiles can ignite and burn after placement
            </div>
          </div>
          
          {/* Island Option */}
          <div css={optionToggleStyle}>
            <label css={toggleLabelStyle}>
              <input
                type="checkbox"
                checked={allowIslands}
                onChange={(e) => setAllowIslands(e.target.checked)}
                css={checkboxStyle}
              />
              <span css={toggleTextStyle}>
                <strong>Allow Islands</strong> - Permit tiles to be placed without connecting to existing groups
              </span>
            </label>
          </div>
        </div>

        {/* Start Button */}
        <button css={startButtonStyle} onClick={handleStartGame}>
          <span css={startIconStyle}>✨</span>
          Begin Weaving
          <span css={startIconStyle}>✨</span>
        </button>

        {/* Footer Links */}
        <div css={footerStyle}>
          <a href="/new-age" css={linkStyle}>🔮 New Age Testing</a>
        </div>
      </div>
    </div>
  )
}

// Simplified static styles to avoid CSS parsing issues
const containerStyle = css`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  overflow-y: auto;
  width: 100%;
`

const setupCardStyle = css`
  background: rgba(139, 69, 19, 0.15);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  margin: 20px 0;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 20px;
    margin: 10px;
    max-width: calc(100vw - 20px);
    border-radius: 12px;
  }
`

const headerStyle = css`
  text-align: center;
  margin-bottom: 30px;
`

const titleStyle = css`
  font-family: 'Fredoka One', cursive;
  font-size: 2rem;
  color: #FFD700;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    letter-spacing: 1px;
  }
`

const subtitleStyle = css`
  color: #F5DEB3;
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
`

const sectionStyle = css`
  margin-bottom: 24px;
`

const sectionTitleStyle = css`
  color: #FFD700;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-align: center;
`

const playerCountStyle = css`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
`

const playerCountButtonStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 12px 20px;
  color: #F5DEB3;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
`

const activeButtonStyle = css`
  background: rgba(255, 215, 0, 0.3);
  border-color: #FFD700;
  color: #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
`

const playerNamesStyle = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const playerInputContainerStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
`

const playerLabelStyle = css`
  color: #F5DEB3;
  font-weight: 500;
  min-width: 80px;
  font-size: 0.9rem;
`

const playerInputStyle = css`
  flex: 1;
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.2);
  border-radius: 6px;
  padding: 10px 12px;
  color: #F5DEB3;
  font-size: 1rem;
`

const rulesInfoStyle = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  padding: 16px;
`

const ruleItemStyle = css`
  color: #F5DEB3;
  font-size: 0.9rem;
  line-height: 1.4;
  
  strong {
    color: #FFD700;
  }
`

const startButtonStyle = css`
  width: 100%;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.5));
  border: 2px solid #FFD700;
  border-radius: 12px;
  padding: 16px 32px;
  color: #FFD700;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
`

const startIconStyle = css`
  font-size: 1.1rem;
`

const footerStyle = css`
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 215, 0, 0.2);
`

const linkStyle = css`
  color: rgba(255, 215, 0, 0.8);
  text-decoration: none;
  font-size: 0.9rem;
`

const optionToggleStyle = css`
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 215, 0, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 6px;
`

const toggleLabelStyle = css`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
`

const checkboxStyle = css`
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #FFD700;
  cursor: pointer;
`

const toggleTextStyle = css`
  color: #F5DEB3;
  font-size: 0.9rem;
  line-height: 1.4;
  flex: 1;
  
  strong {
    color: #FFD700;
  }
` 