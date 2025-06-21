import { css } from '@emotion/react'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'

interface GameHeaderProps {
  gameConfig: {
    playerCount: number
    playerNames: string[]
  }
  playerName?: string
  currentPlayer: string
  currentScore: number
  turnNumber: number
  drawPileLength: number
  handTiles: Array<{ id: NumberTileId }>
  selectedTile: { id: NumberTileId } | null
  getTileValue: (tileId: NumberTileId) => number
}

export function GameHeader({
  gameConfig,
  playerName,
  currentPlayer,
  currentScore,
  turnNumber,
  drawPileLength,
  handTiles,
  selectedTile,
  getTileValue
}: GameHeaderProps) {
  return (
    <div css={headerStyle}>
      <h2 css={titleStyle}>🎮 FIVES</h2>
      <div css={playerInfoStyle}>
        <span>
          {gameConfig.playerCount === 1 
            ? `Player: ${playerName || 'Unknown'}` 
            : `Current Turn: ${currentPlayer}`
          }
        </span>
        <span>Score: {currentScore}</span>
        <span>Turn: {turnNumber}</span>
        <span>Draw Pile: {drawPileLength}</span>
        <span>Hand: {handTiles.length} {handTiles.length > 0 ? `(${handTiles.map(t => getTileValue(t.id)).join(',')})` : ''}</span>
        {selectedTile && <span>Selected: {getTileValue(selectedTile.id)}</span>}
      </div>
    </div>
  )
}

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
`

const titleStyle = css`
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
`

const playerInfoStyle = css`
  display: flex;
  gap: 20px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 600;
` 