/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import type { GameConfig } from '../GameDisplay'
import type { GameState } from './NewAgeGameBoard'
import { DynamicConnectButton } from './DynamicConnectButton'

interface NewAgeGameHeaderProps {
  gameConfig: GameConfig
  gameState: GameState
  onBackToSetup: () => void
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}

export function NewAgeGameHeader({ 
  gameConfig, 
  gameState, 
  onBackToSetup, 
  onToggleSidebar, 
  sidebarCollapsed 
}: NewAgeGameHeaderProps) {
  return (
    <div css={headerStyle}>
      <div css={headerLeftStyle}>
        <button css={backButtonStyle} onClick={onBackToSetup} title="Back to Setup">
          ↩
        </button>
        <h1 css={titleStyle}>SUMMON FIVES</h1>
        <div css={gameModeStyle}>
          Classic Weaving
        </div>
      </div>

      <div css={headerCenterStyle}>
        <div css={turnInfoStyle}>
          <span css={turnLabelStyle}>Turn</span>
          <span css={turnNumberStyle}>{gameState.turnNumber}</span>
        </div>
        <div css={separatorStyle}>•</div>
        <div css={infoRowStyle}>
          <div css={scoreInfoStyle}>
            <span css={scoreNumberStyle}>{gameState.scores[gameState.currentPlayer]}</span>
            <span css={scoreLabelStyle}>Points</span>
          </div>
          <div css={separatorStyle}>•</div>
          <div css={tilesInfoStyle}>
            <span css={tilesNumberStyle}>
              {gameState.playerHands.reduce((sum, hand) => sum + hand.length, 0) + 
               gameState.playerDrawPiles.reduce((sum, pile) => sum + pile.length, 0)}
            </span>
            <span css={tilesLabelStyle}>Threads</span>
          </div>
          <div css={separatorStyle}>•</div>
          <div css={currentPlayerStyle}>
            {gameConfig.playerNames[gameState.currentPlayer]}'s Turn
          </div>
        </div>
      </div>

      <div css={headerRightStyle}>
        <DynamicConnectButton />
        <a href="/new-age" css={linkStyle} title="New Age Testing">
          🔮
        </a>
        <button 
          css={sidebarToggleStyle} 
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Show Players' : 'Hide Players'}
        >
          {sidebarCollapsed ? '👥' : '✕'}
        </button>
      </div>
    </div>
  )
}

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(139, 69, 19, 0.12);
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(5px);
  min-height: 70px;
  z-index: 50;
  position: relative;
`

const headerLeftStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`

const backButtonStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  padding: 8px 12px;
  color: #FFD700;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
  
  &:hover {
    background: rgba(255, 215, 0, 0.3);
    border-color: #FFD700;
    transform: translateY(-1px);
  }
`

const titleStyle = css`
  font-family: 'Fredoka One', cursive;
  font-size: 1.5rem;
  color: #FFD700;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
`

const gameModeStyle = css`
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 4px 10px;
  color: rgba(255, 215, 0, 0.9);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const headerCenterStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 2;
  justify-content: center;
  color: #F5DEB3;
  font-weight: 500;
`

const turnInfoStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const turnLabelStyle = css`
  font-size: 0.7rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const turnNumberStyle = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: #FFD700;
`

const separatorStyle = css`
  color: rgba(255, 215, 0, 0.6);
  font-size: 1.2rem;
`

const infoRowStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const scoreInfoStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const scoreNumberStyle = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: #FFD700;
`

const scoreLabelStyle = css`
  font-size: 0.7rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const tilesInfoStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const tilesNumberStyle = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: #87CEEB;
`

const tilesLabelStyle = css`
  font-size: 0.7rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const currentPlayerStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: #FFD700;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  min-width: 120px;
`

const headerRightStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: flex-end;
`

const linkStyle = css`
  color: rgba(255, 215, 0, 0.8);
  text-decoration: none;
  font-size: 1.2rem;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #FFD700;
    background: rgba(255, 215, 0, 0.1);
    transform: scale(1.1);
  }
`

const sidebarToggleStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  padding: 8px 12px;
  color: #FFD700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
  
  &:hover {
    background: rgba(255, 215, 0, 0.3);
    border-color: #FFD700;
    transform: translateY(-1px);
  }
` 