/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { useState, useEffect } from 'react'
import { NumberTile } from './NumberTile'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'
import { Navigation } from './Navigation'

interface GameLandingProps {
  onPlayGame: () => void
  onViewRules: () => void
  onViewGallery: () => void
  onPlayFives?: () => void
}

interface FloatingTile {
  id: NumberTileId
  x: number
  y: number
  delay: number
}

export function GameLanding({ onPlayGame, onViewRules, onViewGallery, onPlayFives }: GameLandingProps) {
  const [currentDemo, setCurrentDemo] = useState(0)
  const [animatedTiles, setAnimatedTiles] = useState<FloatingTile[]>([])

  // Demo sequences that show game mechanics
  const demoSequences = [
    {
      title: "Form sequences that sum to 5",
      tiles: [{ id: NumberTileId.Two, x: 7, y: 7 }, { id: NumberTileId.Three, x: 8, y: 7 }],
      description: "Place tiles [2,3] = 5 → Score 10 points!"
    },
    {
      title: "Longer sequences score more",
      tiles: [
        { id: NumberTileId.One, x: 6, y: 7 },
        { id: NumberTileId.Two, x: 7, y: 7 },
        { id: NumberTileId.Three, x: 8, y: 7 },
        { id: NumberTileId.Four, x: 9, y: 7 }
      ],
      description: "Sequence [1,2,3,4] = 10 → Score 20 points!"
    },
    {
      title: "Cross patterns for bonus points",
      tiles: [
        { id: NumberTileId.Two, x: 7, y: 6 },
        { id: NumberTileId.One, x: 7, y: 7 },
        { id: NumberTileId.Two, x: 7, y: 8 },
        { id: NumberTileId.Three, x: 8, y: 7 },
        { id: NumberTileId.One, x: 9, y: 7 }
      ],
      description: "Form multiple sequences in one turn for maximum points!"
    }
  ]

  // Cycle through demo sequences
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demoSequences.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Generate floating background tiles
  useEffect(() => {
    const tiles: FloatingTile[] = []
    for (let i = 0; i < 15; i++) {
      tiles.push({
        id: (Math.floor(Math.random() * 10)) as NumberTileId,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2000
      })
    }
    setAnimatedTiles(tiles)
  }, [])

  const currentSequence = demoSequences[currentDemo]

  return (
    <>
      <Navigation currentPage="home" />
      <div css={landingContainerStyle}>
        {/* Background animated tiles */}
        <div css={backgroundTilesStyle}>
          {animatedTiles.map((tile, index) => (
            <div
              key={index}
              css={floatingTileStyle}
              style={{
                left: `${tile.x}%`,
                top: `${tile.y}%`,
                animationDelay: `${tile.delay}ms`
              }}
            >
              <NumberTile tileId={tile.id} size="normal" />
            </div>
          ))}
        </div>

        {/* Main content container */}
        <div css={contentContainerStyle}>
          {/* Left side - Game demo (2/3 of width) */}
          <div css={gameDemoStyle}>
            <div css={gameHeaderStyle}>
              <h1 css={titleStyle}>Summoning Looms</h1>
              <p css={subtitleStyle}>Ancient Mathematical Weaving Arts</p>
            </div>

            {/* Interactive game board demo */}
            <div css={demoSectionStyle}>
              <h3 css={demoTitleStyle}>{currentSequence.title}</h3>
              
              {/* Mini game board showing current demo */}
              <div css={demoBoardStyle}>
                <div css={gridStyle}>
                  {Array.from({ length: 7 }, (_, row) =>
                    Array.from({ length: 7 }, (_, col) => {
                      const tile = currentSequence.tiles.find(t => t.x === col + 5 && t.y === row + 5)
                      return (
                        <div
                          key={`${row}-${col}`}
                          css={gridCellStyle}
                        >
                          {tile && (
                            <div css={animatedTileSlotStyle}>
                              <NumberTile
                                tileId={tile.id}
                                size="large"
                                isPlaced={true}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
              
              <p css={demoDescriptionStyle}>{currentSequence.description}</p>
            </div>

            {/* How to play quick guide */}
            <div css={howToPlayStyle}>
              <h3 css={sectionTitleStyle}>How to Play</h3>
              <div css={stepsGridStyle}>
                <div css={stepStyle}>
                  <div css={stepNumberStyle}>1</div>
                  <div>
                    <h4>Place Tiles</h4>
                    <p>Place numbered tiles (0-9) adjacent to existing tiles</p>
                  </div>
                </div>
                <div css={stepStyle}>
                  <div css={stepNumberStyle}>2</div>
                  <div>
                    <h4>Form Sequences</h4>
                    <p>Create sequences that sum to multiples of 5</p>
                  </div>
                </div>
                <div css={stepStyle}>
                  <div css={stepNumberStyle}>3</div>
                  <div>
                    <h4>Score Points</h4>
                    <p>Score = (Sum ÷ 5) × 10 points per sequence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Actions (1/3 of width) */}
          <div css={actionPanelStyle}>
            <div css={actionsContainerStyle}>
              <h3 css={actionTitleStyle}>Ready to Weave?</h3>
              
              <button css={primaryButtonStyle} onClick={onPlayGame}>
                🎮 Start Playing
              </button>
              
              <button css={secondaryButtonStyle} onClick={onViewGallery}>
                🎯 Join Live Games
              </button>
              
              {onPlayFives && (
                <button css={secondaryButtonStyle} onClick={onPlayFives}>
                  🚀 Simplified Fives Game
                </button>
              )}
              
              <button css={secondaryButtonStyle} onClick={() => {
                window.location.pathname = '/mystical-join'
              }}>
                🔮 Mystical Game Portal
              </button>
              
              <button css={secondaryButtonStyle} onClick={onViewRules}>
                📚 Read Full Rules
              </button>

              {/* Quick stats */}
              <div css={quickStatsStyle}>
                <div css={statStyle}>
                  <div css={statNumberStyle}>5</div>
                  <div css={statLabelStyle}>Sacred Number</div>
                </div>
                <div css={statStyle}>
                  <div css={statNumberStyle}>0-9</div>
                  <div css={statLabelStyle}>Tile Numbers</div>
                </div>
                <div css={statStyle}>
                  <div css={statNumberStyle}>15×15</div>
                  <div css={statLabelStyle}>Game Board</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Animations
const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); opacity: 0.3; }
  50% { transform: translateY(-20px) rotate(5deg) scale(1.1); opacity: 0.6; }
`

const tileDropIn = keyframes`
  0% { 
    transform: translateY(-30px) scale(0.8) rotate(-10deg);
    opacity: 0;
  }
  60% {
    transform: translateY(5px) scale(1.1) rotate(2deg);
    opacity: 1;
  }
  100% { 
    transform: translateY(0) scale(1) rotate(0deg);
    opacity: 1;
  }
`

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.4); }
  50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
`

// Styles
const landingContainerStyle = css`
  position: relative;
  width: 100vw;
  min-height: 100vh;
  padding-top: 70px; /* Account for fixed navigation */
  background: linear-gradient(135deg, 
    #1a1a2e 0%, 
    #16213e 25%, 
    #0f3460 50%, 
    #533483 75%, 
    #7209b7 100%);
  overflow-x: hidden;
  color: white;
`

const backgroundTilesStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.15;
`

const floatingTileStyle = css`
  position: absolute;
  animation: ${floatAnimation} 8s ease-in-out infinite;
  transform-origin: center;
  filter: blur(1px);
`

const contentContainerStyle = css`
  position: relative;
  z-index: 2;
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 2rem;
  gap: 2rem;

  @media (max-width: 1024px) {
    flex-direction: column;
    padding: 1rem;
  }
`

const gameDemoStyle = css`
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const gameHeaderStyle = css`
  text-align: center;
  margin-bottom: 1rem;
`

const titleStyle = css`
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 900;
  background: linear-gradient(45deg, #FFD700, #FFA500, #FF6347);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  margin: 0;
  font-family: 'Quicksand', sans-serif;
`

const subtitleStyle = css`
  font-size: 1.5rem;
  opacity: 0.9;
  margin: 0.5rem 0 0 0;
  font-style: italic;
  color: #E6E6FA;
`

const demoSectionStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
`

const demoTitleStyle = css`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #FFD700;
  font-weight: 700;
`

const demoBoardStyle = css`
  display: flex;
  justify-content: center;
  margin: 2rem 0;
`

const gridStyle = css`
  display: grid;
  grid-template-columns: repeat(7, 60px);
  grid-template-rows: repeat(7, 60px);
  gap: 4px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  border: 2px solid rgba(255, 215, 0, 0.3);
`

const gridCellStyle = css`
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.1);
  }
`

const animatedTileSlotStyle = css`
  animation: ${tileDropIn} 0.8s ease-out;
  animation-fill-mode: both;
`

const demoDescriptionStyle = css`
  font-size: 1.2rem;
  color: #E6E6FA;
  font-weight: 500;
`

const howToPlayStyle = css`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const sectionTitleStyle = css`
  font-size: 1.6rem;
  color: #FFD700;
  margin-bottom: 1rem;
  text-align: center;
`

const stepsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`

const stepStyle = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const stepNumberStyle = css`
  width: 40px;
  height: 40px;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #1a1a2e;
  flex-shrink: 0;
`

const actionPanelStyle = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

const actionsContainerStyle = css`
  width: 100%;
  max-width: 350px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
`

const actionTitleStyle = css`
  font-size: 1.8rem;
  margin-bottom: 2rem;
  color: #FFD700;
  font-weight: 700;
`

const primaryButtonStyle = css`
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  color: #1a1a2e;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(255, 215, 0, 0.5);
    animation: ${pulseGlow} 2s ease-in-out infinite;
  }

  &:active {
    transform: translateY(-1px);
  }
`

const secondaryButtonStyle = css`
  width: 100%;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 215, 0, 0.5);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`

const quickStatsStyle = css`
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
`

const statStyle = css`
  text-align: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const statNumberStyle = css`
  font-size: 1.5rem;
  font-weight: 900;
  color: #FFD700;
  display: block;
`

const statLabelStyle = css`
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 0.5rem;
` 