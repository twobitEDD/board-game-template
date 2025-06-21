import { css } from '@emotion/react'

interface GameStatusProps {
  gameMessage: string
  tilesPlacedThisTurn: Array<any>
  turnScore: number
}

export function GameStatus({
  gameMessage,
  tilesPlacedThisTurn,
  turnScore
}: GameStatusProps) {
  return (
    <>
      {/* Game Message */}
      <div css={gameMessageStyle}>
        {gameMessage}
      </div>
      
      {/* Turn Status */}
      {tilesPlacedThisTurn.length > 0 && (
        <div css={turnStatusStyle}>
          <span>Tiles placed this turn: {tilesPlacedThisTurn.length}</span>
          <span>Potential turn score: {turnScore}</span>
        </div>
      )}
    </>
  )
}

const gameMessageStyle = css`
  padding: 10px 15px;
  background: rgba(33, 150, 243, 0.2);
  border: 1px solid rgba(33, 150, 243, 0.4);
  border-radius: 8px;
  color: white;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const turnStatusStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.4);
  border-radius: 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
` 