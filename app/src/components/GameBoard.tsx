/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { useMemo, useEffect, useState } from 'react'
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

// Gentle floating yarn balls for ambiance
function FloatingYarnBalls() {
  const yarnBalls = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: Math.random() * 8,
    duration: 12 + Math.random() * 8,
    x: Math.random() * 100,
    size: 3 + Math.random() * 4,
    color: ['#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#FFE135', '#FF7F7F'][i]
  }))

  return (
    <div css={yarnContainerStyle}>
      {yarnBalls.map(ball => (
        <div
          key={ball.id}
          css={floatingYarnStyle({
            delay: ball.delay,
            duration: ball.duration,
            x: ball.x,
            size: ball.size,
            color: ball.color
          })}
        />
      ))}
    </div>
  )
}

// Stitching ripple when patches are sewn together
function StitchingRipple({ x, y, trigger }: { x: number, y: number, trigger: number }) {
  if (trigger === 0) return null
  
  return (
    <div
      css={stitchingRippleStyle}
      style={{
        left: `${(x / 15) * 100}%`,
        top: `${(y / 15) * 100}%`,
      }}
    />
  )
}

export function GameBoard({
  boardTiles,
  tilesPlacedThisTurn,
  selectedTile,
  onBoardClick,
  onPlacedTileClick,
  isValidPlacement
}: GameBoardProps) {
  const [stitchTrigger, setStitchTrigger] = useState(0)
  const [lastStitchedPosition, setLastStitchedPosition] = useState({ x: 0, y: 0 })
  
  // Track when new patches are sewn in
  useEffect(() => {
    if (tilesPlacedThisTurn.length > 0) {
      const lastTile = tilesPlacedThisTurn[tilesPlacedThisTurn.length - 1]
      if (lastTile.location.x !== undefined && lastTile.location.y !== undefined) {
        setLastStitchedPosition({ x: lastTile.location.x, y: lastTile.location.y })
        setStitchTrigger(prev => prev + 1)
      }
    }
  }, [tilesPlacedThisTurn.length])

  // Pre-compute occupied positions for fast lookup
  const occupiedPositions = useMemo(() => {
    const occupied = new Set<string>()
    boardTiles.forEach(tile => occupied.add(`${tile.location.x},${tile.location.y}`))
    tilesPlacedThisTurn.forEach(tile => occupied.add(`${tile.location.x},${tile.location.y}`))
    return occupied
  }, [boardTiles, tilesPlacedThisTurn])
  
  // Calculate quilting connections - which patches are adjacent
  const quiltConnections = useMemo(() => {
    const connections = new Set<string>()
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    
    allTiles.forEach(tile => {
      const x = tile.location.x || 0
      const y = tile.location.y || 0
      
      // Check for adjacent tiles to create stitching connections
      const adjacent = [
        { dx: 1, dy: 0, direction: 'right' },
        { dx: 0, dy: 1, direction: 'down' }
      ]
      
      adjacent.forEach(({ dx, dy, direction }) => {
        const adjX = x + dx
        const adjY = y + dy
        const hasAdjacentTile = allTiles.some(t => t.location.x === adjX && t.location.y === adjY)
        
        if (hasAdjacentTile) {
          connections.add(`${x},${y}-${direction}`)
        }
      })
    })
    
    return connections
  }, [boardTiles, tilesPlacedThisTurn])
  
  // Calculate proximity-based scaling for sewing spots
  const getSewingScale = useMemo(() => {
    return (x: number, y: number) => {
      const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
      if (allTiles.length === 0) return 1.0
      
      let minDistance = Infinity
      allTiles.forEach(tile => {
        const tileX = tile.location.x || 0
        const tileY = tile.location.y || 0
        const distance = Math.sqrt(Math.pow(x - tileX, 2) + Math.pow(y - tileY, 2))
        minDistance = Math.min(minDistance, distance)
      })
      
      const scale = Math.max(0.8, Math.min(1.0, 1.1 - (minDistance * 0.04)))
      return scale
    }
  }, [boardTiles, tilesPlacedThisTurn])
  
  // Pre-calculate valid placements
  const validPlacements = useMemo(() => {
    if (!selectedTile) return new Set<string>()
    
    const valid = new Set<string>()
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    
    if (allTiles.length > 50) {
      const checkPositions = new Set<string>()
      allTiles.slice(-20).forEach(tile => {
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
      
      checkPositions.forEach(pos => {
        const [x, y] = pos.split(',').map(Number)
        if (!occupiedPositions.has(pos) && isValidPlacement(x, y)) {
          valid.add(pos)
        }
      })
    } else {
      const checkPositions = new Set<string>()
      
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
      
      if (allTiles.length === 0) {
        for (let x = 6; x <= 8; x++) {
          for (let y = 6; y <= 8; y++) {
            checkPositions.add(`${x},${y}`)
          }
        }
      }
      
      checkPositions.forEach(pos => {
        const [x, y] = pos.split(',').map(Number)
        if (!occupiedPositions.has(pos) && isValidPlacement(x, y)) {
          valid.add(pos)
        }
      })
    }
    
    return valid
  }, [selectedTile, boardTiles, tilesPlacedThisTurn, isValidPlacement, occupiedPositions])

  // Calculate sewing positions (same as magical positions but renamed)
  const sewingPositions = useMemo(() => {
    if (!selectedTile) return new Set<string>()
    
    const sewing = new Set<string>()
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    
    allTiles.forEach(tile => {
      const x = tile.location.x || 0
      const y = tile.location.y || 0
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue
          const newX = x + dx
          const newY = y + dy
          if (newX >= 0 && newX < 15 && newY >= 0 && newY < 15) {
            sewing.add(`${newX},${newY}`)
          }
        }
      }
    })
    
    if (allTiles.length === 0) {
      for (let x = 6; x <= 8; x++) {
        for (let y = 6; y <= 8; y++) {
          sewing.add(`${x},${y}`)
        }
      }
    }
    
    return sewing
  }, [selectedTile, boardTiles, tilesPlacedThisTurn])

  return (
    <div css={quiltingWorkspaceStyle}>
      <FloatingYarnBalls />
      <StitchingRipple x={lastStitchedPosition.x} y={lastStitchedPosition.y} trigger={stitchTrigger} />
      
      <div css={quiltGridContainerStyle}>
        <div css={quiltGridStyle}>
          {Array.from({ length: 15 }, (_, row) =>
            Array.from({ length: 15 }, (_, col) => {
              const posKey = `${col},${row}`
              const boardTile = boardTiles.find((tile: TileItem) => tile.location.x === col && tile.location.y === row)
              const isCenterPin = row === 7 && col === 7
              const isPlacedThisTurn = tilesPlacedThisTurn.some(tile => tile.location.x === col && tile.location.y === row)
              const isOccupied = occupiedPositions.has(posKey)
              const canSewHere = sewingPositions.has(posKey)
              
              const canPlacePatch = selectedTile && !isOccupied && canSewHere && validPlacements.has(posKey)
              const blockedSewing = selectedTile && !isOccupied && canSewHere && !validPlacements.has(posKey)
              
              const sewingScale = canPlacePatch ? getSewingScale(col, row) : 0
              
              // Check for stitching connections
              const hasRightStitch = quiltConnections.has(`${col},${row}-right`)
              const hasDownStitch = quiltConnections.has(`${col},${row}-down`)
              
              return (
                <div 
                  key={`${row}-${col}`} 
                  css={css`
                    ${patchSlotStyle}
                    ${isCenterPin ? centerPinStyle : ''}
                    ${!boardTile ? emptySlotStyle : ''}
                    ${canPlacePatch ? sewingSpotStyle(sewingScale) : ''}
                    ${blockedSewing ? blockedSewingStyle : ''}
                    ${isPlacedThisTurn ? newPatchGlowStyle : ''}
                    ${isPlacedThisTurn ? clickablePatchSlotStyle : ''}
                  `}
                  onClick={(e) => {
                    if (boardTile && isPlacedThisTurn) {
                      onPlacedTileClick(boardTile)
                    } else {
                      onBoardClick(col, row)
                    }
                    e.stopPropagation()
                  }}
                >
                  {boardTile && (
                    <div css={patchHolderStyle}>
                      <NumberTile 
                        tileId={boardTile.id} 
                        size="large"
                        isPlaced={!isPlacedThisTurn}
                      />
                      {isPlacedThisTurn && (
                        <div css={returnIconStyle}>🧶</div>
                      )}
                      {isPlacedThisTurn && <div css={newPatchStitchingStyle} key={`stitch-${stitchTrigger}`} />}
                    </div>
                  )}
                  
                  {/* Stitching connections to adjacent patches */}
                  {hasRightStitch && <div css={rightStitchStyle} />}
                  {hasDownStitch && <div css={downStitchStyle} />}
                  
                  {!boardTile && isCenterPin && <div css={centerPinCrystalStyle}>📍</div>}
                  {canPlacePatch && (
                    <div css={sewingIndicatorStyle(sewingScale)}>🧷</div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// Cozy knitting animations
const gentleFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(1deg); }
`

const yarnFloat = keyframes`
  0% { transform: translateY(100vh) translateX(0px) rotate(0deg); opacity: 0; }
  10% { opacity: 0.4; }
  90% { opacity: 0.4; }
  100% { transform: translateY(-20px) translateX(30px) rotate(180deg); opacity: 0; }
`

const stitchingExpand = keyframes`
  0% { 
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.8;
  }
  50% {
    opacity: 0.6;
  }
  100% { 
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
`

const newPatchStitch = keyframes`
  0% { 
    border-color: transparent;
    transform: scale(0.8);
  }
  50% {
    border-color: rgba(139, 69, 19, 0.8);
    transform: scale(1.1);
  }
  100% { 
    border-color: rgba(139, 69, 19, 0.6);
    transform: scale(1);
  }
`

const simpleGlow = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(218, 165, 32, 0.4); }
  50% { box-shadow: 0 0 20px rgba(218, 165, 32, 0.7); }
`

// Quilting workspace container
const quiltingWorkspaceStyle = css`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: 
    linear-gradient(135deg, 
      #F5E6D3 0%,   /* Cream fabric */
      #E8D5C1 25%,  /* Light tan */
      #F0E2CE 50%,  /* Warm beige */
      #E6D4C1 75%,  /* Soft brown */
      #F5E6D3 100%  /* Back to cream */
    );
  border-radius: 15px;
  padding: 15px;
  overflow: auto;
  scrollbar-gutter: stable;
  position: relative;
  
  /* Fabric texture pattern */
  background-image: 
    repeating-linear-gradient(45deg, 
      rgba(139, 69, 19, 0.02) 0px, 
      rgba(139, 69, 19, 0.02) 2px, 
      transparent 2px, 
      transparent 20px),
    repeating-linear-gradient(-45deg, 
      rgba(139, 69, 19, 0.02) 0px, 
      rgba(139, 69, 19, 0.02) 2px, 
      transparent 2px, 
      transparent 20px);
  
  /* Cozy quilting workshop styling */
  box-shadow: 
    0 20px 40px rgba(139, 69, 19, 0.15),
    0 8px 16px rgba(139, 69, 19, 0.1),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
  
  border: 3px solid rgba(139, 69, 19, 0.2);
  
  @media (max-width: 768px) {
    padding: 12px;
    border-radius: 12px;
    border-width: 2px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    border-radius: 10px;
    border-width: 2px;
  }
`

// Yarn ball container for floating ambiance
const yarnContainerStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`

// Individual floating yarn balls
const floatingYarnStyle = ({ delay, duration, x, size, color }: { delay: number, duration: number, x: number, size: number, color: string }) => css`
  position: absolute;
  left: ${x}%;
  width: ${size}px;
  height: ${size}px;
  background: radial-gradient(circle, ${color} 0%, rgba(255,255,255,0.3) 30%, ${color} 100%);
  border-radius: 50%;
  animation: ${yarnFloat} ${duration}s linear infinite;
  animation-delay: ${delay}s;
  filter: blur(0.5px);
  box-shadow: 0 2px 4px rgba(139, 69, 19, 0.2);
`

// Stitching ripple effect when patches are sewn
const stitchingRippleStyle = css`
  position: absolute;
  width: 24px;
  height: 24px;
  border: 3px dashed rgba(139, 69, 19, 0.8);
  border-radius: 50%;
  background: rgba(218, 165, 32, 0.2);
  animation: ${stitchingExpand} 1.2s ease-out;
  pointer-events: none;
  z-index: 5;
`

// Quilt grid layout
const quiltGridStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(15, 1fr);
  gap: 2px;
  width: 700px;
  height: 700px;
  aspect-ratio: 1;
  margin: auto;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    gap: 1px;
    width: 600px;
    height: 600px;
  }
  
  @media (max-width: 480px) {
    gap: 1px;
    width: 500px;
    height: 500px;
  }
`

// Individual patch slot
const patchSlotStyle = css`
  background: rgba(245, 230, 211, 0.6);
  border: 1px solid rgba(139, 69, 19, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  /* Fabric-like texture */
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 6px 6px;
  
  &:hover {
    background: rgba(245, 230, 211, 0.8);
    transform: scale(1.02);
    border-color: rgba(139, 69, 19, 0.4);
  }
`

// Center pin for starting the quilt
const centerPinStyle = css`
  background: linear-gradient(135deg, #FFD700 0%, #DAA520 50%, #B8860B 100%);
  border: 2px solid #8B4513;
  animation: ${gentleFloat} 4s ease-in-out infinite;
  box-shadow: 0 4px 8px rgba(139, 69, 19, 0.3);
`

// Empty patch slot
const emptySlotStyle = css`
  background: rgba(245, 230, 211, 0.3);
  border-color: rgba(139, 69, 19, 0.15);
`

// Sewing spot where patches can be attached
const sewingSpotStyle = (scale: number) => css`
  background: rgba(218, 165, 32, ${0.15 + (scale * 0.1)});
  border: ${Math.max(2, scale * 3)}px solid rgba(218, 165, 32, ${0.4 + (scale * 0.2)});
  position: relative;
  
  /* Sewing machine ready indicator */
  box-shadow: 0 0 ${Math.max(8, scale * 15)}px rgba(218, 165, 32, ${0.2 + (scale * 0.15)});
  
  &:hover {
    background: rgba(218, 165, 32, 0.25);
    border-color: #DAA520;
    transform: scale(${1.05 + (scale * 0.03)});
    box-shadow: 0 0 20px rgba(218, 165, 32, 0.5);
  }
`

// Blocked sewing spot
const blockedSewingStyle = css`
  background: rgba(205, 92, 92, 0.15);
  border: 2px solid rgba(205, 92, 92, 0.4);
  cursor: not-allowed;
  box-shadow: 0 0 8px rgba(205, 92, 92, 0.3);
  
  &:hover {
    background: rgba(205, 92, 92, 0.25);
    border-color: rgba(205, 92, 92, 0.6);
    box-shadow: 0 0 12px rgba(205, 92, 92, 0.4);
  }
`

// New patch glow effect
const newPatchGlowStyle = css`
  animation: ${simpleGlow} 2s ease-in-out infinite;
  border-color: #DAA520 !important;
`

// Clickable patch slot style
const clickablePatchSlotStyle = css`
  cursor: pointer;
  
  &:hover {
    transform: scale(1.08) !important;
    box-shadow: 0 0 20px rgba(218, 165, 32, 0.6) !important;
  }
`

// Patch holder wrapper
const patchHolderStyle = css`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

// Return yarn indicator
const returnIconStyle = css`
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  background: rgba(218, 165, 32, 0.9);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
  border: 1px solid rgba(139, 69, 19, 0.6);
  animation: ${simpleGlow} 2s infinite;
`

// New patch stitching effect
const newPatchStitchingStyle = css`
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px dashed rgba(139, 69, 19, 0.6);
  border-radius: 8px;
  background: rgba(218, 165, 32, 0.1);
  animation: ${newPatchStitch} 1.5s ease-out;
  pointer-events: none;
  z-index: 8;
`

// Stitching connections between adjacent patches
const rightStitchStyle = css`
  position: absolute;
  right: -4px;
  top: 50%;
  width: 8px;
  height: 80%;
  background: repeating-linear-gradient(
    0deg,
    rgba(139, 69, 19, 0.85) 0px,
    rgba(139, 69, 19, 0.85) 5px,
    transparent 5px,
    transparent 10px
  );
  border-radius: 4px;
  box-shadow: 0 0 2px rgba(139, 69, 19, 0.6);
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 3;
`

const downStitchStyle = css`
  position: absolute;
  bottom: -4px;
  left: 50%;
  width: 80%;
  height: 8px;
  background: repeating-linear-gradient(
    90deg,
    rgba(139, 69, 19, 0.85) 0px,
    rgba(139, 69, 19, 0.85) 5px,
    transparent 5px,
    transparent 10px
  );
  border-radius: 4px;
  box-shadow: 0 0 2px rgba(139, 69, 19, 0.6);
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 3;
`

// Center pin crystal
const centerPinCrystalStyle = css`
  font-size: 16px;
  animation: ${gentleFloat} 4s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(139, 69, 19, 0.4));
`

// Sewing indicator
const sewingIndicatorStyle = (scale: number) => css`
  position: absolute;
  font-size: ${Math.max(12, scale * 18)}px;
  color: #8B4513;
  text-shadow: 0 0 4px rgba(218, 165, 32, 0.8);
  pointer-events: none;
  animation: ${gentleFloat} 2s ease-in-out infinite;
  z-index: 6;
  filter: drop-shadow(0 2px 4px rgba(139, 69, 19, 0.3));
  
  @media (max-width: 768px) {
    font-size: ${Math.max(16, scale * 22)}px;
  }
`

// Grid container - simplified for better performance
const quiltGridContainerStyle = css`
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`