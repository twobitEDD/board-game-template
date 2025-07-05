/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

interface TilePlacement {
  number: number
  x: number
  y: number
}

interface PlayerInfo {
  address: string
  name: string
  score: number
  tilesRemaining: number
  isCurrentPlayer: boolean
  isYou: boolean
}

interface TurnRecapModalProps {
  isOpen: boolean
  onClose: () => void
  previousPlayerName: string
  previousPlayerTiles: TilePlacement[]
  previousPlayerScoreGained: number
  previousPlayerTotalScore: number
  turnNumber: number
  gameId: number
  yourTurn: boolean
  allPlayers: PlayerInfo[]
  winningScore: number
}

export function TurnRecapModal({ 
  isOpen, 
  onClose, 
  previousPlayerName,
  previousPlayerTiles,
  previousPlayerScoreGained,
  previousPlayerTotalScore,
  turnNumber,
  gameId,
  yourTurn,
  allPlayers,
  winningScore
}: TurnRecapModalProps) {
  if (!isOpen) return null

  const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score)
  const currentPlayer = allPlayers.find(p => p.isYou)
  const leader = sortedPlayers[0]

  return (
    <div css={overlayStyle} onClick={onClose}>
      <div css={modalStyle} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div css={headerStyle}>
          <div css={iconStyle}>👀</div>
          <h1 css={titleStyle}>While You Were Away...</h1>
          <div css={gameInfoStyle}>Game #{gameId} • Turn {turnNumber}</div>
        </div>

        <div css={contentStyle}>
          {/* Previous Player's Move */}
          <div css={sectionStyle}>
            <h3 css={sectionTitleStyle}>🎲 {previousPlayerName}'s Turn</h3>
            <div css={moveDetailsStyle}>
              <div css={tilesPlayedStyle}>
                <span css={labelStyle}>Tiles Placed:</span>
                <div css={tilesGridStyle}>
                  {previousPlayerTiles.map((tile, index) => (
                    <div key={index} css={tileChipStyle}>
                      <span css={tileNumberStyle}>{tile.number}</span>
                      <span css={tilePositionStyle}>({tile.x},{tile.y})</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div css={scoreBreakdownStyle}>
                <div css={scoreRowStyle}>
                  <span css={scoreLabel}>Points Gained:</span>
                  <span css={scoreGainedStyle}>+{previousPlayerScoreGained}</span>
                </div>
                <div css={scoreRowStyle}>
                  <span css={scoreLabel}>New Total:</span>
                  <span css={totalScoreStyle}>{previousPlayerTotalScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Game State */}
          <div css={sectionStyle}>
            <h3 css={sectionTitleStyle}>📊 Current Standings</h3>
            <div css={playersListStyle}>
              {sortedPlayers.slice(0, 3).map((player, index) => (
                <div key={player.address} css={[playerCardStyle, player.isYou && yourPlayerStyle]}>
                  <div css={rankStyle}>#{index + 1}</div>
                  <div css={playerInfoStyle}>
                    <div css={playerNameStyle}>
                      {player.name}
                      {player.isYou && <span css={youBadgeStyle}> (You)</span>}
                      {player.isCurrentPlayer && <span css={turnBadgeStyle}> ⚡</span>}
                    </div>
                    <div css={playerStatsStyle}>
                      <span css={playerScoreStyle}>{player.score} pts</span>
                      <span css={playerTilesStyle}>{player.tilesRemaining} tiles</span>
                    </div>
                  </div>
                  {index === 0 && <div css={leaderCrownStyle}>👑</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Your Turn Status */}
          <div css={yourTurnSectionStyle}>
            <div css={yourTurnCardStyle}>
              <h3 css={yourTurnTitleStyle}>🎯 Your Turn!</h3>
              <div css={yourTurnStatsStyle}>
                <div css={yourTurnStatStyle}>
                  <span css={yourTurnStatLabelStyle}>Your Score:</span>
                  <span css={yourTurnStatValueStyle}>{currentPlayer?.score || 0}</span>
                </div>
                <div css={yourTurnStatStyle}>
                  <span css={yourTurnStatLabelStyle}>Tiles Remaining:</span>
                  <span css={yourTurnStatValueStyle}>{currentPlayer?.tilesRemaining || 0}</span>
                </div>
                <div css={yourTurnStatStyle}>
                  <span css={yourTurnStatLabelStyle}>Points Behind Leader:</span>
                  <span css={yourTurnStatValueStyle}>
                    {leader ? Math.max(0, leader.score - (currentPlayer?.score || 0)) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div css={footerStyle}>
          <button css={readyButtonStyle} onClick={onClose}>
            Got It - Let's Play! 🎮
          </button>
        </div>
      </div>
    </div>
  )
}

// Styles
const overlayStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
  padding: 20px;
  box-sizing: border-box;
`

const modalStyle = css`
  background: linear-gradient(135deg, 
    rgba(45, 20, 80, 0.98) 0%, 
    rgba(60, 30, 90, 0.98) 50%, 
    rgba(45, 20, 80, 0.98) 100%);
  border: 2px solid rgba(150, 100, 255, 0.3);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  color: #E8E8E8;
  overflow: hidden;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.9);
`

const headerStyle = css`
  padding: 30px 24px 20px;
  text-align: center;
  background: linear-gradient(135deg, 
    rgba(150, 100, 255, 0.2) 0%, 
    rgba(100, 50, 200, 0.15) 100%);
  border-bottom: 1px solid rgba(150, 100, 255, 0.3);
`

const iconStyle = css`
  font-size: 3rem;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 15px rgba(150, 100, 255, 0.8));
`

const titleStyle = css`
  font-family: 'Fredoka One', Arial, sans-serif;
  font-size: 2rem;
  font-weight: bold;
  color: #B57EDC;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
  letter-spacing: 1px;
`

const gameInfoStyle = css`
  font-size: 1rem;
  color: #C8C8C8;
  font-weight: 500;
`

const contentStyle = css`
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const sectionStyle = css`
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(150, 100, 255, 0.15);
`

const sectionTitleStyle = css`
  font-size: 1.2rem;
  color: #B57EDC;
  margin: 0 0 16px 0;
  font-weight: bold;
`

const moveDetailsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const tilesPlayedStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const labelStyle = css`
  font-weight: 600;
  color: #C8C8C8;
`

const tilesGridStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const tileChipStyle = css`
  background: linear-gradient(135deg, #B57EDC 0%, #9B59B6 100%);
  color: #2A1B3D;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
`

const tileNumberStyle = css`
  font-size: 1.2rem;
  font-weight: bold;
`

const tilePositionStyle = css`
  font-size: 0.7rem;
  opacity: 0.8;
`

const scoreBreakdownStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const scoreRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const scoreLabel = css`
  color: #C8C8C8;
  font-weight: 500;
`

const scoreGainedStyle = css`
  color: #4CAF50;
  font-weight: bold;
  font-size: 1.2rem;
`

const totalScoreStyle = css`
  color: #B57EDC;
  font-weight: bold;
  font-size: 1.2rem;
`

const playersListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const playerCardStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(150, 100, 255, 0.1);
`

const yourPlayerStyle = css`
  background: rgba(150, 100, 255, 0.12);
  border-color: rgba(150, 100, 255, 0.3);
`

const rankStyle = css`
  background: #B57EDC;
  color: #2A1B3D;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
`

const playerInfoStyle = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const playerNameStyle = css`
  font-weight: 600;
  color: #E8E8E8;
  display: flex;
  align-items: center;
  gap: 4px;
`

const youBadgeStyle = css`
  background: #4CAF50;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
`

const turnBadgeStyle = css`
  color: #FFD700;
`

const playerStatsStyle = css`
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
`

const playerScoreStyle = css`
  color: #B57EDC;
  font-weight: 600;
`

const playerTilesStyle = css`
  color: #C8C8C8;
`

const leaderCrownStyle = css`
  font-size: 1.5rem;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
`

const yourTurnSectionStyle = css`
  background: linear-gradient(135deg, 
    rgba(76, 175, 80, 0.15) 0%, 
    rgba(56, 142, 60, 0.1) 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(76, 175, 80, 0.3);
`

const yourTurnCardStyle = css`
  text-align: center;
`

const yourTurnTitleStyle = css`
  font-size: 1.4rem;
  color: #66BB6A;
  margin: 0 0 16px 0;
  font-weight: bold;
`

const yourTurnStatsStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`

const yourTurnStatStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const yourTurnStatLabelStyle = css`
  font-size: 0.8rem;
  color: #C8C8C8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const yourTurnStatValueStyle = css`
  font-size: 1.3rem;
  color: #66BB6A;
  font-weight: bold;
`

const footerStyle = css`
  padding: 20px 24px;
  border-top: 1px solid rgba(150, 100, 255, 0.2);
  display: flex;
  justify-content: center;
`

const readyButtonStyle = css`
  background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.5);
  }
` 