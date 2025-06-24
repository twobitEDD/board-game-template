/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { useState } from 'react'

interface GameSetupProps {
  onStartGame: (gameConfig: GameConfig) => void
}

export interface GameConfig {
  playType: 'local' | 'online'
  playerCount: number
  playerNames: string[]
  winningScore: 2500 | 5000 | 10000
  tilesPerPlayer: number // 42-69
  explosionsEnabled: boolean
  payoutMode: 'winner-take-all' | 'split-by-score'
  soloChallenge?: 'classic' | 'speedrun' | 'perfectionist' | 'minimalist'
  allowIslands: boolean
}

// Gentle quilting animations
const gentleFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(1deg); }
`

const yarnShimmer = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
`

const stitchingGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(139, 69, 19, 0.3); }
  50% { box-shadow: 0 0 20px rgba(139, 69, 19, 0.6); }
`

export function GameSetup({ onStartGame }: GameSetupProps) {
  const [playType, setPlayType] = useState<'local' | 'online' | null>(null)
  const [playerCount, setPlayerCount] = useState<number | null>(null)
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [winningScore, setWinningScore] = useState<2500 | 5000 | 10000>(2500)
  const [tilesPerPlayer, setTilesPerPlayer] = useState<number>(50)
  const [explosionsEnabled, setExplosionsEnabled] = useState<boolean>(false)
  const [payoutMode, setPayoutMode] = useState<'winner-take-all' | 'split-by-score'>('winner-take-all')
  const [soloChallenge, setSoloChallenge] = useState<'classic' | 'speedrun' | 'perfectionist' | 'minimalist'>('classic')
  const [allowIslands, setAllowIslands] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<'playType' | 'playerCount' | 'playerNames' | 'gameOptions'>('playType')

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
      // For online play or single player, go to game options
      console.log('Going to game options step')
      setCurrentStep('gameOptions')
    }
  }

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames]
    newNames[index] = name // Allow empty names, don't force default
    setPlayerNames(newNames)
  }

  const handlePlayerNamesComplete = () => {
    setCurrentStep('gameOptions')
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
        playerNames: finalNames,
        winningScore,
        tilesPerPlayer,
        explosionsEnabled,
        payoutMode,
        soloChallenge: playerCount === 1 ? soloChallenge : undefined,
        allowIslands
      })
    }
  }

  const handleBack = () => {
    if (currentStep === 'gameOptions') {
      if (playType === 'local' && playerCount && playerCount > 1) {
        setCurrentStep('playerNames')
      } else {
        setCurrentStep('playerCount')
      }
    } else if (currentStep === 'playerNames') {
      setCurrentStep('playerCount')
    } else if (currentStep === 'playerCount') {
      setCurrentStep('playType')
      setPlayType(null)
      setPlayerCount(null)
      setPlayerNames([])
    }
  }

  const getChallengeDescription = (challenge: 'classic' | 'speedrun' | 'perfectionist' | 'minimalist') => {
    switch (challenge) {
      case 'classic': return 'Standard Practice'
      case 'speedrun': return 'Time Trial'
      case 'perfectionist': return 'No Mistakes'
      case 'minimalist': return 'Fewest Moves'
      default: return 'Standard Practice'
    }
  }

  return (
    <div css={quiltingWorkshopStyle}>
      <div css={workshopTableStyle}>
        <div css={workshopSignStyle}>
          <h1 css={embroideredTitleStyle}>🔮 SUMMONING LOOMS 🔮</h1>
          <p css={workshopMottoStyle}>Weave the Threads of Fate</p>
        </div>

        {currentStep === 'playType' && (
          <div css={stepContainerStyle}>
            <h2 css={stepTitleStyle}>🔮 Choose Your Summoning Style</h2>
            <div css={quiltingOptionsStyle}>
              <button 
                css={quiltingOptionStyle}
                onClick={() => handlePlayTypeSelect('local')}
              >
                <div css={quiltingIconStyle}>🏡</div>
                <div css={quiltingTextStyle}>
                  <div css={optionTitleStyle}>Cozy Home Circle</div>
                  <div css={optionDescStyle}>Gather 'round the summoning table with friends</div>
                </div>
              </button>
              
              <button 
                css={quiltingOptionStyle}
                onClick={() => handlePlayTypeSelect('online')}
              >
                <div css={quiltingIconStyle}>🌐</div>
                <div css={quiltingTextStyle}>
                  <div css={optionTitleStyle}>Online Coven</div>
                  <div css={optionDescStyle}>Join summoners from around the world</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {currentStep === 'playerCount' && (
          <div css={stepContainerStyle}>
            <h2 css={stepTitleStyle}>👥 How Many Summoners?</h2>
            <p css={stepDescStyle}>
              {playType === 'local' 
                ? 'How many will join your summoning circle? (Choose 1 for solo practice)' 
                : 'Select your coven size (1 for peaceful solo summoning)'}
            </p>
            <div css={quilterCountGridStyle}>
              {[1, 2, 3, 4].map(count => (
                <button
                  key={count}
                  css={quilterCountButtonStyle}
                  onClick={() => handlePlayerCountSelect(count)}
                >
                  <div css={quilterCountNumberStyle}>{count}</div>
                  <div css={quilterCountLabelStyle}>
                    {count === 1 ? 'Solo Summoner' : 'Summoners'}
                  </div>
                </button>
              ))}
            </div>
            <button css={backButtonStyle} onClick={handleBack}>
              🔮 ← Back to Loom
            </button>
          </div>
        )}

        {currentStep === 'playerNames' && (
          <div css={stepContainerStyle}>
            <h2 css={stepTitleStyle}>📝 Quilter Name Tags</h2>
            <p css={stepDescStyle}>Embroider each quilter's name on their workspace</p>
            <div css={nameTagsContainerStyle}>
              {playerNames.map((name, index) => (
                <div key={index} css={nameTagStyle}>
                  <div css={nameTagLabelStyle}>
                    Quilter {index + 1}:
                  </div>
                  <input
                    css={nameTagInputStyle}
                    type="text"
                    value={name}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    placeholder={['ASTRO', 'ROSE', 'TOREN', 'RUBY'][index] || `Quilter ${index + 1}`}
                    maxLength={20}
                  />
                </div>
              ))}
            </div>
            <div css={buttonGroupStyle}>
              <button css={backButtonStyle} onClick={handleBack}>
                🧶 ← Back
              </button>
              <button css={nextButtonStyle} onClick={handlePlayerNamesComplete}>
                Next: Workshop Setup 🎨 →
              </button>
            </div>
          </div>
        )}

        {currentStep === 'gameOptions' && (
          <div css={stepContainerStyle}>
            <h2 css={stepTitleStyle}>⚙️ Workshop Configuration</h2>
            <p css={stepDescStyle}>Set up your quilting challenge parameters</p>
            
            <div css={workshopOptionsGridStyle}>
              {/* Winning Score */}
              <div css={configSectionStyle}>
                <h3 css={configTitleStyle}>🎯 Target Stitches</h3>
                <div css={configButtonGroupStyle}>
                  {[2500, 5000, 10000].map(score => (
                    <button
                      key={score}
                      css={[configButtonStyle, winningScore === score && selectedConfigStyle]}
                      onClick={() => setWinningScore(score as 2500 | 5000 | 10000)}
                    >
                      {score.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiles Per Player */}
              <div css={configSectionStyle}>
                <h3 css={configTitleStyle}>🧩 Fabric Patches</h3>
                <div css={sliderContainerStyle}>
                  <input
                    type="range"
                    min="42"
                    max="69"
                    value={tilesPerPlayer}
                    onChange={(e) => setTilesPerPlayer(parseInt(e.target.value))}
                    css={yarnSliderStyle}
                  />
                  <div css={sliderValueStyle}>{tilesPerPlayer} patches</div>
                </div>
              </div>

              {/* Game Mode */}
              <div css={configSectionStyle}>
                <h3 css={configTitleStyle}>✂️ Quilting Style</h3>
                <div css={configButtonGroupStyle}>
                  <button
                    css={[configButtonStyle, !explosionsEnabled && selectedConfigStyle]}
                    onClick={() => setExplosionsEnabled(false)}
                  >
                    🕊️ Peaceful
                  </button>
                  <button
                    css={[configButtonStyle, explosionsEnabled && selectedConfigStyle]}
                    onClick={() => setExplosionsEnabled(true)}
                  >
                    💥 Challenging
                  </button>
                </div>
              </div>

              {/* Allow Islands */}
              <div css={configSectionStyle}>
                <h3 css={configTitleStyle}>🏝️ Placement Rules</h3>
                <div css={configButtonGroupStyle}>
                  <button
                    css={[configButtonStyle, !allowIslands && selectedConfigStyle]}
                    onClick={() => setAllowIslands(false)}
                  >
                    🔗 Connected
                  </button>
                  <button
                    css={[configButtonStyle, allowIslands && selectedConfigStyle]}
                    onClick={() => setAllowIslands(true)}
                  >
                    🏝️ Allow Islands
                  </button>
                </div>
                <div css={configDescStyle}>
                  {allowIslands 
                    ? "Tiles can be placed anywhere on the board, creating separate groups"
                    : "All tiles must connect to existing tiles on the board"
                  }
                </div>
              </div>

              {/* Payout Mode */}
              {playerCount === 1 ? (
                <div css={configSectionStyle}>
                  <h3 css={configTitleStyle}>🎯 Solo Challenge Mode</h3>
                  <div css={configButtonGroupStyle}>
                    <button
                      css={[configButtonStyle, soloChallenge === 'classic' && selectedConfigStyle]}
                      onClick={() => setSoloChallenge('classic')}
                    >
                      🧩 Classic
                    </button>
                    <button
                      css={[configButtonStyle, soloChallenge === 'speedrun' && selectedConfigStyle]}
                      onClick={() => setSoloChallenge('speedrun')}
                    >
                      ⚡ Speedrun
                    </button>
                  </div>
                  <div css={configButtonGroupStyle}>
                    <button
                      css={[configButtonStyle, soloChallenge === 'perfectionist' && selectedConfigStyle]}
                      onClick={() => setSoloChallenge('perfectionist')}
                    >
                      💎 Perfectionist
                    </button>
                    <button
                      css={[configButtonStyle, soloChallenge === 'minimalist' && selectedConfigStyle]}
                      onClick={() => setSoloChallenge('minimalist')}
                    >
                      🎋 Minimalist
                    </button>
                  </div>
                </div>
              ) : (
                <div css={configSectionStyle}>
                  <h3 css={configTitleStyle}>🏆 Prize Distribution</h3>
                  <div css={configButtonGroupStyle}>
                    <button
                      css={[configButtonStyle, payoutMode === 'winner-take-all' && selectedConfigStyle]}
                      onClick={() => setPayoutMode('winner-take-all')}
                    >
                      🏅 Winner Takes All
                    </button>
                    <button
                      css={[configButtonStyle, payoutMode === 'split-by-score' && selectedConfigStyle]}
                      onClick={() => setPayoutMode('split-by-score')}
                    >
                      📊 Share by Skill
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div css={workshopSummaryStyle}>
              <h4>🧵 Workshop Summary:</h4>
              <p>Target: {winningScore.toLocaleString()} stitches • {tilesPerPlayer} patches per quilter</p>
              <p>Style: {explosionsEnabled ? 'Challenging Mode' : 'Peaceful Crafting'} • {playerCount === 1 ? `Challenge: ${getChallengeDescription(soloChallenge)}` : `Prizes: ${payoutMode === 'winner-take-all' ? 'Winner Takes All' : 'Shared by Skill'}`}</p>
            </div>

            <div css={buttonGroupStyle}>
              <button css={backButtonStyle} onClick={handleBack}>
                🧶 ← Back
              </button>
              <button css={startQuiltingButtonStyle} onClick={handleStartGame}>
                Start Quilting! 🎨✨
              </button>
            </div>
          </div>
        )}

        <div css={workshopGuideStyle}>
          <div css={quiltingRulesStyle}>
            <h3>🧵 Quilting Guidelines:</h3>
            {playerCount === 1 ? (
              <ul>
                <li>🧩 <strong>Classic:</strong> Standard solo quilting at your own pace</li>
                <li>⚡ <strong>Speedrun:</strong> Race against time to reach your target</li>
                <li>💎 <strong>Perfectionist:</strong> No mistakes allowed - every move counts</li>
                <li>🎋 <strong>Minimalist:</strong> Use the fewest moves possible to win</li>
              </ul>
            ) : (
              <ul>
                <li>Bring your personal fabric collection to the circle</li>
                <li>Work with 5 patches at a time from your collection</li>
                <li>Sew patches in rows or columns that sum to multiples of 5</li>
                <li>First to reach target stitches or complete their collection wins!</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Styles  
const quiltingWorkshopStyle = css`
  width: 100vw;
  height: 100vh;
  background: 
    /* Warm cozy night sky matching reference */
    linear-gradient(180deg, 
      #2d1810 0%,     /* Deep warm brown night sky */
      #3d2415 30%,    /* Mid warm brown */
      #4a2c18 60%,    /* Lighter warm brown */
      #3d2415 100%    /* Back to deep warm brown */
    );
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Quicksand', sans-serif;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    padding: 15px;
    align-items: flex-start;
    padding-top: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    padding-top: 15px;
  }
`

const workshopTableStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(139, 69, 19, 0.95) 0%, 
      rgba(160, 82, 45, 0.95) 30%, 
      rgba(218, 165, 32, 0.95) 70%, 
      rgba(139, 69, 19, 0.95) 100%);
  border-radius: 16px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  text-align: center;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
  
  /* Warm cozy atmosphere like reference */
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(139, 69, 19, 0.1) 1px, transparent 1px);
  background-size: 30px 30px, 20px 20px;
  
  @media (max-width: 768px) {
    padding: 30px;
    border-radius: 12px;
    max-height: calc(100vh - 30px);
  }
  
  @media (max-width: 480px) {
    padding: 20px;
    border-radius: 10px;
    max-height: calc(100vh - 20px);
  }
`

const workshopSignStyle = css`
  margin-bottom: 40px;
  position: relative;
  z-index: 2;
`

const embroideredTitleStyle = css`
  margin: 0 0 10px 0;
  color: #FFD700;
  font-size: 48px;
  font-weight: 900;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  font-family: 'Fredoka One', cursive;
  animation: ${gentleFloat} 4s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 36px;
  }
  
  @media (max-width: 480px) {
    font-size: 28px;
  }
`

const workshopMottoStyle = css`
  margin: 0 0 40px 0;
  color: #F5DEB3;
  font-size: 16px;
  font-weight: 600;
  font-style: italic;
  font-family: 'Quicksand', sans-serif;
  
  @media (max-width: 768px) {
    margin: 0 0 30px 0;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    margin: 0 0 20px 0;
    font-size: 12px;
  }
`

const stepContainerStyle = css`
  margin-bottom: 30px;
  position: relative;
  z-index: 2;
`

const stepTitleStyle = css`
  color: #FFD700;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 10px 0;
  font-family: 'Fredoka One', cursive;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`

const stepDescStyle = css`
  color: #F5DEB3;
  font-size: 14px;
  margin: 0 0 30px 0;
  font-family: 'Quicksand', sans-serif;
`

const quiltingOptionsStyle = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`

const quiltingOptionStyle = css`
  background: 
    linear-gradient(145deg, 
      rgba(139, 69, 19, 0.25) 0%, 
      rgba(160, 82, 45, 0.2) 100%);
  border: 3px solid rgba(218, 165, 32, 0.6);
  border-radius: 15px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  min-height: 44px;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 6px 16px rgba(139, 69, 19, 0.3),
    inset 0 1px 3px rgba(255, 215, 0, 0.3);
  
  /* Mystical texture overlay */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.05) 1px, transparent 1px),
      radial-gradient(circle at 70% 70%, rgba(139, 69, 19, 0.03) 1px, transparent 1px);
    background-size: 20px 20px, 15px 15px;
    pointer-events: none;
    opacity: 0.8;
  }
  
  @media (max-width: 768px) {
    padding: 25px 15px;
    border-radius: 12px;
    gap: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 20px 12px;
    border-radius: 10px;
    gap: 10px;
  }
  
  &:hover {
    background: 
      linear-gradient(145deg, 
        rgba(255, 215, 0, 0.3) 0%, 
        rgba(218, 165, 32, 0.25) 100%);
    border-color: #FFD700;
    transform: translateY(-5px);
    box-shadow: 
      0 12px 24px rgba(255, 215, 0, 0.4),
      0 0 20px rgba(218, 165, 32, 0.6),
      inset 0 1px 4px rgba(255, 215, 0, 0.5);
    animation: ${stitchingGlow} 2s ease-in-out infinite;
  }
  
  @media (hover: none) {
    &:hover {
      transform: none;
      background: 
        linear-gradient(145deg, 
          rgba(255, 215, 0, 0.2) 0%, 
          rgba(218, 165, 32, 0.15) 100%);
    }
  }
`

const quiltingIconStyle = css`
  font-size: 48px;
  position: relative;
  z-index: 2;
  animation: ${yarnShimmer} 3s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 40px;
  }
  
  @media (max-width: 480px) {
    font-size: 32px;
  }
`

const quiltingTextStyle = css`
  text-align: center;
  position: relative;
  z-index: 2;
`

const optionTitleStyle = css`
  color: #FFD700;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 5px;
  text-shadow: 
    0 0 6px rgba(255, 215, 0, 0.8),
    0 1px 3px rgba(139, 69, 19, 0.6);
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
  
  @media (max-width: 480px) {
    font-size: 14px;
  }
`

const optionDescStyle = css`
  color: #F5E6A3;
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(139, 69, 19, 0.6);
  
  @media (max-width: 480px) {
    font-size: 11px;
  }
`

const quilterCountGridStyle = css`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 30px;
  
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`

const quilterCountButtonStyle = css`
  background: 
    linear-gradient(145deg, 
      rgba(139, 69, 19, 0.3) 0%, 
      rgba(160, 82, 45, 0.25) 100%);
  border: 3px solid rgba(218, 165, 32, 0.6);
  border-radius: 15px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 
    0 4px 12px rgba(139, 69, 19, 0.4),
    inset 0 1px 3px rgba(255, 215, 0, 0.3);
  
  &:hover {
    background: 
      linear-gradient(145deg, 
        rgba(255, 215, 0, 0.3) 0%, 
        rgba(218, 165, 32, 0.25) 100%);
    border-color: #FFD700;
    transform: translateY(-3px);
    box-shadow: 
      0 8px 20px rgba(255, 215, 0, 0.4),
      0 0 15px rgba(218, 165, 32, 0.6),
      inset 0 1px 4px rgba(255, 215, 0, 0.5);
  }
`

const quilterCountNumberStyle = css`
  color: #FFD700;
  font-size: 36px;
  font-weight: 900;
  text-shadow: 
    0 0 8px rgba(255, 215, 0, 0.8),
    0 2px 4px rgba(139, 69, 19, 0.5);
`

const quilterCountLabelStyle = css`
  color: #F5E6A3;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(139, 69, 19, 0.6);
`

const nameTagsContainerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
`

const nameTagStyle = css`
  display: flex;
  align-items: center;
  gap: 15px;
  background: 
    linear-gradient(145deg, #f8f3eb 0%, #ede4d3 100%);
  border: 2px solid #8b4513;
  border-radius: 12px;
  padding: 15px;
`

const nameTagLabelStyle = css`
  color: #8b4513;
  font-size: 14px;
  font-weight: 600;
  min-width: 80px;
  text-align: left;
`

const nameTagInputStyle = css`
  flex: 1;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(139, 69, 19, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #8b4513;
  font-size: 14px;
  font-weight: 500;
  
  &:focus {
    outline: none;
    border-color: #daa520;
    box-shadow: 0 0 8px rgba(218, 165, 32, 0.4);
  }
`

const buttonGroupStyle = css`
  display: flex;
  gap: 15px;
  justify-content: center;
`

const backButtonStyle = css`
  background: 
    linear-gradient(145deg, #ede4d3 0%, #d4c4a8 100%);
  border: 2px solid #8b4513;
  border-radius: 10px;
  padding: 12px 24px;
  color: #8b4513;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(145deg, #f0e7d6 0%, #d7c7ab 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(139, 69, 19, 0.2);
  }
`

const nextButtonStyle = css`
  background: 
    linear-gradient(135deg, #daa520 0%, #b8860b 100%);
  border: none;
  border-radius: 10px;
  padding: 12px 32px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(218, 165, 32, 0.4);
  
  &:hover {
    background: linear-gradient(135deg, #b8860b 0%, #daa520 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(218, 165, 32, 0.5);
  }
`

const workshopOptionsGridStyle = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  @media (max-width: 480px) {
    gap: 15px;
    margin-bottom: 15px;
  }
`

const configSectionStyle = css`
  background: 
    linear-gradient(145deg, #f8f3eb 0%, #ede4d3 100%);
  border-radius: 15px;
  padding: 20px;
  border: 2px solid #8b4513;
  position: relative;
  
  /* Quilting stitches around border */
  &::after {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    border: 1px dashed #8b4513;
    border-radius: 8px;
    pointer-events: none;
    opacity: 0.3;
  }
  
  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 10px;
  }
`

const configTitleStyle = css`
  color: #8b4513;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 15px 0;
  text-shadow: 0 2px 4px rgba(139, 69, 19, 0.3);
  position: relative;
  z-index: 2;
`

const configButtonGroupStyle = css`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const configButtonStyle = css`
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(139, 69, 19, 0.3);
  border-radius: 8px;
  padding: 10px 16px;
  color: #8b4513;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: fit-content;
  min-height: 44px;
  
  @media (max-width: 768px) {
    padding: 12px 18px;
    font-size: 14px;
    border-radius: 6px;
  }
  
  @media (max-width: 480px) {
    padding: 14px 20px;
    font-size: 13px;
    border-radius: 6px;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(139, 69, 19, 0.2);
  }
  
  @media (hover: none) {
    &:hover {
      transform: none;
      background: rgba(255, 255, 255, 0.9);
    }
  }
`

const selectedConfigStyle = css`
  background: rgba(218, 165, 32, 0.3) !important;
  border-color: #daa520 !important;
  color: #8b4513 !important;
  box-shadow: 0 0 10px rgba(218, 165, 32, 0.5);
  font-weight: 700;
`

const configDescStyle = css`
  color: rgba(139, 69, 19, 0.8);
  font-size: 12px;
  margin-top: 10px;
  font-style: italic;
  text-align: center;
  line-height: 1.4;
`

const sliderContainerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 2;
`

const yarnSliderStyle = css`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(139, 69, 19, 0.2);
  outline: none;
  -webkit-appearance: none;
  
  @media (max-width: 480px) {
    height: 8px;
  }
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #daa520;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(139, 69, 19, 0.4);
    
    @media (max-width: 480px) {
      width: 24px;
      height: 24px;
    }
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #daa520;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(139, 69, 19, 0.4);
    
    @media (max-width: 480px) {
      width: 24px;
      height: 24px;
    }
  }
`

const sliderValueStyle = css`
  color: #daa520;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 2px 4px rgba(139, 69, 19, 0.3);
`

const workshopSummaryStyle = css`
  background: 
    linear-gradient(145deg, rgba(218, 165, 32, 0.2) 0%, rgba(218, 165, 32, 0.1) 100%);
  border: 2px solid rgba(218, 165, 32, 0.5);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  text-align: center;
  position: relative;
  
  /* Decorative stitching */
  &::after {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    border: 1px dashed rgba(218, 165, 32, 0.6);
    border-radius: 6px;
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    padding: 15px;
    margin-bottom: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 15px;
    border-radius: 8px;
  }
  
  h4 {
    color: #8b4513;
    margin: 0 0 10px 0;
    font-size: 16px;
    font-weight: 700;
    
    @media (max-width: 480px) {
      font-size: 14px;
    }
  }
  
  p {
    color: rgba(139, 69, 19, 0.9);
    margin: 5px 0;
    font-size: 14px;
    
    @media (max-width: 480px) {
      font-size: 12px;
    }
  }
`

const startQuiltingButtonStyle = css`
  background: 
    linear-gradient(135deg, #daa520 0%, #ff8c00 100%);
  border: none;
  border-radius: 12px;
  padding: 15px 40px;
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 6px 20px rgba(218, 165, 32, 0.4),
    0 0 15px rgba(255, 140, 0, 0.3);
  animation: ${stitchingGlow} 3s ease-in-out infinite;
  
  &:hover {
    background: linear-gradient(135deg, #ff8c00 0%, #daa520 100%);
    transform: translateY(-3px);
    box-shadow: 
      0 10px 30px rgba(218, 165, 32, 0.5),
      0 0 20px rgba(255, 140, 0, 0.4);
  }
`

const workshopGuideStyle = css`
  margin-top: 40px;
  padding-top: 30px;
  border-top: 2px dashed rgba(139, 69, 19, 0.3);
  position: relative;
  z-index: 2;
`

const quiltingRulesStyle = css`
  color: rgba(139, 69, 19, 0.8);
  text-align: left;
  
  h3 {
    margin: 0 0 15px 0;
    color: #8b4513;
    font-size: 16px;
    font-weight: 700;
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

 