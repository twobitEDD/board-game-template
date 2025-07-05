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

interface BlockchainTurnSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  turnNumber: number
  gameId: number
  playerName: string
  tilesPlaced: TilePlacement[]
  scoreGained: number
  totalScore: number
  allPlayers: PlayerInfo[]
  winningScore: number
  nextPlayerName?: string
  gameComplete?: boolean
}

export function BlockchainTurnSummaryModal({ 
  isOpen, 
  onClose, 
  turnNumber,
  gameId,
  playerName, 
  tilesPlaced, 
  scoreGained,
  totalScore,
  allPlayers,
  winningScore,
  nextPlayerName,
  gameComplete = false
}: BlockchainTurnSummaryModalProps) {
  console.log('🎯 MODAL COMPONENT DEBUG:', { isOpen, turnNumber, playerName, tilesPlaced })
  if (!isOpen) return null

  const formatAddress = (address: string) => 
    `${address.slice(0, 6)}...${address.slice(-4)}`

  const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score)
  const currentPlayer = allPlayers.find(p => p.isYou)
  const isWinning = currentPlayer && sortedPlayers[0]?.address === currentPlayer.address

  return (
    <div css={overlayStyle} onClick={onClose}>
      <div css={modalStyle} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div css={headerStyle}>
          <div css={iconStyle}>
            {gameComplete ? '🏆' : scoreGained >= 500 ? '⭐' : '✅'}
          </div>
          <h1 css={titleStyle}>
            {gameComplete ? 'Game Complete!' : `Turn ${turnNumber} Complete!`}
          </h1>
          <div css={gameInfoStyle}>Game #{gameId} • {playerName}</div>
        </div>

        <div css={contentStyle}>
          {/* Turn Summary */}
          <div css={sectionStyle}>
            <h3 css={sectionTitleStyle}>🎯 Your Move</h3>
            <div css={moveDetailsStyle}>
              <div css={tilesPlayedStyle}>
                <span css={labelStyle}>Tiles Placed:</span>
                <div css={tilesGridStyle}>
                  {tilesPlaced.map((tile, index) => (
                    <div key={index} css={tileChipStyle}>
                      <span css={tileNumberStyle}>{tile.number}</span>
                      <span css={tilePositionStyle}>({tile.x},{tile.y})</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div css={scoreBreakdownStyle}>
                <div css={scoreRowStyle}>
                  <span css={scoreLabel}>Points This Turn:</span>
                  <span css={scoreGainedStyle}>+{scoreGained}</span>
                </div>
                <div css={[scoreRowStyle, totalScoreRowStyle]}>
                  <span css={scoreLabel}>Your Total Score:</span>
                  <span css={totalScoreStyle}>{totalScore}</span>
                </div>
                <div css={progressRowStyle}>
                  <span css={progressLabel}>Progress to Victory:</span>
                  <div css={progressBarContainerStyle}>
                    <div 
                      css={progressBarStyle} 
                      style={{ width: `${Math.min((totalScore / winningScore) * 100, 100)}%` }}
                    />
                    <span css={progressTextStyle}>
                      {totalScore} / {winningScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player Standings */}
          <div css={sectionStyle}>
            <h3 css={sectionTitleStyle}>📊 Current Standings</h3>
            <div css={playersListStyle}>
              {sortedPlayers.map((player, index) => (
                <div key={player.address} css={[playerCardStyle, player.isYou && yourPlayerStyle]}>
                  <div css={rankStyle}>#{index + 1}</div>
                  <div css={playerInfoStyle}>
                    <div css={playerNameStyle}>
                      {player.name}
                      {player.isYou && <span css={youBadgeStyle}> (You)</span>}
                      {player.isCurrentPlayer && !gameComplete && <span css={turnBadgeStyle}> ⚡</span>}
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

          {/* Game Status */}
          <div css={statusSectionStyle}>
            <div css={statusCardStyle}>
              <div css={statusItemStyle}>
                <span css={statusLabelStyle}>Turn:</span>
                <span css={statusValueStyle}>{turnNumber}</span>
              </div>
              <div css={statusItemStyle}>
                <span css={statusLabelStyle}>Target Score:</span>
                <span css={statusValueStyle}>{winningScore}</span>
              </div>
              <div css={statusItemStyle}>
                <span css={statusLabelStyle}>Players:</span>
                <span css={statusValueStyle}>{allPlayers.length}</span>
              </div>
            </div>
            
            {!gameComplete && nextPlayerName && (
              <div css={nextTurnStyle}>
                <span css={nextTurnLabelStyle}>Next Turn:</span>
                <span css={nextTurnPlayerStyle}>{nextPlayerName}</span>
              </div>
            )}

            {isWinning && !gameComplete && (
              <div css={leadingStyle}>
                🏆 You're in the lead!
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div css={footerStyle}>
          <button css={continueButtonStyle} onClick={onClose}>
            {gameComplete ? 'View Final Board' : 'Continue Playing'}
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
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  padding: 20px;
  box-sizing: border-box;
`

const modalStyle = css`
  background: linear-gradient(135deg, 
    rgba(20, 40, 80, 0.98) 0%, 
    rgba(30, 50, 90, 0.98) 50%, 
    rgba(20, 40, 80, 0.98) 100%);
  border: 2px solid rgba(100, 200, 255, 0.3);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  color: #E8E8E8;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
`

const headerStyle = css`
  padding: 30px 24px 20px;
  text-align: center;
  background: linear-gradient(135deg, 
    rgba(100, 200, 255, 0.15) 0%, 
    rgba(50, 150, 255, 0.1) 100%);
  border-bottom: 1px solid rgba(100, 200, 255, 0.2);
`

const iconStyle = css`
  font-size: 3rem;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 12px rgba(100, 200, 255, 0.6));
`

const titleStyle = css`
  font-family: 'Fredoka One', Arial, sans-serif;
  font-size: 2rem;
  font-weight: bold;
  color: #64C8FF;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
  letter-spacing: 1px;
`

const gameInfoStyle = css`
  font-size: 1rem;
  color: #B8B8B8;
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
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(100, 200, 255, 0.1);
`

const sectionTitleStyle = css`
  font-size: 1.2rem;
  color: #64C8FF;
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
  color: #B8B8B8;
`

const tilesGridStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const tileChipStyle = css`
  background: linear-gradient(135deg, #64C8FF 0%, #3296FF 100%);
  color: #003366;
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

const totalScoreRowStyle = css`
  border-top: 1px solid rgba(100, 200, 255, 0.2);
  padding-top: 8px;
  margin-top: 4px;
`

const scoreLabel = css`
  color: #B8B8B8;
  font-weight: 500;
`

const scoreGainedStyle = css`
  color: #4CAF50;
  font-weight: bold;
  font-size: 1.2rem;
`

const totalScoreStyle = css`
  color: #64C8FF;
  font-weight: bold;
  font-size: 1.4rem;
`

const progressRowStyle = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
`

const progressLabel = css`
  color: #B8B8B8;
  font-weight: 500;
  font-size: 0.9rem;
`

const progressBarContainerStyle = css`
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  height: 20px;
  overflow: hidden;
`

const progressBarStyle = css`
  background: linear-gradient(90deg, #4CAF50 0%, #64C8FF 100%);
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 10px;
`

const progressTextStyle = css`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
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
  border: 1px solid rgba(100, 200, 255, 0.1);
`

const yourPlayerStyle = css`
  background: rgba(100, 200, 255, 0.1);
  border-color: rgba(100, 200, 255, 0.3);
`

const rankStyle = css`
  background: #64C8FF;
  color: #003366;
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
  color: #64C8FF;
  font-weight: 600;
`

const playerTilesStyle = css`
  color: #B8B8B8;
`

const leaderCrownStyle = css`
  font-size: 1.5rem;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
`

const statusSectionStyle = css`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(100, 200, 255, 0.1);
`

const statusCardStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`

const statusItemStyle = css`
  text-align: center;
`

const statusLabelStyle = css`
  display: block;
  color: #B8B8B8;
  font-size: 0.8rem;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const statusValueStyle = css`
  color: #64C8FF;
  font-size: 1.4rem;
  font-weight: bold;
`

const nextTurnStyle = css`
  background: rgba(100, 200, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 8px;
`

const nextTurnLabelStyle = css`
  color: #B8B8B8;
  margin-right: 8px;
`

const nextTurnPlayerStyle = css`
  color: #64C8FF;
  font-weight: bold;
`

const leadingStyle = css`
  background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
  color: white;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  font-size: 1.1rem;
`

const footerStyle = css`
  padding: 20px 24px;
  border-top: 1px solid rgba(100, 200, 255, 0.2);
  display: flex;
  justify-content: center;
`

const continueButtonStyle = css`
  background: linear-gradient(135deg, #64C8FF 0%, #3296FF 100%);
  color: #003366;
  border: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(100, 200, 255, 0.4);
  }
` 