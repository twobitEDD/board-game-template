/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState } from 'react'

export function NewAgeDisplay() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [gameMessage, setGameMessage] = useState("Select a tile from your hand, then click an empty space!")
  const [notifications] = useState([
    { id: 1, type: 'turn', message: 'Your turn has begun', time: '2s ago' },
    { id: 2, type: 'score', message: 'You scored 15 points!', time: '1m ago' },
    { id: 3, type: 'pattern', message: 'New pattern discovered', time: '2m ago' }
  ])

  return (
    <div css={containerStyle}>
      <div css={backgroundStyle}>
        <div css={mainAreaStyle}>
          {/* Header info integrated into main area */}
          <div css={topSectionStyle}>
            <h1 css={titleStyle}>SUMMONING LOOMS</h1>
            <div css={gameInfoStyle}>Turn 1 • 50 Threads</div>
            <div css={gameMessageStyle}>{gameMessage}</div>
            <div css={modeInfoStyle}>
              New Age Display Mode • <a href="/" css={linkStyle}>Play Real Game</a>
            </div>
          </div>
          
          {/* Game board with placed tiles */}
          <div css={boardPlaceholderStyle}>
            <div css={boardGridStyle}>
              {/* Sample board showing various magical states - 5x5 grid */}
              {(() => {
                const tiles = [
                  { number: 1, color: 'teal', state: 'success' },
                  { number: 3, color: 'forest', state: 'success' },
                  { number: 4, color: 'purple', state: 'catching-fire-valid' },
                  { number: 2, color: 'orange', state: 'catching-fire-valid' },
                  { number: 8, color: 'orange', state: 'unplayed' },
                  
                  { number: 5, color: 'sage', state: 'connecting' },
                  { number: 6, color: 'teal', state: 'connecting' },
                  { number: 1, color: 'purple', state: 'incorrect' },
                  { number: 4, color: 'sage', state: 'burning', countdown: 2 },
                  { number: 9, color: 'forest', state: 'unplayed' },
                  
                  { number: 2, color: 'forest', state: 'burnt' },
                  { number: 7, color: 'orange', state: 'success' },
                  { number: 3, color: 'teal', state: 'success' },
                  { number: 8, color: 'purple', state: 'success' },
                  { number: 0, color: 'sage', state: 'unplayed' },
                  
                  { number: 9, color: 'teal', state: 'connecting' },
                  { number: 2, color: 'forest', state: 'connecting' },
                  { number: 5, color: 'orange', state: 'burning', countdown: 1 },
                  { number: 1, color: 'purple', state: 'unplayed' },
                  { number: 7, color: 'sage', state: 'unplayed' },
                  
                  { number: '', color: 'teal', state: 'empty' },
                  { number: '', color: 'forest', state: 'empty' },
                  { number: '', color: 'sage', state: 'empty' },
                  { number: '', color: 'orange', state: 'empty' },
                  { number: '', color: 'purple', state: 'empty' } // bottom row empty for new placements
                ]

                // Function to get adjacent tiles with same state
                const getAdjacencyConnections = (index: number, tiles: any[]) => {
                  const currentTile = tiles[index]
                  if (!currentTile) return { hasRightConnection: false, hasDownConnection: false }
                  
                  const row = Math.floor(index / 5)
                  const col = index % 5
                  
                  // Check right neighbor (same row, next column)
                  const rightIndex = row * 5 + (col + 1)
                  const rightTile = rightIndex < tiles.length ? tiles[rightIndex] : null
                  const hasRightConnection = rightTile && rightTile.state === currentTile.state && col < 4
                  
                  // Check down neighbor (next row, same column)
                  const downIndex = (row + 1) * 5 + col
                  const downTile = downIndex < tiles.length ? tiles[downIndex] : null
                  const hasDownConnection = downTile && downTile.state === currentTile.state && row < 4
                  
                  return { hasRightConnection, hasDownConnection }
                }

                return tiles.map((tile, index) => {
                  const connections = getAdjacencyConnections(index, tiles)
                  
                  return (
                    <div 
                      key={index} 
                      css={boardSlotStyle}
                      onClick={() => {
                        if (tile && tile.state === 'empty' && selectedTile !== null) {
                          setGameMessage(`Placed tile ${selectedTile} on the board!`)
                          setSelectedTile(null)
                        } else if (tile && tile.state === 'empty') {
                          setGameMessage("Select a tile from your hand first!")
                        } else if (tile) {
                          setGameMessage(`This space is occupied by ${tile.number}`)
                        }
                      }}
                    >
                      {tile && (
                        <>
                          <div css={getMagicalTileStyle(tile.color, tile.state)}>
                            {tile.state === 'empty' ? '' : tile.number}
                            {tile.state === 'burning' && tile.countdown && (
                              <div css={countdownBadgeStyle}>
                                {tile.countdown}
                              </div>
                            )}
                          </div>
                          
                          {/* State-based connection lines */}
                          {tile.state !== 'empty' && connections.hasRightConnection && (
                            <div css={getConnectionStyle(tile.state, 'horizontal')} />
                          )}
                          {tile.state !== 'empty' && connections.hasDownConnection && (
                            <div css={getConnectionStyle(tile.state, 'vertical')} />
                          )}
                        </>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
        
        <div css={tileTrayStyle}>
          {/* Player's hand of tiles */}
          <div css={trayHeaderStyle}>YOUR HAND</div>
          <div css={gameControlsStyle}>
            <button 
              css={endTurnButtonStyle}
              onClick={() => setGameMessage("Turn ended! In a real game, this would validate sequences and calculate score.")}
            >
              End Turn
            </button>
            <button 
              css={undoButtonStyle}
              onClick={() => {
                setSelectedTile(null)
                setGameMessage("Turn undone! Tiles returned to hand.")
              }}
            >
              Undo Turn
            </button>
          </div>
          <div css={tilesContainerStyle}>
            {/* Hand tiles showing unplayed and various states */}
            {[
              { number: 1, color: 'forest', state: 'unplayed' },
              { number: 5, color: 'sage', state: 'unplayed' },
              { number: 6, color: 'orange', state: 'unplayed' },
              { number: 3, color: 'purple', state: 'unplayed' },
              { number: 4, color: 'teal', state: 'unplayed' }
            ].map((tile, index) => (
                <div 
                  key={index} 
                  css={[
                    getMagicalTileStyle(tile.color, tile.state),
                    selectedTile === tile.number && selectedTileStyle
                  ]}
                  onClick={() => {
                    setSelectedTile(selectedTile === tile.number ? null : tile.number)
                    setGameMessage(selectedTile === tile.number ? 
                      "Tile deselected. Choose another tile to play." : 
                      `Selected tile ${tile.number}. Click an empty space to place it!`)
                  }}
                >
                  {tile.number}
                  {tile.state === 'burning' && (tile as any).countdown && (
                    <div css={countdownBadgeStyle}>
                      {(tile as any).countdown}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
        
        {/* Magic States Demo Section */}
        <div css={demoSectionStyle}>
          <div css={demoHeaderStyle}>MAGICAL STATES DEMO</div>
          <div css={demoGridStyle}>
            <div css={demoItemStyle}>
              <div css={getMagicalTileStyle('forest', 'unplayed')}>1</div>
              <div css={demoLabelStyle}>In Hand<br/>(Ready to Play)</div>
            </div>
            <div css={demoItemStyle}>
              <div css={getMagicalTileStyle('teal', 'empty')}>?</div>
              <div css={demoLabelStyle}>Empty Space<br/>(Can Place)</div>
            </div>
            <div css={demoItemStyle}>
              <div css={getMagicalTileStyle('sage', 'connecting')}>2</div>
              <div css={demoLabelStyle}>Connecting<br/>(Seeking)</div>
            </div>
            <div css={demoItemStyle}>
              <div css={getMagicalTileStyle('teal', 'success')}>3</div>
              <div css={demoLabelStyle}>Success<br/>(Magical!)</div>
            </div>
            <div css={demoItemStyle}>
              <div css={getMagicalTileStyle('orange', 'catching-fire-valid')}>4</div>
              <div css={demoLabelStyle}>Fire Valid<br/>(Building)</div>
            </div>
            <div css={demoItemStyle}>
              <div css={getMagicalTileStyle('purple', 'catching-fire-invalid')}>5</div>
              <div css={demoLabelStyle}>Fire Invalid<br/>(Danger)</div>
            </div>
            <div css={demoItemStyle}>
              <div css={getMagicalTileStyle('forest', 'burning')}>
                3
                <div css={countdownBadgeStyle}>2</div>
              </div>
              <div css={demoLabelStyle}>Burning<br/>(2 turns left)</div>
            </div>
            <div css={demoItemStyle}>
              <div css={getMagicalTileStyle('orange', 'burning')}>
                5
                <div css={countdownBadgeStyle}>1</div>
              </div>
              <div css={demoLabelStyle}>Burning<br/>(1 turn left!)</div>
            </div>
            <div css={demoItemStyle}>
              <div css={getMagicalTileStyle('sage', 'burnt')}>6</div>
              <div css={demoLabelStyle}>Burnt<br/>(Fading)</div>
            </div>
            <div css={demoItemStyle}>
              <div css={getMagicalTileStyle('purple', 'incorrect')}>7</div>
              <div css={demoLabelStyle}>Incorrect<br/>(Poof!)</div>
            </div>
          </div>
        </div>
        
        {/* Sidebar toggle button */}
        <button 
          css={sidebarToggleStyle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '→' : '←'}
          {!sidebarOpen && notifications.length > 0 && (
            <div css={notificationBadgeStyle}>
              {notifications.length}
            </div>
          )}
        </button>
        
        {/* Overlay sidebar */}
        <div css={[sidebarStyle, sidebarOpen && sidebarOpenStyle]}>
          <div css={sidebarHeaderStyle}>
            <h3 css={sidebarTitleStyle}>Game Updates</h3>
            <button 
              css={closeButtonStyle}
              onClick={() => setSidebarOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div css={notificationsContainerStyle}>
            {notifications.map(notification => (
              <div key={notification.id} css={notificationItemStyle}>
                <div css={notificationTypeStyle(notification.type)}>
                  {notification.type === 'turn' && '⚡'}
                  {notification.type === 'score' && '⭐'}
                  {notification.type === 'pattern' && '🔮'}
                </div>
                <div css={notificationContentStyle}>
                  <div css={notificationMessageStyle}>
                    {notification.message}
                  </div>
                  <div css={notificationTimeStyle}>
                    {notification.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div css={sidebarFooterStyle}>
            <div css={gameStatsStyle}>
              <div>Score: 245</div>
              <div>Patterns: 3</div>
              <div>Threads Used: 12</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Basic container
const containerStyle = css`
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
`

// Enhanced mystical forest background
const backgroundStyle = css`
  width: 100%;
  height: 100%;
  background: radial-gradient(
    ellipse at center,
    #1e3c3a 0%,
    #2d5a54 30%,
    #1a4a42 60%,
    #0f2e28 100%
  );
  display: grid;
  grid-template-areas: 
    "main main"
    "tray tray";
  grid-template-columns: 1fr;
  grid-template-rows: 1fr auto;
  position: relative;
  overflow: hidden;
  
  /* Mystical particles and fireflies */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(2px 2px at 25px 35px, #90EE90, transparent),
      radial-gradient(3px 3px at 160px 80px, #FFD700, transparent),
      radial-gradient(1px 1px at 300px 150px, #90EE90, transparent),
      radial-gradient(2px 2px at 80px 200px, #FFD700, transparent),
      radial-gradient(1px 1px at 250px 50px, #98FB98, transparent),
      radial-gradient(2px 2px at 400px 180px, #F0E68C, transparent);
    background-repeat: repeat;
    background-size: 450px 250px;
    animation: mysticalGlow 8s ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 1;
  }
  
  /* Forest silhouettes and mystical swirls */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 150px;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.4) 0%,
      rgba(0, 0, 0, 0.2) 50%,
      transparent 100%
    );
    z-index: 2;
    pointer-events: none;
  }
  
  @keyframes mysticalGlow {
    0% { 
      opacity: 0.6; 
      transform: translateY(0px);
    }
    100% { 
      opacity: 1; 
      transform: translateY(-10px);
    }
  }
`

// Top section - centered header
const topSectionStyle = css`
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  gap: 8px;
  width: auto;
`

const titleStyle = css`
  color: #FFD700;
  font-family: 'Fredoka One', 'Arial', sans-serif;
  font-size: 36px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 2px;
`

const gameInfoStyle = css`
  color: #CCC;
  font-size: 14px;
`

const modeInfoStyle = css`
  color: rgba(255, 215, 0, 0.6);
  font-size: 12px;
  text-align: center;
  margin-top: 8px;
  font-weight: 400;
`

const linkStyle = css`
  color: #FFD700;
  text-decoration: underline;
  font-weight: bold;
  
  &:hover {
    color: #FFF;
    text-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
  }
`

const gameMessageStyle = css`
  color: #FFD700;
  font-size: 14px;
  text-align: center;
  margin: 10px 0;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.3);
`

const selectedTileStyle = css`
  border: 3px solid #FFD700 !important;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.8) !important;
  transform: scale(1.05) !important;
`

const gameControlsStyle = css`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 10px;
`

const endTurnButtonStyle = css`
  background: linear-gradient(135deg, #228B22 0%, #32CD32 50%, #228B22 100%);
  color: white;
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
  font-family: 'Fredoka One', 'Arial', sans-serif;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #32CD32 0%, #228B22 50%, #32CD32 100%);
    box-shadow: 0 0 12px rgba(50, 205, 50, 0.6);
    transform: scale(1.05);
  }
`

const undoButtonStyle = css`
  background: linear-gradient(135deg, #8B4513 0%, #CD853F 50%, #8B4513 100%);
  color: white;
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
  font-family: 'Fredoka One', 'Arial', sans-serif;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #CD853F 0%, #8B4513 50%, #CD853F 100%);
    box-shadow: 0 0 12px rgba(205, 133, 63, 0.6);
    transform: scale(1.05);
  }
`

// Main game area
const mainAreaStyle = css`
  grid-area: main;
  padding: 80px 20px 20px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`

const boardPlaceholderStyle = css`
  width: 438px;
  height: 438px;
  background: linear-gradient(
    135deg,
    rgba(101, 67, 33, 0.4) 0%,
    rgba(139, 69, 19, 0.5) 25%,
    rgba(160, 82, 45, 0.4) 50%,
    rgba(139, 69, 19, 0.5) 75%,
    rgba(101, 67, 33, 0.4) 100%
  );
  border: 6px solid #8B4513;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFD700;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 
    0 0 30px rgba(255, 215, 0, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 0 20px rgba(0, 0, 0, 0.2);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border: 3px solid #DAA520;
    border-radius: 20px;
    z-index: -1;
  }
  
  &::after {
    content: '';
    position: absolute;
    inset: 12px;
    border: 2px dashed rgba(255, 215, 0, 0.3);
    border-radius: 8px;
    pointer-events: none;
  }
`

// Board grid layout
const boardGridStyle = css`
  display: grid;
  grid-template-columns: repeat(5, 70px);
  grid-template-rows: repeat(5, 70px);
  gap: 2px;
  width: 398px;
  height: 398px;
  padding: 20px;
  justify-content: center;
  align-content: center;
`

const boardSlotStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 69, 19, 0.1);
  border: 2px dashed rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  width: 70px;
  height: 70px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  
  &:hover {
    background: rgba(139, 69, 19, 0.2);
    border-color: rgba(255, 215, 0, 0.5);
  }
`

// Tile tray at bottom
const tileTrayStyle = css`
  grid-area: tray;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid #666;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const trayHeaderStyle = css`
  color: #FFD700;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  font-family: 'Fredoka One', 'Arial', sans-serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
`

const tilesContainerStyle = css`
  display: flex;
  justify-content: center;
  gap: 12px;
  align-items: center;
`

// Seamless weaving connection system for same-state tiles
const getConnectionStyle = (state: string, direction: 'horizontal' | 'vertical') => {
  const getStateColor = (state: string) => {
    switch(state) {
      case 'success': return '#00FF00'
      case 'connecting': return '#FFD700'
      case 'catching-fire-valid': return '#FF4500'
      case 'catching-fire-invalid': return '#DC143C'
      case 'burning': return '#FF0000'
      case 'burnt': return '#696969'
      case 'incorrect': return '#FF1493'
      case 'unplayed': return '#8B4513'
      default: return '#FFD700'
    }
  }

  const stateColor = getStateColor(state)
  const isHorizontal = direction === 'horizontal'
  
  return css`
    position: absolute;
    ${isHorizontal ? `
      right: -2px;
      top: 50%;
      width: 4px;
      height: 40px;
      transform: translateY(-50%);
    ` : `
      bottom: -2px;
      left: 50%;
      width: 40px;
      height: 4px;
      transform: translateX(-50%);
    `}
    background: ${stateColor};
    pointer-events: none;
    z-index: 15;
    
    /* Weaving pattern overlay */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        ${isHorizontal ? `
          repeating-linear-gradient(0deg, 
            transparent 0px, 
            rgba(255,255,255,0.2) 2px, 
            transparent 4px
          )
        ` : `
          repeating-linear-gradient(90deg, 
            transparent 0px, 
            rgba(255,255,255,0.2) 2px, 
            transparent 4px
          )
        `};
    }
    
    /* Add magical effects based on state */
    ${state === 'success' && css`
      box-shadow: 0 0 8px ${stateColor}80;
      animation: weavingGlow 2s ease-in-out infinite alternate;
    `}
    
    ${state === 'connecting' && css`
      animation: weavingPulse 1.5s ease-in-out infinite;
    `}
    
    ${(state === 'burning' || state === 'catching-fire-invalid') && css`
      animation: weavingFlicker 0.8s ease-in-out infinite;
    `}
    
    @keyframes weavingGlow {
      0% { box-shadow: 0 0 4px ${stateColor}40; }
      100% { box-shadow: 0 0 12px ${stateColor}80; }
    }
    
    @keyframes weavingPulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
    
    @keyframes weavingFlicker {
      0%, 100% { opacity: 0.8; }
      25% { opacity: 0.4; }
      50% { opacity: 1; }
      75% { opacity: 0.6; }
    }
  `
}

// Magical garment fragment tiles with mystical states
const getMagicalTileStyle = (colorName: string, state: string) => {
  const colorMap: { [key: string]: { bg: string; bgSecondary: string; border: string; text: string; pattern: string } } = {
    forest: { bg: '#2E8B57', bgSecondary: '#20B2AA', border: '#1F4F4F', text: '#FFD700', pattern: 'crosshatch' },
    sage: { bg: '#9CAF88', bgSecondary: '#7CB342', border: '#558B2F', text: '#FFD700', pattern: 'diamond' },
    orange: { bg: '#D2691E', bgSecondary: '#FF8C00', border: '#8B4513', text: '#FFD700', pattern: 'crosshatch' },
    teal: { bg: '#20B2AA', bgSecondary: '#00CED1', border: '#008B8B', text: '#FFD700', pattern: 'crosshatch' },
    purple: { bg: '#8A2BE2', bgSecondary: '#9932CC', border: '#4B0082', text: '#FFD700', pattern: 'diamond' }
  }
  
  const colors = colorMap[colorName] || colorMap.forest
  
  const getStateStyles = () => {
    switch(state) {
      case 'unplayed': return { size: '70px', fontSize: '36px', opacity: '1', cursor: 'pointer', border: 'none', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2)', animation: 'none', extraStyles: 'position: relative; border-radius: 8px;' }
      case 'connecting': return { size: '70px', fontSize: '36px', opacity: '0.9', cursor: 'default', border: `2px solid ${colors.border}`, boxShadow: '0 0 15px rgba(255, 215, 0, 0.5)', animation: 'pulse 2s ease-in-out infinite', extraStyles: 'border-radius: 4px;' }
      case 'success': return { size: '70px', fontSize: '36px', opacity: '1', cursor: 'default', border: '2px solid #00FF00', boxShadow: '0 0 25px rgba(0, 255, 0, 0.8), 0 0 35px rgba(255, 215, 0, 0.6)', animation: 'magicalGlow 3s ease-in-out infinite', extraStyles: 'border-radius: 4px;' }
      case 'catching-fire-valid': return { size: '70px', fontSize: '36px', opacity: '1', cursor: 'default', border: '2px solid #FF4500', boxShadow: '0 0 20px rgba(255, 69, 0, 0.8)', animation: 'flicker 0.8s ease-in-out infinite', extraStyles: 'border-radius: 4px;' }
      case 'catching-fire-invalid': return { size: '70px', fontSize: '36px', opacity: '0.9', cursor: 'default', border: '2px solid #DC143C', boxShadow: '0 0 20px rgba(220, 20, 60, 0.8)', animation: 'dangerFlicker 0.6s ease-in-out infinite', extraStyles: 'border-radius: 4px;' }
      case 'burning': return { size: '70px', fontSize: '36px', opacity: '1', cursor: 'default', border: '2px solid #FF0000', boxShadow: '0 0 30px rgba(255, 0, 0, 1)', animation: 'burnCountdown 0.8s ease-in-out infinite', extraStyles: 'background: linear-gradient(135deg, #FF0000 0%, #FF6600 25%, #FF4500 50%, #FF6600 75%, #FF0000 100%) !important; color: #FFFFFF !important; font-weight: 900 !important; text-shadow: 2px 2px 4px rgba(0, 0, 0, 1) !important; border-radius: 4px;' }
      case 'burnt': return { size: '70px', fontSize: '36px', opacity: '0.3', cursor: 'default', border: '2px dashed #696969', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', animation: 'fadeAway 4s ease-out infinite', extraStyles: 'background: linear-gradient(135deg, #2F2F2F 0%, #696969 50%, #2F2F2F 100%) !important; color: #A0A0A0 !important;' }
      case 'incorrect': return { size: '70px', fontSize: '36px', opacity: '0.6', cursor: 'default', border: '3px solid #FF1493', boxShadow: '0 0 15px rgba(255, 20, 147, 0.8)', animation: 'poofDisappear 2s ease-out infinite', extraStyles: '' }
      case 'empty': return { size: '70px', fontSize: '36px', opacity: '0.5', cursor: 'pointer', border: '2px dashed rgba(255, 215, 0, 0.4)', boxShadow: 'none', animation: 'none', extraStyles: 'background: rgba(0, 0, 0, 0.1) !important; color: rgba(255, 215, 0, 0.3) !important; &:hover { border: 2px dashed rgba(255, 215, 0, 0.7); background: rgba(255, 215, 0, 0.1) !important; opacity: 0.8; }' }
      default: return { size: '70px', fontSize: '36px', opacity: '1', cursor: 'pointer', border: `3px solid ${colors.border}`, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', animation: 'none', extraStyles: '' }
    }
  }
  
  const stateStyles = getStateStyles()
  
  return css`
    width: ${stateStyles.size};
    height: ${stateStyles.size};
    background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgSecondary} 50%, ${colors.bg} 100%);
    border: ${stateStyles.border};
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${colors.text};
    font-size: ${stateStyles.fontSize};
    font-weight: bold;
    font-family: 'Fredoka One', 'Arial', sans-serif;
    cursor: ${stateStyles.cursor};
    transition: all 0.3s ease;
    position: relative;
    opacity: ${stateStyles.opacity};
    box-shadow: ${stateStyles.boxShadow};
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    animation: ${stateStyles.animation};
    ${stateStyles.extraStyles}
    
    @keyframes pulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.1); } }
    @keyframes magicalGlow { 0%, 100% { box-shadow: 0 0 25px rgba(0, 255, 0, 0.8), 0 0 35px rgba(255, 215, 0, 0.6); } 50% { box-shadow: 0 0 35px rgba(0, 255, 0, 1), 0 0 45px rgba(255, 215, 0, 0.8); } }
    @keyframes flicker { 0%, 100% { opacity: 1; } 25% { opacity: 0.8; } 50% { opacity: 1; } 75% { opacity: 0.9; } }
    @keyframes dangerFlicker { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.6; } }
    @keyframes burnCountdown { 0% { filter: brightness(1.3); transform: scale(1); } 50% { filter: brightness(1.8); transform: scale(1.08); } 100% { filter: brightness(1.3); transform: scale(1); } }
    @keyframes fadeAway { 0% { opacity: 0.3; } 50% { opacity: 0.1; } 100% { opacity: 0.3; } }
    @keyframes poofDisappear { 0% { opacity: 0.6; filter: blur(0px); } 50% { opacity: 0.3; filter: blur(1px); } 100% { opacity: 0.6; filter: blur(0px); } }
  `
}

const countdownBadgeStyle = css`
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #FF0000 0%, #FF4500 50%, #FF0000 100%);
  color: #FFFFFF;
  border: 2px solid #FFD700;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 0 8px rgba(255, 0, 0, 0.8), 0 0 12px rgba(255, 69, 0, 0.6);
  animation: countdownPulse 0.6s ease-in-out infinite;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  
  @keyframes countdownPulse {
    0% { transform: scale(1); box-shadow: 0 0 8px rgba(255, 0, 0, 0.8), 0 0 12px rgba(255, 69, 0, 0.6); }
    50% { transform: scale(1.1); box-shadow: 0 0 12px rgba(255, 0, 0, 1), 0 0 16px rgba(255, 69, 0, 0.8); }
    100% { transform: scale(1); box-shadow: 0 0 8px rgba(255, 0, 0, 0.8), 0 0 12px rgba(255, 69, 0, 0.6); }
  }
`

// Sidebar toggle button
const sidebarToggleStyle = css`
  position: fixed;
  top: 20px;
  right: 0;
  background: rgba(139, 69, 19, 0.9);
  border: 2px solid #FFD700;
  border-right: none;
  border-radius: 8px 0 0 8px;
  color: #FFD700;
  font-size: 18px;
  padding: 12px 8px;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
  font-weight: bold;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(139, 69, 19, 1);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  }
`

const notificationBadgeStyle = css`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #FF4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 2px solid #FFD700;
`

const sidebarStyle = css`
  position: fixed;
  top: 0;
  right: -350px;
  width: 350px;
  height: 100vh;
  background: linear-gradient(135deg, rgba(15, 32, 39, 0.95) 0%, rgba(32, 58, 67, 0.95) 50%, rgba(44, 83, 100, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-left: 3px solid #FFD700;
  z-index: 999;
  transition: right 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.5);
`

const sidebarOpenStyle = css`
  right: 0;
`

const sidebarHeaderStyle = css`
  padding: 20px;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const sidebarTitleStyle = css`
  color: #FFD700;
  font-family: 'Fredoka One', 'Arial', sans-serif;
  font-size: 18px;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`

const closeButtonStyle = css`
  background: none;
  border: none;
  color: #FFD700;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: scale(1.1);
  }
`

const notificationsContainerStyle = css`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`

const notificationItemStyle = css`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  border-left: 3px solid #FFD700;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.15);
    transform: translateX(5px);
  }
`

const notificationTypeStyle = (type: string) => {
  const typeColors: { [key: string]: { bg: string; border: string } } = {
    turn: { bg: 'rgba(255, 215, 0, 0.2)', border: '#FFD700' },
    score: { bg: 'rgba(0, 255, 0, 0.2)', border: '#00FF00' },
    pattern: { bg: 'rgba(138, 43, 226, 0.2)', border: '#8A2BE2' }
  }
  
  const colors = typeColors[type] || typeColors.turn
  
  return css`
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
    background: ${colors.bg};
    border: 1px solid ${colors.border};
  `
}

const notificationContentStyle = css`
  flex: 1;
`

const notificationMessageStyle = css`
  color: #FFD700;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
`

const notificationTimeStyle = css`
  color: rgba(255, 215, 0, 0.7);
  font-size: 12px;
`

const sidebarFooterStyle = css`
  padding: 20px;
  border-top: 2px solid rgba(255, 215, 0, 0.3);
`

const gameStatsStyle = css`
  color: #FFD700;
  font-size: 14px;
  
  > div {
    margin-bottom: 8px;
    padding: 8px;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
  }
  
  > div:last-child {
    margin-bottom: 0;
  }
`

const demoSectionStyle = css`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #FFD700;
  border-radius: 12px;
  padding: 15px;
  z-index: 100;
`

const demoHeaderStyle = css`
  color: #FFD700;
  font-family: 'Fredoka One', 'Arial', sans-serif;
  font-size: 14px;
  text-align: center;
  margin-bottom: 10px;
  letter-spacing: 1px;
`

const demoGridStyle = css`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 10px;
  align-items: center;
`

const demoItemStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`

const demoLabelStyle = css`
  color: #FFD700;
  font-family: 'Arial', sans-serif;
  font-size: 10px;
  text-align: center;
  line-height: 1.2;
  font-weight: bold;
`