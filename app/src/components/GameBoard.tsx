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

// Floating mystical orbs for ambiance
function FloatingMysticalOrbs() {
  const mysticalOrbs = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: Math.random() * 8,
    duration: 12 + Math.random() * 8,
    x: Math.random() * 100,
    size: 3 + Math.random() * 4,
    color: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#B8860B', '#F4A460'][i]
  }))

  return (
    <div css={orbContainerStyle}>
      {mysticalOrbs.map(orb => (
        <div
          key={orb.id}
          css={floatingOrbStyle({
            delay: orb.delay,
            duration: orb.duration,
            x: orb.x,
            size: orb.size,
            color: orb.color
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

// Zoom controls component
function ZoomControls({ 
  scale, 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  isZoomedIn, 
  isZoomedOut 
}: {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  isZoomedIn: boolean
  isZoomedOut: boolean
}) {
  return (
    <div css={zoomControlsStyle}>
      <div css={zoomButtonGroupStyle}>
        <button 
          css={zoomButtonStyle}
          onClick={onZoomIn}
          title="Zoom In"
        >
          🔍+
        </button>
        <button 
          css={zoomButtonStyle}
          onClick={onZoomOut}
          title="Zoom Out"  
        >
          🔍-
        </button>
        <button 
          css={resetButtonStyle}
          onClick={onReset}
          title="Reset View"
        >
          🎯
        </button>
      </div>
      <div css={zoomIndicatorStyle}>
        {Math.round(scale * 100)}%
      </div>
      {isZoomedIn && (
        <div css={zoomHintStyle}>
          ✨ Magical quilt expansion active!
        </div>
      )}
      {isZoomedOut && (
        <div css={zoomHintStyle}>
          🌟 Overview of the mystical loom
        </div>
      )}
    </div>
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
  // Simple viewport state without complex zoom/pan functionality
  const viewport = { scale: 1, offsetX: 0, offsetY: 0, isDragging: false }
  const actions = {
    handleMouseDown: () => {},
    handleMouseMove: () => {},
    handleMouseUp: () => {},
    handleWheel: () => {},
    handleTouchStart: () => {},
    handleTouchMove: () => {},
    handleTouchEnd: () => {},
    resetViewport: () => {},
    setScale: () => {},
    centerOn: () => {}
  }
  const getVisibleTileRange = () => ({ startX: 0, endX: 14, startY: 0, endY: 14, centerX: 7, centerY: 7 })
  const getTransformStyle = () => ({ transform: 'none' })
  const isZoomedIn = false
  const isZoomedOut = false

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
  
  // Get visible tile range for performance optimization
  const visibleRange = getVisibleTileRange()
  
  // Pre-calculate valid placements (only for visible tiles when zoomed)
  const validPlacements = useMemo(() => {
    if (!selectedTile) return new Set<string>()
    
    const valid = new Set<string>()
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    
    // Use visible range to limit calculations when zoomed in
    const shouldOptimize = viewport.scale > 1.2 && allTiles.length > 20
    
    if (shouldOptimize) {
      // Only check positions within visible range + buffer
      const buffer = 2
      const startX = Math.max(0, visibleRange.startX - buffer)
      const endX = Math.min(14, visibleRange.endX + buffer)
      const startY = Math.max(0, visibleRange.startY - buffer)
      const endY = Math.min(14, visibleRange.endY + buffer)
      
      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const posKey = `${x},${y}`
          if (!occupiedPositions.has(posKey) && isValidPlacement(x, y)) {
            valid.add(posKey)
          }
        }
      }
    } else {
      // Original logic for normal zoom levels
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
    }
    
    return valid
  }, [selectedTile, boardTiles, tilesPlacedThisTurn, isValidPlacement, occupiedPositions, viewport.scale, visibleRange])

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

  // Handle board cell clicks with coordinate transformation
  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    event.stopPropagation()
    
    const boardTile = boardTiles.find((tile: TileItem) => tile.location.x === col && tile.location.y === row)
    const isPlacedThisTurn = tilesPlacedThisTurn.some(tile => tile.location.x === col && tile.location.y === row)
    
    if (boardTile && isPlacedThisTurn) {
      onPlacedTileClick(boardTile)
    } else {
      onBoardClick(col, row)
    }
  }

  return (
          <div css={quiltingWorkspaceStyle}>
      <FloatingMysticalOrbs />
      <StitchingRipple x={lastStitchedPosition.x} y={lastStitchedPosition.y} trigger={stitchTrigger} />
      
      {/* Zoom Controls */}
      <ZoomControls
        scale={viewport.scale}
        onZoomIn={() => actions.setScale()}
        onZoomOut={() => actions.setScale()}
        onReset={actions.resetViewport}
        isZoomedIn={isZoomedIn}
        isZoomedOut={isZoomedOut}
      />
      
      {/* Pan/Zoom Instructions */}
      <div css={instructionsStyle}>
        🖱️ Shift+drag or middle-click+drag to pan • 🎡 Ctrl+scroll to zoom • 🎯 Click controls to reset
      </div>
      
      {/* Zoomable/Pannable Board Container */}
      <div 
        css={quiltGridContainerStyle}
        onMouseDown={actions.handleMouseDown}
        onMouseMove={actions.handleMouseMove}
        onMouseUp={actions.handleMouseUp}
        onWheel={actions.handleWheel}
        onTouchStart={actions.handleTouchStart}
        onTouchMove={actions.handleTouchMove}
        onTouchEnd={actions.handleTouchEnd}
      >
        <div 
          css={quiltGridStyle}
          style={getTransformStyle()}
        >
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
                  onClick={(e) => handleCellClick(row, col, e)}
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

// Simple container for the game board
const quiltingWorkspaceStyle = css`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
  }
`

// Mystical orb container for floating ambiance
const orbContainerStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`

// Individual floating mystical orbs
const floatingOrbStyle = ({ delay, duration, x, size, color }: { delay: number, duration: number, x: number, size: number, color: string }) => css`
  position: absolute;
  left: ${x}%;
  width: ${size}px;
  height: ${size}px;
  background: radial-gradient(circle, ${color} 0%, rgba(255,215,0,0.3) 30%, ${color} 100%);
  border-radius: 50%;
  animation: ${yarnFloat} ${duration}s linear infinite;
  animation-delay: ${delay}s;
  filter: blur(0.5px);
  box-shadow: 
    0 2px 4px rgba(139, 69, 19, 0.3),
    0 0 8px rgba(255, 215, 0, 0.4);
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

// Magical Quilt Loom - The actual summoning surface (zoomable/pannable)
const quiltGridStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 70px);
  grid-template-rows: repeat(15, 70px);
  gap: 2px;
  width: 100%;
  height: 100%;
  min-width: 1080px;
  min-height: 1080px;
  aspect-ratio: 1;
  position: relative;
  transform-origin: center center;
  
  /* Magical fabric quilt surface */
  background: 
    /* Woven fabric texture */
    repeating-linear-gradient(0deg, 
      rgba(75, 0, 130, 0.1) 0px, rgba(75, 0, 130, 0.1) 2px,
      rgba(138, 43, 226, 0.1) 2px, rgba(138, 43, 226, 0.1) 4px,
      transparent 4px, transparent 8px
    ),
    repeating-linear-gradient(90deg, 
      rgba(255, 215, 0, 0.1) 0px, rgba(255, 215, 0, 0.1) 2px,
      rgba(218, 165, 32, 0.1) 2px, rgba(218, 165, 32, 0.1) 4px,
      transparent 4px, transparent 8px
    ),
    /* Magical shimmer patterns */
    radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.2) 0%, transparent 20%),
    radial-gradient(circle at 75% 75%, rgba(138, 43, 226, 0.15) 0%, transparent 25%),
    radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.1) 0%, transparent 15%),
    /* Base magical fabric color */
    linear-gradient(135deg, 
      #2F1B69 0%,     /* Deep mystical purple */
      #4B0082 25%,    /* Indigo */
      #6A5ACD 50%,    /* Slate blue center */
      #4B0082 75%,    /* Indigo */
      #2F1B69 100%    /* Deep mystical purple */
    );
  
  background-size: 
    12px 12px,  /* Vertical weave */
    12px 12px,  /* Horizontal weave */
    80px 60px,  /* Shimmer 1 */
    100px 80px, /* Shimmer 2 */
    60px 40px,  /* Shimmer 3 */
    100% 100%;  /* Base gradient */
  
  /* Mystical yarn border - stitched edges */
  border-radius: 12px;
  padding: 12px;
  
  /* Magical stitched border */
  box-shadow: 
    /* Inner fabric edge */
    inset 0 0 0 2px rgba(255, 215, 0, 0.4),
    /* Stitching pattern */
    inset 0 0 0 4px rgba(138, 43, 226, 0.3),
    inset 0 0 0 6px rgba(255, 215, 0, 0.2),
    /* Outer magical glow */
    0 0 15px rgba(138, 43, 226, 0.4),
    0 0 30px rgba(255, 215, 0, 0.2),
    /* Quilt shadow */
    0 8px 20px rgba(0, 0, 0, 0.3);
  
  /* Subtle magical sparkle animation */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 10%),
      radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.1) 0%, transparent 10%),
      radial-gradient(circle at 40% 40%, rgba(138, 43, 226, 0.1) 0%, transparent 10%);
    background-size: 50px 50px, 70px 70px, 60px 60px;
    animation: ${gentleFloat} 8s ease-in-out infinite;
    pointer-events: none;
    z-index: 1;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(15, 50px);
    grid-template-rows: repeat(15, 50px);
    gap: 1px;
    min-width: 765px;
    min-height: 765px;
    padding: 10px;
    box-shadow: 
      inset 0 0 0 2px rgba(255, 215, 0, 0.4),
      inset 0 0 0 4px rgba(138, 43, 226, 0.3),
      0 0 10px rgba(138, 43, 226, 0.3),
      0 6px 15px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(15, 40px);
    grid-template-rows: repeat(15, 40px);
    gap: 1px;
    min-width: 615px;
    min-height: 615px;
    padding: 8px;
    box-shadow: 
      inset 0 0 0 2px rgba(255, 215, 0, 0.4),
      0 0 8px rgba(138, 43, 226, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.3);
  }
`

// Individual fabric patch slot on the magical quilt - Where rune threads are woven
const patchSlotStyle = css`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 6px; /* Soft fabric patch slot */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="%23FFD700" stroke="%23654321" stroke-width="2"/><path d="M6 6 L14 14 M14 6 L6 14" stroke="%23654321" stroke-width="2" stroke-linecap="round"/></svg>') 10 10, pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  
  /* Magical fabric weave texture */
  background-image: 
    /* Mystical thread patterns */
    repeating-linear-gradient(45deg, 
      rgba(255, 215, 0, 0.1) 0px, 
      rgba(255, 215, 0, 0.1) 1px, 
      transparent 1px, 
      transparent 6px),
    repeating-linear-gradient(-45deg, 
      rgba(138, 43, 226, 0.08) 0px, 
      rgba(138, 43, 226, 0.08) 1px, 
      transparent 1px, 
      transparent 6px);
  background-size: 10px 10px, 10px 10px;
  
  /* Soft fabric slot shadow */
  box-shadow: 
    inset 0 1px 2px rgba(75, 0, 130, 0.2),
    inset 0 -1px 2px rgba(255, 215, 0, 0.1),
    0 1px 2px rgba(138, 43, 226, 0.1);
  
  &:hover {
    background: rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.6);
    transform: scale(1.02);
    box-shadow: 
      0 0 12px rgba(255, 215, 0, 0.3),
      0 0 20px rgba(138, 43, 226, 0.2),
      inset 0 1px 3px rgba(255, 215, 0, 0.2);
  }
`

// Center pin for starting the quilt
const centerPinStyle = css`
  background: linear-gradient(135deg, #FFD700 0%, #DAA520 50%, #B8860B 100%);
  border: 2px solid #8B4513;
  animation: ${gentleFloat} 4s ease-in-out infinite;
  box-shadow: 0 4px 8px rgba(139, 69, 19, 0.3);
`

// Empty fabric patch slot - ready for magical thread weaving
const emptySlotStyle = css`
  background: rgba(75, 0, 130, 0.1);
  border-color: rgba(138, 43, 226, 0.2);
  
  /* Subtle empty patch indication */
  box-shadow: 
    inset 0 1px 2px rgba(75, 0, 130, 0.2),
    inset 0 -1px 2px rgba(255, 215, 0, 0.05);
`

// Summoning spot where threads can be woven
const sewingSpotStyle = (scale: number) => css`
  background: rgba(255, 215, 0, ${0.15 + (scale * 0.1)});
  border: ${Math.max(2, scale * 3)}px solid rgba(255, 215, 0, ${0.4 + (scale * 0.2)});
  position: relative;
  
  /* Mystical energy ready indicator */
  box-shadow: 0 0 ${Math.max(8, scale * 15)}px rgba(255, 215, 0, ${0.3 + (scale * 0.2)});
  
  &:hover {
    background: rgba(255, 215, 0, 0.3);
    border-color: #FFD700;
    transform: scale(${1.05 + (scale * 0.03)});
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.6);
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

// Grid container - enhanced for zoom/pan functionality
const quiltGridContainerStyle = css`
  flex: 1;
  max-width: min(90vh, 90vw);
  max-height: min(90vh, 90vw);
  aspect-ratio: 1;
  position: relative;
  cursor: default;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(135deg, 
    rgba(160, 82, 45, 0.1) 0%, 
    rgba(218, 165, 32, 0.05) 50%, 
    rgba(139, 69, 19, 0.1) 100%);
  
  /* Show grab cursor when shift is held */
  &:hover {
    cursor: crosshair;
  }
  
  /* Magical border like hemp rope */
  border: 4px solid;
  border-image: repeating-linear-gradient(
    45deg,
    rgba(139, 69, 19, 0.8) 0px,
    rgba(139, 69, 19, 0.8) 8px,
    rgba(218, 165, 32, 0.6) 8px,
    rgba(218, 165, 32, 0.6) 16px
  ) 4;
  
  box-shadow: 
    0 8px 16px rgba(139, 69, 19, 0.3),
    inset 0 2px 6px rgba(255, 215, 0, 0.2),
    0 0 20px rgba(255, 215, 0, 0.1);
    
  @media (max-width: 768px) {
    max-width: min(80vh, 95vw);
    max-height: min(80vh, 95vw);
    border-width: 3px;
  }
`

// Zoom controls styles
const zoomControlsStyle = css`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`

const zoomButtonGroupStyle = css`
  display: flex;
  gap: 8px;
`

const zoomButtonStyle = css`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  color: #8B4513;
  transition: color 0.3s;

  &:hover {
    color: #FFD700;
  }
`

const resetButtonStyle = css`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  color: #8B4513;
  transition: color 0.3s;

  &:hover {
    color: #FFD700;
  }
`

const zoomIndicatorStyle = css`
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  font-weight: bold;
`

const zoomHintStyle = css`
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #8B4513;
`

// Pan/Zoom instructions
const instructionsStyle = css`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  color: #8B4513;
  text-align: center;
`