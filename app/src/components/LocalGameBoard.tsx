/** @jsxImportSource @emotion/react */
import React from 'react'
import { css } from '@emotion/react'
import { NumberTileId } from '../material/NumberTileId'
import { NumberTile } from './NumberTile'

interface TileItem {
  id: NumberTileId
  uniqueId: string
  location: {
    type: string
    x?: number
    y?: number
    player?: any
  }
}

interface LocalGameBoardProps {
  boardTiles: TileItem[]
  tilesPlacedThisTurn: TileItem[]
  selectedTile: TileItem | null
  onBoardClick: (x: number, y: number) => void
  onPlacedTileClick: (tile: TileItem) => void
  isValidPlacement: (x: number, y: number) => boolean
}

export function LocalGameBoard({ 
  boardTiles, 
  tilesPlacedThisTurn, 
  selectedTile, 
  onBoardClick, 
  onPlacedTileClick,
  isValidPlacement 
}: LocalGameBoardProps) {
  const boardSize = 15
  const centerX = 7
  const centerY = 7

  // Create position map for quick lookups
  const tilePositionMap = new Map<string, TileItem>()
  boardTiles.forEach(tile => {
    if (tile.location.x !== undefined && tile.location.y !== undefined) {
      const key = `${tile.location.x}-${tile.location.y}`
      tilePositionMap.set(key, tile)
    }
  })

  // Also map tiles placed this turn
  tilesPlacedThisTurn.forEach(tile => {
    if (tile.location.x !== undefined && tile.location.y !== undefined) {
      const key = `${tile.location.x}-${tile.location.y}`
      tilePositionMap.set(key, tile)
    }
  })

  const renderCell = (x: number, y: number) => {
    const tileKey = `${x}-${y}`
    const tile = tilePositionMap.get(tileKey)
    const isCenter = x === centerX && y === centerY
    const isPlacedThisTurn = tile && tilesPlacedThisTurn.some(t => t.uniqueId === tile.uniqueId)
    const isValidForPlacement = selectedTile && isValidPlacement(x, y)

    return (
      <div
        key={tileKey}
        css={[
          cellStyle,
          isCenter && centerCellStyle,
          isValidForPlacement && validPlacementStyle,
          !tile && selectedTile && clickableCellStyle
        ]}
        onClick={() => {
          if (tile) {
            onPlacedTileClick(tile)
          } else if (selectedTile) {
            onBoardClick(x, y)
          }
        }}
      >
        {tile ? (
          <div css={[tileWrapperStyle, isPlacedThisTurn && placedThisTurnStyle]}>
            <NumberTile
              tileId={tile.id}
              size="normal"
              isSelected={false}
              isPlaced={true}
              useTextures={true}
              onClick={() => onPlacedTileClick(tile)}
            />
          </div>
        ) : isCenter ? (
          <div css={centerMarkerStyle}>★</div>
        ) : null}
      </div>
    )
  }

  return (
    <div css={containerStyle}>
      <div css={boardStyle}>
        {Array.from({ length: boardSize }, (_, row) =>
          Array.from({ length: boardSize }, (_, col) => renderCell(col, row))
        ).flat()}
      </div>
    </div>
  )
}

// Styles
const containerStyle = css`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  overflow: hidden;
`

const boardStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(15, 1fr);
  gap: 2px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  width: min(70vh, 80vw);
  height: min(70vh, 80vw);
  max-width: 600px;
  max-height: 600px;
`

const cellStyle = css`
  background: rgba(139, 69, 19, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  aspect-ratio: 1;
  min-height: 20px;
  min-width: 20px;
  transition: all 0.2s ease;
`

const centerCellStyle = css`
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
`

const clickableCellStyle = css`
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.5);
    transform: scale(1.05);
  }
`

const validPlacementStyle = css`
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
`

const tileWrapperStyle = css`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const placedThisTurnStyle = css`
  animation: highlightPlacement 0.5s ease-out;
  
  @keyframes highlightPlacement {
    0% {
      transform: scale(1.2);
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
    }
    100% {
      transform: scale(1);
      box-shadow: none;
    }
  }
`

const centerMarkerStyle = css`
  color: #FFD700;
  font-size: clamp(8px, 2vw, 16px);
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
` 