/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState } from 'react'
import type { GameConfig } from '../GameDisplay'
import { DynamicConnectButton } from './DynamicConnectButton'
import { BlockchainGamesPanel } from './BlockchainGamesPanel'
import { useBlockchainGame } from '../hooks/useBlockchainGame'

interface NewAgeGameSetupProps {
  onStartGame: (config: GameConfig, blockchainGameId?: number) => void
}

// Add wrapper style for proper horizontal scrolling
const wrapperStyle = css`
  width: 100vw;
  height: 100vh;
  overflow-x: auto;
  overflow-y: auto;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%);
`

// Removed game mode variants - Fives has one core ruleset

export function NewAgeGameSetup({ onStartGame }: NewAgeGameSetupProps) {
  const [playerCount, setPlayerCount] = useState(1)
  const [playerNames, setPlayerNames] = useState(['Solo Weaver'])
  const [allowIslands, setAllowIslands] = useState(false)
  const [gameMode, setGameMode] = useState<'local' | 'blockchain'>('local')
  const [isCreatingBlockchainGame, setIsCreatingBlockchainGame] = useState(false)
  
  const { isConnected, createGame } = useBlockchainGame()

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

  const handleStartGame = async () => {
    const gameConfig = {
      playerCount,
      playerNames,
      tilesPerPlayer: 50, // 50 tiles per player (enough for a full competitive game)
      winningScore: 99999, // No score limit - game ends when tiles are exhausted
      allowIslands
    }

    if (gameMode === 'blockchain' && isConnected) {
      try {
        setIsCreatingBlockchainGame(true)
        console.log('🚀 Creating blockchain game with config:', gameConfig)
        
        // Create blockchain game with the host as the first player
        // Use 2000 as winning score - appropriate for Quinto-style scoring (sequence sum × 10)
        const result = await createGame(playerCount, false, 5000, playerNames[0])
        console.log('✅ Blockchain game created:', result)
        
        // Validate we have a proper game ID
        if (!result || !result.gameId || result.gameId < 1) {
          throw new Error(`Invalid game creation result: ${JSON.stringify(result)}`)
        }

        console.log('🔄 Waiting a moment for blockchain state to propagate...')
        
        // Small delay to ensure the game is fully available
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log('🎮 About to navigate to created game:', {
          gameConfig,
          blockchainGameId: result.gameId,
          gameUrl: `/game/${result.gameId}/play`
        })
        
        // Navigate directly to the created game (force full page navigation)
        window.location.href = `/game/${result.gameId}/play`
        
        console.log('🚀 Navigation initiated - page will reload and show game board')
      } catch (error) {
        console.error('❌ Failed to create blockchain game:', error)
        alert(`Failed to create blockchain game: ${error.message}`)
      } finally {
        setIsCreatingBlockchainGame(false)
      }
    } else {
      // Start local game only
      onStartGame(gameConfig)
    }
  }

  const handleJoinGame = (gameId: number) => {
    console.log('🎮 Joining blockchain game from setup:', gameId)
    
    // Navigate directly to the game page (force full page navigation)
    window.location.href = `/game/${gameId}/play`
  }

  return (
    <div css={wrapperStyle}>
      <div css={containerStyle}>
        <div css={setupCardStyle}>
          {/* Header */}
          <div css={headerStyle}>
            <div css={headerTopStyle}>
              <DynamicConnectButton />
            </div>
            <h1 css={titleStyle}>SUMMON FIVES</h1>
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

          {/* Game Mode Selection */}
          <div css={sectionStyle}>
            <h3 css={sectionTitleStyle}>Game Mode</h3>
            <div css={gameModeStyle}>
              <button
                css={[gameModeButtonStyle, gameMode === 'local' && activeButtonStyle]}
                onClick={() => setGameMode('local')}
              >
                🏠 Local Game
              </button>
              <button
                css={[
                  gameModeButtonStyle, 
                  gameMode === 'blockchain' && activeButtonStyle,
                  !isConnected && disabledButtonStyle
                ]}
                onClick={() => isConnected && setGameMode('blockchain')}
                disabled={!isConnected}
              >
                🔗 Blockchain Game
              </button>
            </div>
            
            {gameMode === 'blockchain' && !isConnected && (
              <div css={warningStyle}>
                ⚠️ Connect your wallet to create blockchain games
              </div>
            )}
            
            {gameMode === 'blockchain' && isConnected && (
              <div css={infoStyle}>
                ✅ Blockchain game will be created with {playerNames[0]} as host
              </div>
            )}
          </div>

          {/* Start Button */}
          <button 
            css={startButtonStyle} 
            onClick={handleStartGame}
            disabled={isCreatingBlockchainGame}
          >
            <span css={startIconStyle}>✨</span>
            {isCreatingBlockchainGame ? 'Creating Blockchain Game...' : 
             gameMode === 'blockchain' ? 'Create Blockchain Game' : 'Begin Weaving'}
            <span css={startIconStyle}>✨</span>
          </button>

          {/* Footer Links */}
          <div css={footerStyle}>
            <a href="/gallery" css={linkStyle}>🎮 Game Gallery</a>
            <span css={separatorLinkStyle}>•</span>
            <a href="/new-age" css={linkStyle}>🔮 New Age Testing</a>
          </div>
        </div>
        
        {/* Blockchain Games Panel */}
        <div css={blockchainPanelContainerStyle}>
          <BlockchainGamesPanel onJoinGame={handleJoinGame} />
        </div>
      </div>
    </div>
  )
}

// Simplified static styles to avoid CSS parsing issues
const containerStyle = css`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  min-height: 100vh;
  min-width: max-content;
  padding: 20px;
  gap: 20px;
  width: max-content;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: center;
    width: 100%;
    min-width: auto;
  }
`

const setupCardStyle = css`
  background: rgba(139, 69, 19, 0.15);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  padding: 30px;
  max-width: 600px;
  min-width: 500px;
  width: 100%;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  margin: 20px 0;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    padding: 20px;
    margin: 10px;
    max-width: calc(100vw - 20px);
    min-width: auto;
    border-radius: 12px;
  }
`

const headerStyle = css`
  text-align: center;
  margin-bottom: 30px;
  position: relative;
`

const headerTopStyle = css`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
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
  
  &:hover {
    color: #FFD700;
  }
`

const separatorLinkStyle = css`
  color: rgba(255, 215, 0, 0.4);
  margin: 0 12px;
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

const blockchainPanelContainerStyle = css`
  max-width: 600px;
  min-width: 500px;
  width: 100%;
  flex-shrink: 0;
  
  @media (max-width: 1200px) {
    margin-left: 0;
    margin-top: 20px;
    min-width: auto;
  }
`

const gameModeStyle = css`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
`

const gameModeButtonStyle = css`
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

const disabledButtonStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.2);
  color: rgba(255, 215, 0, 0.5);
  cursor: not-allowed;
`

const warningStyle = css`
  color: #FFD700;
  font-size: 0.9rem;
  margin-top: 12px;
  text-align: center;
`

const infoStyle = css`
  color: #FFD700;
  font-size: 0.9rem;
  margin-top: 12px;
  text-align: center;
` 