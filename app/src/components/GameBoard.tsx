/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useMemo } from 'react'
import { NumberTile } from './NumberTile'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'

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

interface GameBoardProps {
  boardTiles: TileItem[]
  tilesPlacedThisTurn: TileItem[]
  selectedTile: TileItem | null
  onBoardClick: (x: number, y: number) => void
  onPlacedTileClick: (tile: TileItem) => void
  isValidPlacement: (x: number, y: number) => boolean
}

export function GameBoard({
  boardTiles,
  tilesPlacedThisTurn,
  selectedTile,
  onBoardClick,
  onPlacedTileClick,
  isValidPlacement
}: GameBoardProps) {
  // Pre-compute occupied positions and valid placements for fast lookup
  const occupiedPositions = useMemo(() => {
    const occupied = new Set<string>()
    boardTiles.forEach(tile => occupied.add(`${tile.location.x},${tile.location.y}`))
    tilesPlacedThisTurn.forEach(tile => occupied.add(`${tile.location.x},${tile.location.y}`))
    return occupied
  }, [boardTiles, tilesPlacedThisTurn])
  
  // Pre-calculate valid placements with performance optimization
  const validPlacements = useMemo(() => {
    if (!selectedTile) return new Set<string>()
    
    const valid = new Set<string>()
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    
    // Performance optimization: limit validation checks for large boards
    if (allTiles.length > 50) {
      // For large boards, only check positions very close to placed tiles
      const checkPositions = new Set<string>()
      allTiles.slice(-20).forEach(tile => { // Only check last 20 tiles
        const x = tile.location.x || 0
        const y = tile.location.y || 0
        // Only check immediate neighbors
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue
            const newX = x + dx
            const newY = y + dy
            if (newX >= 0 && newX < 15 && newY >= 0 && newY < 15) {
              checkPositions.add(`${newX},${newY}`)
            }
          }
        }
      })
      
      checkPositions.forEach(pos => {
        const [x, y] = pos.split(',').map(Number)
        if (!occupiedPositions.has(pos) && isValidPlacement(x, y)) {
          valid.add(pos)
        }
      })
    } else {
      // For smaller boards, use full validation
      const checkPositions = new Set<string>()
      
      // Add positions adjacent to existing tiles
      allTiles.forEach(tile => {
        const x = tile.location.x || 0
        const y = tile.location.y || 0
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue
            const newX = x + dx
            const newY = y + dy
            if (newX >= 0 && newX < 15 && newY >= 0 && newY < 15) {
              checkPositions.add(`${newX},${newY}`)
            }
          }
        }
      })
      
      // If no tiles on board, check center and adjacent positions
      if (allTiles.length === 0) {
        for (let x = 6; x <= 8; x++) {
          for (let y = 6; y <= 8; y++) {
            checkPositions.add(`${x},${y}`)
          }
        }
      }
      
      // Check validity for each potential position
      checkPositions.forEach(pos => {
        const [x, y] = pos.split(',').map(Number)
        if (!occupiedPositions.has(pos) && isValidPlacement(x, y)) {
          valid.add(pos)
        }
      })
    }
    
    return valid
  }, [selectedTile, boardTiles, tilesPlacedThisTurn, isValidPlacement, occupiedPositions])

  return (
    <div css={boardContainerStyle}>
      <div css={gridStyle}>
        {Array.from({ length: 15 }, (_, row) =>
          Array.from({ length: 15 }, (_, col) => {
            const posKey = `${col},${row}`
            const boardTile = boardTiles.find((tile: TileItem) => tile.location.x === col && tile.location.y === row)
            const isCenter = row === 7 && col === 7
            const isPlacedThisTurn = tilesPlacedThisTurn.some(tile => tile.location.x === col && tile.location.y === row)
            
            // Use pre-calculated validity for better performance
            const canPlace = selectedTile && validPlacements.has(posKey)
            const invalidPlace = selectedTile && !occupiedPositions.has(posKey) && !canPlace
            
            // Show potential placement zones when tile is selected
            const isPotentialPlacement = selectedTile && !occupiedPositions.has(posKey)
            
            return (
              <div 
                key={`${row}-${col}`} 
                css={css`
                  ${cellStyle}
                  ${isCenter ? centerCellStyle : ''}
                  ${!boardTile ? emptyCellStyle : ''}
                  ${canPlace ? validPlacementStyle : ''}
                  ${invalidPlace ? invalidPlacementStyle : ''}
                  ${isPlacedThisTurn ? placedThisTurnStyle : ''}
                  ${isPotentialPlacement && !canPlace && !invalidPlace ? potentialPlacementStyle : ''}
                  ${isPlacedThisTurn ? clickableThisTurnStyle : ''}
                `}
                onClick={() => {
                  if (boardTile && isPlacedThisTurn) {
                    onPlacedTileClick(boardTile)
                  } else {
                    onBoardClick(col, row)
                  }
                }}
              >
                {boardTile && (
                  <div css={tileWrapperStyle}>
                    <NumberTile 
                      tileId={boardTile.id} 
                      size="large"
                    />
                    {isPlacedThisTurn && (
                      <div css={clickableIndicatorStyle}>↩️</div>
                    )}
                  </div>
                )}
                {!boardTile && isCenter && <div css={centerStarStyle}>⭐</div>}
                {canPlace && <div css={placementHintStyle}>+</div>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const boardContainerStyle = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 15px;
  overflow: auto;
  min-height: 0;
  
  /* Ensure smooth scrolling */
  scroll-behavior: smooth;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`

const gridStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(15, 1fr);
  gap: 2px;
  width: 100%;
  min-width: 450px;
  max-width: 600px;
  aspect-ratio: 1;
  margin: auto;
  
  /* Ensure the grid is always properly sized */
  @media (max-width: 768px) {
    min-width: 350px;
    max-width: 450px;
  }
`

const cellStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
`

const centerCellStyle = css`
  background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
  border: 2px solid #fff;
  box-shadow: 0 0 15px rgba(254, 202, 87, 0.6);
`

const emptyCellStyle = css`
  background: rgba(255, 255, 255, 0.05);
`

const validPlacementStyle = css`
  background: rgba(76, 175, 80, 0.3);
  border-color: #4CAF50;
`

const invalidPlacementStyle = css`
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.4);
  cursor: not-allowed;
`

const potentialPlacementStyle = css`
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
`

const placedThisTurnStyle = css`
  background: rgba(76, 175, 80, 0.4);
  border: 2px solid #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
`

const centerStarStyle = css`
  font-size: 16px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
`

const placementHintStyle = css`
  position: absolute;
  font-size: 16px;
  color: white;
  opacity: 0.8;
  pointer-events: none;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
`

const clickableThisTurnStyle = css`
  cursor: pointer;
  
  &:hover {
    background: rgba(76, 175, 80, 0.6) !important;
    transform: scale(1.1);
    border: 2px solid #4CAF50 !important;
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
  }
`

const tileWrapperStyle = css`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const clickableIndicatorStyle = css`
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 12px;
  background: rgba(76, 175, 80, 0.9);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.2); opacity: 1; }
  }
`

 