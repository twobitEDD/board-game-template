/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState } from 'react'

interface GameSetupProps {
  onStartGame: (gameConfig: GameConfig) => void
}

export interface GameConfig {
  playType: 'local' | 'online'
  playerCount: number
  playerNames: string[]
}

export function GameSetup({ onStartGame }: GameSetupProps) {
  const [playType, setPlayType] = useState<'local' | 'online' | null>(null)
  const [playerCount, setPlayerCount] = useState<number | null>(null)
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<'playType' | 'playerCount' | 'playerNames'>('playType')

  const handlePlayTypeSelect = (type: 'local' | 'online') => {
    setPlayType(type)
    setCurrentStep('playerCount')
  }

  const handlePlayerCountSelect = (count: number) => {
    console.log(`Selected ${count} players for ${playType} play`)
    setPlayerCount(count)
    const defaultNames = ['EDD', 'TOREN', 'RUBY', 'ASH']
    const names = Array.from({ length: count }, (_, i) => defaultNames[i] || `Player ${i + 1}`)
    setPlayerNames(names)
    
    console.log('Current playType:', playType, 'count:', count, 'condition:', playType === 'local' && count > 1)
    
    if (playType === 'local' && count > 1) {
      console.log('Going to player names step for local multiplayer')
      setCurrentStep('playerNames')
    } else {
      // For online play or single player, start immediately with default names
      console.log('Starting game immediately with config:', {
        playType: playType!,
        playerCount: count,
        playerNames: names
      })
      onStartGame({
        playType: playType!,
        playerCount: count,
        playerNames: names
      })
    }
  }

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames]
    newNames[index] = name // Allow empty names, don't force default
    setPlayerNames(newNames)
  }

  const handleStartGame = () => {
    if (playType && playerCount && playerNames.length === playerCount) {
      const defaultNames = ['ASTRO', 'ROSE', 'TOREN', 'RUBY']
      const finalNames = playerNames.map((name, index) => 
        name.trim() || defaultNames[index] || `Player ${index + 1}`
      )
      onStartGame({
        playType,
        playerCount,
        playerNames: finalNames
      })
    }
  }

  const handleBack = () => {
    if (currentStep === 'playerNames') {
      setCurrentStep('playerCount')
    } else if (currentStep === 'playerCount') {
      setCurrentStep('playType')
      setPlayType(null)
      setPlayerCount(null)
      setPlayerNames([])
    }
  }

  return (
    <div css={setupContainerStyle}>
      <div css={setupCardStyle}>
        <h1 css={titleStyle}>🎮 FIVES</h1>
        <p css={subtitleStyle}>Number-based strategy game</p>

        {currentStep === 'playType' && (
          <div css={stepContainerStyle}>
            <h2 css={stepTitleStyle}>Choose Play Type</h2>
            <div css={optionsGridStyle}>
              <button 
                css={optionButtonStyle}
                style={{
                  borderColor: '#4CAF50',
                  boxShadow: '0 10px 20px rgba(76, 175, 80, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4CAF50';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(76, 175, 80, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
                }}
                onClick={() => handlePlayTypeSelect('local')}
              >
                <div css={optionIconStyle}>👥</div>
                <div css={optionTextStyle}>
                  <div css={optionTitleStyle}>Local Play</div>
                  <div css={optionDescStyle}>Play with friends on the same device</div>
                </div>
              </button>
              
              <button 
                css={optionButtonStyle}
                style={{
                  borderColor: '#2196F3',
                  boxShadow: '0 10px 20px rgba(33, 150, 243, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2196F3';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(33, 150, 243, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
                }}
                onClick={() => handlePlayTypeSelect('online')}
              >
                <div css={optionIconStyle}>🌐</div>
                <div css={optionTextStyle}>
                  <div css={optionTitleStyle}>Online Play</div>
                  <div css={optionDescStyle}>Play with others online</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {currentStep === 'playerCount' && (
          <div css={stepContainerStyle}>
            <h2 css={stepTitleStyle}>Number of Players</h2>
            <p css={stepDescStyle}>
              {playType === 'local' 
                ? 'How many players will be playing? (1 player for solo practice)' 
                : 'Choose your game size (1 player for solo practice)'}
            </p>
            <div css={playerCountGridStyle}>
              {[1, 2, 3, 4].map(count => (
                <button
                  key={count}
                  css={playerCountButtonStyle}
                  onClick={() => handlePlayerCountSelect(count)}
                >
                  <div css={playerCountNumberStyle}>{count}</div>
                  <div css={playerCountLabelStyle}>
                    {count === 1 ? 'Player' : 'Players'}
                  </div>
                </button>
              ))}
            </div>
            <button 
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={handleBack}
            >
              ← Back
            </button>
          </div>
        )}

        {currentStep === 'playerNames' && (
          <div css={stepContainerStyle}>
            <h2 css={stepTitleStyle}>Player Names</h2>
            <p css={stepDescStyle}>Enter names for each player</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              {playerNames.map((name, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', minWidth: '80px', textAlign: 'left' }}>
                    Player {index + 1}:
                  </div>
                  <input
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                    type="text"
                    value={name}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    placeholder={['ASTRO', 'ROSE', 'TOREN', 'RUBY'][index] || `Player ${index + 1}`}
                    maxLength={20}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                onClick={handleBack}
              >
                ← Back
              </button>
              <button 
                style={{
                  background: '#4CAF50',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 32px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                onClick={handleStartGame}
              >
                Start Game 🚀
              </button>
            </div>
          </div>
        )}

        <div css={gameInfoStyle}>
          <div css={rulesSummaryStyle}>
            <h3>Quick Rules:</h3>
            <ul>
              <li>Place number tiles to create sequences</li>
              <li>Sequences must sum to multiples of 5</li>
              <li>Score points for valid sequences</li>
              <li>First to 500 points wins!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Styles
const setupContainerStyle = css`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Arial', sans-serif;
  padding: 20px;
`

const setupCardStyle = css`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  padding: 40px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  text-align: center;
`

const titleStyle = css`
  margin: 0 0 10px 0;
  color: #ff6b9d;
  font-size: 48px;
  font-weight: 900;
  text-shadow: 0 4px 8px rgba(0,0,0,0.5);
`

const subtitleStyle = css`
  margin: 0 0 40px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  font-weight: 500;
`

const stepContainerStyle = css`
  margin-bottom: 30px;
`

const stepTitleStyle = css`
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
`

const stepDescStyle = css`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0 0 30px 0;
`

const optionsGridStyle = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
`

const optionButtonStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  
  :hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`



const optionIconStyle = css`
  font-size: 48px;
`

const optionTextStyle = css`
  text-align: center;
`

const optionTitleStyle = css`
  color: white;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 5px;
`

const optionDescStyle = css`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
`

const playerCountGridStyle = css`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 30px;
  
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`

const playerCountButtonStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  
  :hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: #FF9800;
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(255, 152, 0, 0.3);
  }
`

const playerCountNumberStyle = css`
  color: white;
  font-size: 36px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
`

const playerCountLabelStyle = css`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 600;
`



const gameInfoStyle = css`
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`

const rulesSummaryStyle = css`
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
  
  h3 {
    margin: 0 0 15px 0;
    color: white;
    font-size: 16px;
  }
  
  ul {
    margin: 0;
    padding-left: 20px;
    font-size: 12px;
    line-height: 1.6;
    
    li {
      margin-bottom: 5px;
    }
  }
`

 