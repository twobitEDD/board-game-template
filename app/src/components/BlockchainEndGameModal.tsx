/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

interface BlockchainPlayer {
  address: string
  name: string
  score: number
  finalHandSize: number
}

interface BlockchainEndGameModalProps {
  isOpen: boolean
  onClose: () => void
  gameId: number
  winner: BlockchainPlayer
  allPlayers: BlockchainPlayer[]
  gameStats: {
    totalTurns: number
    finalTilePool: number
    gameTime?: string
  }
  onNewGame?: () => void
}

export function BlockchainEndGameModal({ 
  isOpen, 
  onClose, 
  gameId,
  winner, 
  allPlayers,
  gameStats,
  onNewGame
}: BlockchainEndGameModalProps) {
  if (!isOpen) return null

  const formatAddress = (address: string) => 
    `${address.slice(0, 6)}...${address.slice(-4)}`

  const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score)

  return (
    <div css={overlayStyle} onClick={onClose}>
      <div css={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Victory Header */}
        <div css={headerStyle}>
          <div css={victoryIconStyle}>🏆</div>
          <h1 css={victoryTitleStyle}>BLOCKCHAIN GAME COMPLETE!</h1>
          <div css={gameIdStyle}>Game #{gameId}</div>
          <div css={winnerNameStyle}>🎉 {formatAddress(winner.address)} Wins!</div>
          <div css={winnerScoreStyle}>{winner.score} Points</div>
        </div>

        {/* Player Rankings */}
        <div css={playersStyle}>
          <h3 css={sectionTitleStyle}>📊 Final Standings</h3>
          <div css={playerListStyle}>
            {sortedPlayers.map((player, index) => (
              <div key={player.address} css={[playerCardStyle, index === 0 && winnerCardStyle]}>
                <div css={rankStyle}>#{index + 1}</div>
                <div css={playerInfoStyle}>
                  <div css={playerAddressStyle}>{formatAddress(player.address)}</div>
                  <div css={playerStatsStyle}>
                    <span css={scoreStyle}>{player.score} pts</span>
                    <span css={handStyle}>• {player.finalHandSize} tiles left</span>
                  </div>
                </div>
                {index === 0 && <div css={crownStyle}>👑</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Game Statistics */}
        <div css={gameStatsStyle}>
          <h3 css={sectionTitleStyle}>🎮 Game Statistics</h3>
          <div css={statsGridStyle}>
            <div css={statItemStyle}>
              <div css={statValueStyle}>{gameStats.totalTurns}</div>
              <div css={statLabelStyle}>Total Turns</div>
            </div>
            <div css={statItemStyle}>
              <div css={statValueStyle}>{gameStats.finalTilePool}</div>
              <div css={statLabelStyle}>Tiles Remaining</div>
            </div>
            <div css={statItemStyle}>
              <div css={statValueStyle}>{allPlayers.length}</div>
              <div css={statLabelStyle}>Players</div>
            </div>
            {gameStats.gameTime && (
              <div css={statItemStyle}>
                <div css={statValueStyle}>{gameStats.gameTime}</div>
                <div css={statLabelStyle}>Game Time</div>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Info */}
        <div css={blockchainInfoStyle}>
          <div css={blockchainIconStyle}>⛓️</div>
          <div css={blockchainTextStyle}>
            Results permanently recorded on blockchain
          </div>
        </div>

        {/* Action Buttons */}
        <div css={footerStyle}>
          <button css={secondaryButtonStyle} onClick={onClose}>
            View Final Board
          </button>
          {onNewGame && (
            <button css={primaryButtonStyle} onClick={onNewGame}>
              Create New Game
            </button>
          )}
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
  backdrop-filter: blur(6px);
  padding: 20px;
  box-sizing: border-box;
`

const modalStyle = css`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border: 2px solid #ffd700;
  border-radius: 20px;
  max-width: 550px;
  width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  color: #fff;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(255, 215, 0, 0.2);
  
  /* Blockchain-style background pattern */
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.05) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(255, 215, 0, 0.03) 1px, transparent 1px);
  background-size: 40px 40px, 20px 20px;
`

const headerStyle = css`
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%);
  text-align: center;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
`

const victoryIconStyle = css`
  font-size: 3rem;
  margin-bottom: 8px;
  filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.8));
`

const victoryTitleStyle = css`
  font-size: 1.8rem;
  font-weight: bold;
  color: #ffd700;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
`

const gameIdStyle = css`
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 12px;
  font-family: monospace;
`

const winnerNameStyle = css`
  font-size: 1.4rem;
  color: #ffd700;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`

const winnerScoreStyle = css`
  font-size: 2rem;
  color: #ffd700;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
`

const playersStyle = css`
  padding: 20px;
  flex: 1;
  overflow-y: auto;
`

const sectionTitleStyle = css`
  color: #ffd700;
  margin: 0 0 16px 0;
  text-align: center;
  font-size: 1.2rem;
`

const playerListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const playerCardStyle = css`
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
`

const winnerCardStyle = css`
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.15) 100%);
  border-color: #ffd700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
`

const rankStyle = css`
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffd700;
  min-width: 32px;
`

const playerInfoStyle = css`
  flex: 1;
`

const playerAddressStyle = css`
  font-family: monospace;
  font-size: 0.95rem;
  color: #fff;
  margin-bottom: 4px;
`

const playerStatsStyle = css`
  display: flex;
  gap: 8px;
  font-size: 0.85rem;
  color: #ccc;
`

const scoreStyle = css`
  color: #ffd700;
  font-weight: bold;
`

const handStyle = css`
  color: #888;
`

const crownStyle = css`
  font-size: 1.5rem;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
`

const gameStatsStyle = css`
  padding: 0 20px 20px 20px;
`

const statsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
`

const statItemStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`

const statValueStyle = css`
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
`

const statLabelStyle = css`
  font-size: 0.8rem;
  color: #ccc;
`

const blockchainInfoStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 215, 0, 0.1);
  border-top: 1px solid rgba(255, 215, 0, 0.3);
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
`

const blockchainIconStyle = css`
  font-size: 1.2rem;
`

const blockchainTextStyle = css`
  font-size: 0.9rem;
  color: #ffd700;
  font-weight: 500;
`

const footerStyle = css`
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(255, 215, 0, 0.3);
`

const secondaryButtonStyle = css`
  flex: 1;
  background: transparent;
  color: #ffd700;
  border: 1px solid #ffd700;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    transform: translateY(-1px);
  }
`

const primaryButtonStyle = css`
  flex: 1;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }
` 