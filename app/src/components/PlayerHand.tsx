import { css } from '@emotion/react'
import { NumberTile } from './NumberTile'
import { TileItem } from '../types/GameTypes'

interface PlayerHandProps {
  handTiles: TileItem[]
  selectedTile: TileItem | null
  tilesPlacedThisTurn: TileItem[]
  turnScore: number
  onTileSelect: (tile: TileItem) => void
  onEndTurn: () => void
  onUndoTurn: () => void
  onSkipTurn: () => void
}

export function PlayerHand({
  handTiles,
  selectedTile,
  tilesPlacedThisTurn,
  turnScore,
  onTileSelect,
  onEndTurn,
  onUndoTurn,
  onSkipTurn
}: PlayerHandProps) {
  return (
    <div css={handStyle}>
      <div css={handHeaderStyle}>
        <div css={handLabelStyle}>YOUR HAND</div>
        <div css={actionButtonsStyle}>
          {tilesPlacedThisTurn.length > 0 && (
            <button css={endTurnButtonStyle} onClick={onEndTurn}>
              End Turn ({turnScore} pts)
            </button>
          )}
          {tilesPlacedThisTurn.length > 0 && (
            <button css={undoTurnButtonStyle} onClick={onUndoTurn}>
              Undo Turn
            </button>
          )}
          <button css={skipTurnButtonStyle} onClick={onSkipTurn}>
            Skip Turn
          </button>
        </div>
      </div>
      <div css={handTilesStyle}>
        {handTiles && handTiles.length > 0 ? (
          handTiles.map((tile: TileItem, index: number) => (
            <div 
              key={`hand-tile-${index}-${tile.id}`} 
              css={handTileWrapperStyle}
              className={selectedTile?.uniqueId === tile.uniqueId ? 'selected' : ''}
              onClick={() => onTileSelect(tile)}
            >
              <NumberTile 
                tileId={tile.id} 
                size="normal"
                isSelected={selectedTile?.uniqueId === tile.uniqueId}
                onClick={() => onTileSelect(tile)}
              />
            </div>
          ))
        ) : (
          <div css={emptyHandStyle}>
            {handTiles ? 'No tiles in hand' : 'Loading tiles...'}
          </div>
        )}
      </div>
    </div>
  )
}

const handStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 15px;
  min-height: 120px;
  flex: 0 0 auto;
  margin-top: auto;
`

const handHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`

const handLabelStyle = css`
  color: white;
  font-size: 12px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
`

const actionButtonsStyle = css`
  display: flex;
  gap: 10px;
`

const endTurnButtonStyle = css`
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const undoTurnButtonStyle = css`
  background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(156, 39, 176, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const skipTurnButtonStyle = css`
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #F57C00 0%, #FF9800 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const handTilesStyle = css`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
`

const handTileWrapperStyle = css`
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &.selected {
    transform: translateY(-4px);
    filter: drop-shadow(0 4px 8px rgba(76, 175, 80, 0.5));
  }
`

const emptyHandStyle = css`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-style: italic;
  padding: 20px;
` 