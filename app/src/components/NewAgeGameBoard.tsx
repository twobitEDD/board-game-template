/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState, useMemo } from 'react'
import type { GameConfig } from '../GameDisplay'
import { NewAgeTile } from './NewAgeTile'
import { NewAgePlayerPanel } from './NewAgePlayerPanel'
import { NewAgeGameHeader } from './NewAgeGameHeader'
import { NewAgeEndGameModal } from './NewAgeEndGameModal'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'

// Proper tile structure from original game
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

export interface GameState {
  boardTiles: TileItem[]
  playerHands: TileItem[][]
  playerDrawPiles: NumberTileId[][]
  currentPlayer: number
  scores: number[]
  turnNumber: number
  gameMessage: string
  selectedTile: TileItem | null
  gameEnded: boolean
  winner: number | null
  tilesPlacedThisTurn: TileItem[]
  turnScore: number
}

interface NewAgeGameBoardProps {
  gameConfig: GameConfig
  onBackToSetup: () => void
}

export function NewAgeGameBoard({ gameConfig, onBackToSetup }: NewAgeGameBoardProps) {
  
  // Create initial draw pile with proper distribution (from original)
  const createInitialDrawPile = (): NumberTileId[] => {
    const pile: NumberTileId[] = []
    const totalTilesNeeded = gameConfig.playerCount * gameConfig.tilesPerPlayer + 20
    
    // Original distribution
    const originalDistribution = {
      [NumberTileId.Zero]: 2,
      [NumberTileId.One]: 4,
      [NumberTileId.Two]: 4,
      [NumberTileId.Three]: 4,
      [NumberTileId.Four]: 4,
      [NumberTileId.Five]: 4,
      [NumberTileId.Six]: 4,
      [NumberTileId.Seven]: 4,
      [NumberTileId.Eight]: 4,
      [NumberTileId.Nine]: 2
    }
    
    const scaleFactor = totalTilesNeeded / 36
    const scaledDistribution = Object.fromEntries(
      Object.entries(originalDistribution).map(([tileId, originalCount]) => [
        tileId,
        Math.max(1, Math.round(originalCount * scaleFactor))
      ])
    ) as Record<NumberTileId, number>
    
    Object.entries(scaledDistribution).forEach(([tileIdStr, count]) => {
      const tileId = parseInt(tileIdStr) as NumberTileId
      for (let i = 0; i < count; i++) {
        pile.push(tileId)
      }
    })
    
    // Shuffle
    for (let i = pile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pile[i], pile[j]] = [pile[j], pile[i]]
    }
    
    return pile
  }

  function initializeGame(config: GameConfig): GameState {
    const initialPile = createInitialDrawPile()
    
    // Create starting board with center tile
    const boardTiles: TileItem[] = [
      { id: NumberTileId.Five, uniqueId: 'center-tile', location: { type: 'Board', x: 7, y: 7 } }
    ]
    
    // Create player hands (5 tiles each from original logic)
    const playerHands: TileItem[][] = []
    const playerDrawPiles: NumberTileId[][] = []
    let tileIndex = 0
    
    for (let playerIndex = 0; playerIndex < config.playerCount; playerIndex++) {
      // Each player starts with 5 tiles in hand
      const playerHand = initialPile.slice(tileIndex, tileIndex + 5).map((tileId: NumberTileId, index: number) => ({
        id: tileId,
        uniqueId: `hand-p${playerIndex}-${Date.now()}-${index}`,
        location: { type: 'Hand', player: `player${playerIndex}` }
      }))
      playerHands.push(playerHand)
      tileIndex += 5
      
      // Remaining tiles for this player go to their draw pile
      const remainingTiles = config.tilesPerPlayer - 5
      const playerPile = initialPile.slice(tileIndex, tileIndex + remainingTiles)
      playerDrawPiles.push(playerPile)
      tileIndex += remainingTiles
    }

    return {
      boardTiles,
      playerHands,
      playerDrawPiles,
      currentPlayer: 0,
      scores: Array(config.playerCount).fill(0),
      turnNumber: 1,
      gameMessage: `${config.playerNames[0]}'s turn - place tiles so sequences sum to multiples of 5`,
      selectedTile: null,
      gameEnded: false,
      winner: null,
      tilesPlacedThisTurn: [],
      turnScore: 0
    }
  }

  // CONVERT TO WORKING PATTERN: Separate state variables like FivesGameBoard
  const initialGameData = useMemo(() => initializeGame(gameConfig), [gameConfig])
  
  const [boardTiles, setBoardTiles] = useState<TileItem[]>(initialGameData.boardTiles)
  const [playerHands, setPlayerHands] = useState<TileItem[][]>(initialGameData.playerHands)
  const [playerDrawPiles, setPlayerDrawPiles] = useState<NumberTileId[][]>(initialGameData.playerDrawPiles)
  const [currentPlayer, setCurrentPlayer] = useState(initialGameData.currentPlayer)
  const [scores, setScores] = useState<number[]>(initialGameData.scores)
  const [turnNumber, setTurnNumber] = useState(initialGameData.turnNumber)
  const [gameMessage, setGameMessage] = useState(initialGameData.gameMessage)
  const [selectedTile, setSelectedTile] = useState<TileItem | null>(null)
  const [gameEnded, setGameEnded] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)
  const [tilesPlacedThisTurn, setTilesPlacedThisTurn] = useState<TileItem[]>([])
  const [turnScore, setTurnScore] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showEndGameModal, setShowEndGameModal] = useState(false)
  const [gameStartTime] = useState(Date.now())

  // Helper function to get tile numeric value
  const getTileValue = (tileId: NumberTileId): number => {
    switch (tileId) {
      case NumberTileId.Zero: return 0
      case NumberTileId.One: return 1
      case NumberTileId.Two: return 2
      case NumberTileId.Three: return 3
      case NumberTileId.Four: return 4
      case NumberTileId.Five: return 5
      case NumberTileId.Six: return 6
      case NumberTileId.Seven: return 7
      case NumberTileId.Eight: return 8
      case NumberTileId.Nine: return 9
      default: return 0
    }
  }

  // Current player's hand (derived from playerHands) - EXACTLY like FivesGameBoard
  const handTiles = playerHands[currentPlayer] || []
  const currentPlayerId = `player${currentPlayer}`
  
  // Current player's hand (derived from playerHands) - EXACTLY like FivesGameBoard

  // Helper function to update current player's hand - EXACTLY like FivesGameBoard
  const updateCurrentPlayerHand = (updater: (prevHand: TileItem[]) => TileItem[]) => {
    setPlayerHands(prev => {
      const newHands = [...prev]
      newHands[currentPlayer] = updater(newHands[currentPlayer] || [])
      return newHands
    })
  }

  // Draw tiles from current player's pile - EXACTLY like FivesGameBoard
  const drawTilesFromPile = (count: number): NumberTileId[] => {
    const currentPlayerPile = playerDrawPiles[currentPlayer] || []
    const drawnTiles = currentPlayerPile.slice(0, count)
    
    // Update the current player's draw pile
    setPlayerDrawPiles(prev => {
      const newPiles = [...prev]
      newPiles[currentPlayer] = newPiles[currentPlayer].slice(count)
      return newPiles
    })
    
    return drawnTiles
  }

  // Validate turn placement (from original)
  const validateTurnPlacement = (placedTiles: TileItem[], existingTiles: TileItem[]) => {
    if (placedTiles.length === 0) {
      return { isValid: false, error: "No tiles placed" }
    }

    // First move rules
    if (existingTiles.length <= 1) { // Only center tile
      const centerOrAdjacent = placedTiles.some(tile => {
        const x = tile.location.x || 0
        const y = tile.location.y || 0
        return (x === 7 && y === 7) || 
               (Math.abs(x - 7) <= 1 && Math.abs(y - 7) <= 1 && (x === 7 || y === 7))
      })
      if (!centerOrAdjacent) {
        return { isValid: false, error: "First tile must be on or adjacent to center" }
      }
    } else if (!gameConfig.allowIslands) {
      // Check adjacency - at least one placed tile must be adjacent to existing tiles (unless islands are allowed)
      console.log('🏝️ validateTurnPlacement - allowIslands:', gameConfig.allowIslands)
      const existingPositions = new Set<string>()
      existingTiles.forEach(tile => {
        const x = tile.location.x || 0
        const y = tile.location.y || 0
        existingPositions.add(`${x-1},${y}`)
        existingPositions.add(`${x+1},${y}`)
        existingPositions.add(`${x},${y-1}`)
        existingPositions.add(`${x},${y+1}`)
      })
      
      const hasAdjacency = placedTiles.some(placedTile => {
        const px = placedTile.location.x || 0
        const py = placedTile.location.y || 0
        return existingPositions.has(`${px},${py}`)
      })
      
      if (!hasAdjacency) {
        console.log('🚫 validateTurnPlacement blocked by adjacency check')
        return { isValid: false, error: "Tiles must be adjacent to existing tiles on board" }
      }
    } else {
      console.log('✅ validateTurnPlacement - Islands allowed - skipping adjacency check')
    }

    // Check turn contiguity - all placed tiles must form a contiguous line
    if (placedTiles.length > 1) {
      const xValues = placedTiles.map(tile => tile.location.x || 0)
      const yValues = placedTiles.map(tile => tile.location.y || 0)
      
      const allSameRow = yValues.every(y => y === yValues[0])
      const allSameCol = xValues.every(x => x === xValues[0])
      
      if (!allSameRow && !allSameCol) {
        return { isValid: false, error: "All tiles in a turn must be in the same row OR column" }
      }
      
      // Check for contiguity, considering existing tiles that might fill gaps
      if (allSameRow) {
        const y = yValues[0]
        const sortedX = [...xValues].sort((a, b) => a - b)
        
        // Check if there are existing tiles that could fill any gaps
        for (let i = 1; i < sortedX.length; i++) {
          const gap = sortedX[i] - sortedX[i-1]
          if (gap > 1) {
            // Check if existing tiles fill the gap
            let gapFilled = true
            for (let fillX = sortedX[i-1] + 1; fillX < sortedX[i]; fillX++) {
              const hasExistingTile = existingTiles.some(tile => 
                tile.location.x === fillX && tile.location.y === y
              )
              if (!hasExistingTile) {
                gapFilled = false
                break
              }
            }
            if (!gapFilled) {
              return { isValid: false, error: "Tiles must form a contiguous line with no gaps" }
            }
          }
        }
      } else if (allSameCol) {
        const x = xValues[0]
        const sortedY = [...yValues].sort((a, b) => a - b)
        
        // Check if there are existing tiles that could fill any gaps
        for (let i = 1; i < sortedY.length; i++) {
          const gap = sortedY[i] - sortedY[i-1]
          if (gap > 1) {
            // Check if existing tiles fill the gap
            let gapFilled = true
            for (let fillY = sortedY[i-1] + 1; fillY < sortedY[i]; fillY++) {
              const hasExistingTile = existingTiles.some(tile => 
                tile.location.x === x && tile.location.y === fillY
              )
              if (!hasExistingTile) {
                gapFilled = false
                break
              }
            }
            if (!gapFilled) {
              return { isValid: false, error: "Tiles must form a contiguous line with no gaps" }
            }
          }
        }
      }
    }

    // Check 5-tile sequence limits - all tiles must respect the 5-tile maximum
    const allTiles = [...existingTiles, ...placedTiles]
    const positionMap = new Map<string, TileItem>()
    allTiles.forEach(tile => {
      if (tile.location.x !== undefined && tile.location.y !== undefined) {
        positionMap.set(`${tile.location.x},${tile.location.y}`, tile)
      }
    })
    
    const checkedRows = new Set<number>()
    const checkedCols = new Set<number>()
    
    for (const tile of allTiles) {
      const x = tile.location.x || 0
      const y = tile.location.y || 0
      
      // Check horizontal sequence length (only once per row)
      if (!checkedRows.has(y)) {
        checkedRows.add(y)
        let leftX = x
        while (leftX > 0 && positionMap.has(`${leftX - 1},${y}`)) {
          leftX--
        }
        let horizontalCount = 0
        for (let currentX = leftX; currentX < 15; currentX++) {
          if (positionMap.has(`${currentX},${y}`)) {
            horizontalCount++
          } else {
            break
          }
        }
        
        if (horizontalCount > 5) {
          return { isValid: false, error: `Horizontal sequence too long (${horizontalCount} tiles, max 5)` }
        }
      }
      
      // Check vertical sequence length (only once per column)
      if (!checkedCols.has(x)) {
        checkedCols.add(x)
        let topY = y
        while (topY > 0 && positionMap.has(`${x},${topY - 1}`)) {
          topY--
        }
        let verticalCount = 0
        for (let currentY = topY; currentY < 15; currentY++) {
          if (positionMap.has(`${x},${currentY}`)) {
            verticalCount++
          } else {
            break
          }
        }
        
        if (verticalCount > 5) {
          return { isValid: false, error: `Vertical sequence too long (${verticalCount} tiles, max 5)` }
        }
      }
    }

    return { isValid: true, error: null }
  }

  // Get horizontal sequence (from original)
  const getHorizontalSequence = (startX: number, y: number, positionMap: Map<string, TileItem>) => {
    let leftX = startX
    while (leftX > 0 && positionMap.has(`${leftX - 1},${y}`)) {
      leftX--
    }
    
    const tiles: TileItem[] = []
    for (let x = leftX; x < 15 && tiles.length < 5; x++) {
      const tile = positionMap.get(`${x},${y}`)
      if (tile) {
        tiles.push(tile)
      } else {
        break
      }
    }
    
    if (tiles.length <= 1) return null
    
    const sum = tiles.reduce((total, tile) => total + getTileValue(tile.id), 0)
    return { tiles, sum }
  }

  // Get vertical sequence (from original)
  const getVerticalSequence = (x: number, startY: number, positionMap: Map<string, TileItem>) => {
    let topY = startY
    while (topY > 0 && positionMap.has(`${x},${topY - 1}`)) {
      topY--
    }
    
    const tiles: TileItem[] = []
    for (let y = topY; y < 15 && tiles.length < 5; y++) {
      const tile = positionMap.get(`${x},${y}`)
      if (tile) {
        tiles.push(tile)
      } else {
        break
      }
    }
    
    if (tiles.length <= 1) return null
    
    const sum = tiles.reduce((total, tile) => total + getTileValue(tile.id), 0)
    return { tiles, sum }
  }

  // Calculate turn sequences (from original)
  const calculateTurnSequences = useMemo(() => {
    return (allTiles: TileItem[], placedTiles: TileItem[]) => {
      const sequences: Array<{ tiles: TileItem[]; sum: number }> = []
      const seenSequences = new Set<string>()
      
      if (placedTiles.length === 0) return sequences
      
      // Create position lookup
      const positionMap = new Map<string, TileItem>()
      allTiles.forEach(tile => {
        if (tile.location.x !== undefined && tile.location.y !== undefined) {
          positionMap.set(`${tile.location.x},${tile.location.y}`, tile)
        }
      })
      
      // Create placed tiles position set
      const placedPositions = new Set<string>()
      placedTiles.forEach(tile => {
        if (tile.location.x !== undefined && tile.location.y !== undefined) {
          placedPositions.add(`${tile.location.x},${tile.location.y}`)
        }
      })
      
      // For each tile placed this turn, check sequences
      for (const placedTile of placedTiles) {
        if (placedTile.location.x === undefined || placedTile.location.y === undefined) continue
        
        const x = placedTile.location.x
        const y = placedTile.location.y
        
        // Check horizontal sequence
        const horizontalKey = `h-${y}`
        if (!seenSequences.has(horizontalKey)) {
          const horizontalSeq = getHorizontalSequence(x, y, positionMap)
          if (horizontalSeq && horizontalSeq.tiles.length > 1 && 
              horizontalSeq.sum % 5 === 0 && horizontalSeq.sum > 0 &&
              horizontalSeq.tiles.some(tile => placedPositions.has(`${tile.location.x},${tile.location.y}`))) {
            sequences.push(horizontalSeq)
            seenSequences.add(horizontalKey)
          }
        }
        
        // Check vertical sequence
        const verticalKey = `v-${x}`
        if (!seenSequences.has(verticalKey)) {
          const verticalSeq = getVerticalSequence(x, y, positionMap)
          if (verticalSeq && verticalSeq.tiles.length > 1 && 
              verticalSeq.sum % 5 === 0 && verticalSeq.sum > 0 &&
              verticalSeq.tiles.some(tile => placedPositions.has(`${tile.location.x},${tile.location.y}`))) {
            sequences.push(verticalSeq)
            seenSequences.add(verticalKey)
          }
        }
      }
      
      return sequences
    }
  }, [])

  // Get all sequences at a position (needed for validation)
  const getSequencesAtPosition = (x: number, y: number, tiles: TileItem[]) => {
    const sequences: Array<{ tiles: TileItem[]; sum: number }> = []
    
    // Create position lookup
    const positionMap = new Map<string, TileItem>()
    tiles.forEach(tile => {
      if (tile.location.x !== undefined && tile.location.y !== undefined) {
        positionMap.set(`${tile.location.x},${tile.location.y}`, tile)
      }
    })
    
    // Check horizontal sequence
    const horizontalSeq = getHorizontalSequence(x, y, positionMap)
    if (horizontalSeq && horizontalSeq.tiles.length > 1) {
      sequences.push(horizontalSeq)
    }
    
    // Check vertical sequence
    const verticalSeq = getVerticalSequence(x, y, positionMap)
    if (verticalSeq && verticalSeq.tiles.length > 1) {
      sequences.push(verticalSeq)
    }
    
    return sequences
  }

  // Quick validation for immediate feedback during placement (from original)
  const quickValidatePlacement = (x: number, y: number, tilesPlacedThisTurn: TileItem[], allTiles: TileItem[]) => {
    // Bounds check
    if (x < 0 || x >= 15 || y < 0 || y >= 15) {
      return { isValid: false, error: "Outside board boundaries" }
    }

    // First move rules
    if (allTiles.length <= 1) { // Only center tile
      const isCenterOrAdjacent = (x === 7 && y === 7) || 
        (Math.abs(x - 7) <= 1 && Math.abs(y - 7) <= 1 && (x === 7 || y === 7))
      if (!isCenterOrAdjacent) {
        return { isValid: false, error: "First tile must be on or adjacent to center" }
      }
      return { isValid: true, error: null }
    }

    // Check adjacency to existing tiles (unless islands are allowed)
    console.log('🏝️ Island check - allowIslands:', gameConfig.allowIslands)
    if (!gameConfig.allowIslands) {
      const isAdjacent = allTiles.some(tile => {
        const tx = tile.location.x || 0
        const ty = tile.location.y || 0
        return (Math.abs(tx - x) === 1 && ty === y) || (tx === x && Math.abs(ty - y) === 1)
      })
      if (!isAdjacent) {
        console.log('🚫 Blocked by adjacency check')
        return { isValid: false, error: "Must be adjacent to existing tiles" }
      }
    } else {
      console.log('✅ Islands allowed - skipping adjacency check')
    }

    // Check contiguity within the turn
    if (tilesPlacedThisTurn.length > 0) {
      const xValues = tilesPlacedThisTurn.map(tile => tile.location.x || 0).concat([x])
      const yValues = tilesPlacedThisTurn.map(tile => tile.location.y || 0).concat([y])
      
      const allSameRow = yValues.every(y => y === yValues[0])
      const allSameCol = xValues.every(x => x === xValues[0])
      
      if (!allSameRow && !allSameCol) {
        return { isValid: false, error: "All tiles in a turn must be in the same row OR column" }
      }
      
      // Check for contiguity, considering existing tiles that might fill gaps
      if (allSameRow) {
        const y = yValues[0]
        const sortedX = [...xValues].sort((a, b) => a - b)
        
        // Check if there are existing tiles that could fill any gaps
        for (let i = 1; i < sortedX.length; i++) {
          const gap = sortedX[i] - sortedX[i-1]
          if (gap > 1) {
            // Check if existing tiles fill the gap
            let gapFilled = true
            for (let fillX = sortedX[i-1] + 1; fillX < sortedX[i]; fillX++) {
              const hasExistingTile = allTiles.some(tile => 
                tile.location.x === fillX && tile.location.y === y
              )
              if (!hasExistingTile) {
                gapFilled = false
                break
              }
            }
            if (!gapFilled) {
              return { isValid: false, error: "Tiles must form a contiguous line with no gaps" }
            }
          }
        }
      } else if (allSameCol) {
        const x = xValues[0]
        const sortedY = [...yValues].sort((a, b) => a - b)
        
        // Check if there are existing tiles that could fill any gaps
        for (let i = 1; i < sortedY.length; i++) {
          const gap = sortedY[i] - sortedY[i-1]
          if (gap > 1) {
            // Check if existing tiles fill the gap
            let gapFilled = true
            for (let fillY = sortedY[i-1] + 1; fillY < sortedY[i]; fillY++) {
              const hasExistingTile = allTiles.some(tile => 
                tile.location.x === x && tile.location.y === fillY
              )
              if (!hasExistingTile) {
                gapFilled = false
                break
              }
            }
            if (!gapFilled) {
              return { isValid: false, error: "Tiles must form a contiguous line with no gaps" }
            }
          }
        }
      }
    }

    // Check 5-tile sequence limits - prevent placing tiles that would create sequences longer than 5
    const allTilesWithNew = [...allTiles, { 
      id: NumberTileId.One, // Dummy tile for position checking
      uniqueId: 'temp', 
      location: { type: 'Board', x, y } 
    }]
    
    // Create position map for sequence checking
    const positionMap = new Map<string, TileItem>()
    allTilesWithNew.forEach(tile => {
      if (tile.location.x !== undefined && tile.location.y !== undefined) {
        positionMap.set(`${tile.location.x},${tile.location.y}`, tile)
      }
    })
    
    // Check horizontal sequence length at this position
    let leftX = x
    while (leftX > 0 && positionMap.has(`${leftX - 1},${y}`)) {
      leftX--
    }
    let horizontalCount = 0
    for (let currentX = leftX; currentX < 15; currentX++) {
      if (positionMap.has(`${currentX},${y}`)) {
        horizontalCount++
      } else {
        break
      }
    }
    
    if (horizontalCount > 5) {
      return { isValid: false, error: `Would create horizontal sequence of ${horizontalCount} tiles (max 5)` }
    }
    
    // Check vertical sequence length at this position
    let topY = y
    while (topY > 0 && positionMap.has(`${x},${topY - 1}`)) {
      topY--
    }
    let verticalCount = 0
    for (let currentY = topY; currentY < 15; currentY++) {
      if (positionMap.has(`${x},${currentY}`)) {
        verticalCount++
      } else {
        break
      }
    }
    
    if (verticalCount > 5) {
      return { isValid: false, error: `Would create vertical sequence of ${verticalCount} tiles (max 5)` }
    }

    return { isValid: true, error: null }
  }

  const handleTileSelect = (tile: TileItem) => {
    setSelectedTile(tile)
    setGameMessage(`Selected ${getTileValue(tile.id)} tile. Click on the board to place it.`)
  }

  // Find and return all tiles that remain connected to the main body after a removal
  const getConnectedTiles = (allTiles: TileItem[]) => {
    if (allTiles.length <= 1) return allTiles // Single tile or empty board
    
    // Find the center tile (if it exists) or use any tile as starting point
    const centerTile = allTiles.find(tile => tile.location.x === 7 && tile.location.y === 7)
    const startTile = centerTile || allTiles[0]
    
    if (!startTile) return [] // No tiles left
    
    // Create position map for O(1) lookup
    const positionMap = new Map<string, TileItem>()
    allTiles.forEach(tile => {
      if (tile.location.x !== undefined && tile.location.y !== undefined) {
        positionMap.set(`${tile.location.x},${tile.location.y}`, tile)
      }
    })
    
    // BFS to find all connected tiles
    const visited = new Set<string>()
    const connectedTiles: TileItem[] = []
    const queue = [startTile]
    const startKey = `${startTile.location.x},${startTile.location.y}`
    visited.add(startKey)
    connectedTiles.push(startTile)
    
    while (queue.length > 0) {
      const current = queue.shift()!
      const x = current.location.x || 0
      const y = current.location.y || 0
      
      // Check all 4 adjacent positions
      const adjacent = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      ]
      
      for (const adj of adjacent) {
        const adjKey = `${adj.x},${adj.y}`
        if (!visited.has(adjKey) && positionMap.has(adjKey)) {
          visited.add(adjKey)
          const connectedTile = positionMap.get(adjKey)!
          connectedTiles.push(connectedTile)
          queue.push(connectedTile)
        }
      }
    }
    
    return connectedTiles
  }

  const handlePlacedTileClick = (tile: TileItem) => {
    // Only allow clicking on tiles placed this turn
    const isPlacedThisTurn = tilesPlacedThisTurn.some(placedTile => 
      placedTile.location.x === tile.location.x && 
      placedTile.location.y === tile.location.y
    )
    
    if (!isPlacedThisTurn) return
    
    // Calculate what would remain after removing the clicked tile
    const newBoardTiles = boardTiles.filter(boardTile => 
      !(boardTile.location.x === tile.location.x && boardTile.location.y === tile.location.y)
    )
    
    const newTilesPlacedThisTurn = tilesPlacedThisTurn.filter(placedTile => 
      !(placedTile.location.x === tile.location.x && placedTile.location.y === tile.location.y)
    )
    
    const allRemainingTiles = [...newBoardTiles, ...newTilesPlacedThisTurn]
    
    // Find all tiles that remain connected to the main body
    const connectedTiles = getConnectedTiles(allRemainingTiles)
    const connectedPositions = new Set(
      connectedTiles.map(t => `${t.location.x},${t.location.y}`)
    )
    
    // Separate connected tiles into board tiles and this turn's tiles
    const finalBoardTiles = newBoardTiles.filter(boardTile =>
      connectedPositions.has(`${boardTile.location.x},${boardTile.location.y}`)
    )
    
    const finalTilesPlacedThisTurn = newTilesPlacedThisTurn.filter(placedTile =>
      connectedPositions.has(`${placedTile.location.x},${placedTile.location.y}`)
    )
    
    // Find tiles that were removed due to being islands
    const removedBoardTiles = newBoardTiles.filter(boardTile =>
      !connectedPositions.has(`${boardTile.location.x},${boardTile.location.y}`)
    )
    
    const removedPlacedTiles = newTilesPlacedThisTurn.filter(placedTile =>
      !connectedPositions.has(`${placedTile.location.x},${placedTile.location.y}`)
    )
    
    // Update game state with only connected tiles
    setBoardTiles(finalBoardTiles)
    setTilesPlacedThisTurn(finalTilesPlacedThisTurn)
    
    // Return the clicked tile to hand
    const returnedTile = {
      ...tile,
      location: { type: 'Hand', player: currentPlayerId }
    }
    
    // Return all removed tiles to hand (clicked tile + any islands)
    const allRemovedTiles = [returnedTile, ...removedBoardTiles, ...removedPlacedTiles].map(t => ({
      ...t,
      location: { type: 'Hand', player: currentPlayerId }
    }))
    
    updateCurrentPlayerHand(prev => [...prev, ...allRemovedTiles])
    
    // Calculate new turn score
    const finalAllTiles = [...finalBoardTiles, ...finalTilesPlacedThisTurn]
    const turnSequences = calculateTurnSequences(finalAllTiles, finalTilesPlacedThisTurn)
    const newTurnScore = turnSequences.reduce((total, seq) => total + (seq.sum * 10), 0)
    setTurnScore(newTurnScore)
    
    // Create feedback message
    const totalRemoved = allRemovedTiles.length
    let message = `Returned ${getTileValue(tile.id)} tile to hand.`
    
    if (totalRemoved > 1) {
      message += ` Also removed ${totalRemoved - 1} island tile(s) that became disconnected.`
    }
    
    if (finalTilesPlacedThisTurn.length > 0) {
      message += ` Click green tiles to return them or end turn when ready.`
    } else {
      message += ` End turn when ready.`
    }
    
    setGameMessage(message)
  }

  const handleBoardClick = (x: number, y: number) => {
    if (!selectedTile) {
      setGameMessage("Please select a tile from your hand first!")
      return
    }
    
    // Check if position is occupied
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    const isOccupied = allTiles.some(tile => tile.location.x === x && tile.location.y === y)
    
    if (isOccupied) {
      setGameMessage("🚫 Cell already occupied!")
      return
    }

    // Check basic placement rules for immediate feedback
    const validationResult = quickValidatePlacement(x, y, tilesPlacedThisTurn, allTiles)
    if (!validationResult.isValid) {
      setGameMessage(`🚫 ${validationResult.error}`)
      return
    }

    const newTile: TileItem = {
      id: selectedTile.id,
      uniqueId: selectedTile.uniqueId,
      location: { type: 'Board', x, y }
    }
    
    const newTilesPlacedThisTurn = [...tilesPlacedThisTurn, newTile]
    const newBoardTiles = [...boardTiles, newTile]
    
    // Calculate turn score with real-time feedback
    const turnSequences = calculateTurnSequences(newBoardTiles, newTilesPlacedThisTurn)
    const newTurnScore = turnSequences.reduce((total, seq) => total + (seq.sum * 10), 0)
    
    // Generate real-time feedback message
    let feedbackMessage = `🔄 ${newTilesPlacedThisTurn.length} tile(s) placed. `
    
    if (turnSequences.length > 0) {
      const sequenceText = turnSequences.map(seq => {
        const tileValues = seq.tiles.map(t => getTileValue(t.id)).join('+')
        return `${tileValues} = ${seq.sum}`
      }).join(', ')
      feedbackMessage += `Preview: ${sequenceText}. Potential score: ${newTurnScore} pts. ✅ Ready to end turn!`
    } else {
      // Check for invalid sequences
      let hasInvalidSequence = false
      for (const placedTile of newTilesPlacedThisTurn) {
        if (placedTile.location.x === undefined || placedTile.location.y === undefined) continue
        const sequences = getSequencesAtPosition(placedTile.location.x, placedTile.location.y, newBoardTiles)
        for (const seq of sequences) {
          const hasNewTile = seq.tiles.some(tile => 
            newTilesPlacedThisTurn.some(placed => 
              placed.location.x === tile.location.x && placed.location.y === tile.location.y
            )
          )
          if (hasNewTile && (seq.sum % 5 !== 0 || seq.sum === 0)) {
            hasInvalidSequence = true
            break
          }
        }
        if (hasInvalidSequence) break
      }
      
      if (hasInvalidSequence) {
        feedbackMessage += `❌ Current sequences don't sum to multiples of 5. Place more tiles or undo.`
      } else {
        feedbackMessage += `🔄 Need sequences that sum to multiples of 5 to score. Click green tiles to return them.`
      }
    }
    
    setBoardTiles(newBoardTiles)
    setTilesPlacedThisTurn(newTilesPlacedThisTurn)
    setTurnScore(newTurnScore)
    setSelectedTile(null)
    setGameMessage(feedbackMessage)
    
    // Remove tile from hand
    console.log('🎯 REMOVING TILE FROM HAND:', getTileValue(selectedTile!.id))
    console.log('  - Hand size BEFORE removal:', handTiles.length)
    updateCurrentPlayerHand(prev => {
      const newHand = prev.filter(tile => tile.uniqueId !== selectedTile!.uniqueId)
      console.log('  - Hand size AFTER removal:', newHand.length)
      return newHand
    })
  }

  const handleEndTurn = () => {
    if (tilesPlacedThisTurn.length === 0) {
      setGameMessage("You must place at least one tile before ending your turn!")
      return
    }

    // Comprehensive validation only when ending turn
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    
    // 1. Check basic placement rules (adjacency, contiguity)
    const validationResult = validateTurnPlacement(tilesPlacedThisTurn, boardTiles)
    if (!validationResult.isValid) {
      setGameMessage(`🚫 Invalid turn: ${validationResult.error}`)
      return
    }

    // 2. Check that all sequences sum to multiples of 5
    let hasValidSequence = false
    let hasInvalidSequence = false

    for (const placedTile of tilesPlacedThisTurn) {
      if (placedTile.location.x === undefined || placedTile.location.y === undefined) continue
      
      const sequences = getSequencesAtPosition(placedTile.location.x, placedTile.location.y, allTiles)
      
      for (const seq of sequences) {
        const hasNewTile = seq.tiles.some(tile => 
          tilesPlacedThisTurn.some(placed => 
            placed.location.x === tile.location.x && placed.location.y === tile.location.y
          )
        )
        
        if (hasNewTile) {
          if (seq.sum % 5 === 0 && seq.sum > 0) {
            hasValidSequence = true
          } else {
            hasInvalidSequence = true
          }
        }
      }
    }

    if (!hasValidSequence) {
      setGameMessage("🚫 Invalid turn: No valid sequences found. All sequences must sum to multiples of 5.")
      return
    }

    if (hasInvalidSequence) {
      setGameMessage("🚫 Invalid turn: Some sequences don't sum to multiples of 5. Fix or use Undo Turn.")
      return
    }
    
    // Calculate final score for this turn
    const turnSequences = calculateTurnSequences(boardTiles, tilesPlacedThisTurn)
    const finalTurnScore = turnSequences.reduce((total, seq) => total + (seq.sum * 10), 0)
    
    // Add turn score to current player's total score
    const newScores = [...scores]
    newScores[currentPlayer] += finalTurnScore
    setScores(newScores)

    // EXACT COPY FROM WORKING FIVESGAMEBOARD.TSX:
    // Draw new tiles to maintain exactly 5 tiles in hand (BEFORE state updates)
    const playerPile = playerDrawPiles[currentPlayer] || []
    const tilesNeeded = Math.min(5 - handTiles.length, playerPile.length)
    if (tilesNeeded > 0) {
      const newTiles = drawTilesFromPile(tilesNeeded)
      const newHandTiles = newTiles.map((tileId, index) => ({
        id: tileId,
        uniqueId: `refill-${Date.now()}-${index}`,
        location: { type: 'Hand', player: currentPlayerId }
      }))
      updateCurrentPlayerHand(prev => [...prev, ...newHandTiles])
    }
    
    // Reset turn state (AFTER refill)
    setTilesPlacedThisTurn([])
    setTurnScore(0)
    setSelectedTile(null)
    
    // Check for game end conditions (like original Fives rules)
    // Game ends when all players have empty hands AND empty draw piles
    const allPlayersOutOfTiles = Array.from({ length: gameConfig.playerCount }, (_, i) => {
      const playerHand = i === currentPlayer ? handTiles : (playerHands[i] || [])
      const playerPile = playerDrawPiles[i] || []
      return playerHand.length === 0 && playerPile.length === 0
    }).every(isEmpty => isEmpty)
    
    const isGameEnd = allPlayersOutOfTiles || turnNumber >= 200 // Safety limit

    // Switch to next player in multiplayer (from original logic)
    let nextPlayer = currentPlayer
    let newTurnNumber = turnNumber
    
    if (!isGameEnd && gameConfig.playerCount > 1) {
      nextPlayer = (currentPlayer + 1) % gameConfig.playerCount
      if (nextPlayer === 0) {
        newTurnNumber = turnNumber + 1 // Complete round
      }
    } else if (!isGameEnd && gameConfig.playerCount === 1) {
      newTurnNumber = turnNumber + 1
    }
    
    setCurrentPlayer(nextPlayer)
    setTurnNumber(newTurnNumber)

    // Show turn summary with scoring breakdown
    const sequenceText = turnSequences.map(seq => {
      const tileValues = seq.tiles.map(t => getTileValue(t.id)).join('+')
      return `${tileValues} = ${seq.sum} (×10 = ${seq.sum * 10})`
    }).join(', ')
    
    let completionMessage = ""
    if (isGameEnd) {
      setGameEnded(true)
      setWinner(newScores.indexOf(Math.max(...newScores)))
      
      if (allPlayersOutOfTiles) {
        completionMessage = `🎯 Game Complete! All weavers have finished their threads! Winner: ${gameConfig.playerNames[newScores.indexOf(Math.max(...newScores))]} with ${Math.max(...newScores)} points!`
      } else {
        completionMessage = `⏰ Game Complete! Turn limit reached.`
      }
      
      // Show end game modal after a short delay
      setTimeout(() => setShowEndGameModal(true), 1500)
    } else {
      const nextPlayerName = gameConfig.playerNames[nextPlayer] || `Player ${nextPlayer + 1}`
      if (gameConfig.playerCount > 1) {
        completionMessage = `${nextPlayerName}'s turn! Place tiles in a single row or column that adds to a multiple of 5.`
      } else {
        completionMessage = `Turn ${newTurnNumber} started. Continue weaving...`
      }
    }

    const message = turnSequences.length > 0
      ? `🎉 Turn complete! ${sequenceText}. Total turn score: ${finalTurnScore}. Game total: ${newScores[currentPlayer]}. ${completionMessage}`
      : `🎉 Turn complete! Scored ${finalTurnScore} points. Total: ${newScores[currentPlayer]}. ${completionMessage}`

    setGameMessage(message)
  }

  const handleUndoTurn = () => {
    if (tilesPlacedThisTurn.length === 0) {
      setGameMessage("No tiles to undo!")
      return
    }

    console.log('🔄 UNDO TURN DEBUG:')
    console.log('  - Hand size BEFORE undo:', handTiles.length)
    console.log('  - Tiles placed this turn:', tilesPlacedThisTurn.length)
    console.log('  - Expected hand size after undo:', handTiles.length + tilesPlacedThisTurn.length)

    // Calculate what would remain after removing all tiles placed this turn
    const tilesToRemove = tilesPlacedThisTurn
    const remainingBoardTiles = boardTiles.filter(boardTile => 
      !tilesToRemove.some(removeTile => 
        boardTile.location.x === removeTile.location.x && 
        boardTile.location.y === removeTile.location.y
      )
    )

    // Find all tiles that remain connected to the main body
    const connectedTiles = getConnectedTiles(remainingBoardTiles)
    const connectedPositions = new Set(
      connectedTiles.map(t => `${t.location.x},${t.location.y}`)
    )
    
    // Separate connected from disconnected board tiles
    const finalBoardTiles = remainingBoardTiles.filter(boardTile =>
      connectedPositions.has(`${boardTile.location.x},${boardTile.location.y}`)
    )
    
    const removedIslandTiles = remainingBoardTiles.filter(boardTile =>
      !connectedPositions.has(`${boardTile.location.x},${boardTile.location.y}`)
    )

    // Update game state with only connected tiles
    setBoardTiles(finalBoardTiles)

    // Return all removed tiles to hand (placed this turn + any islands)
    const allRemovedTiles = [...tilesToRemove, ...removedIslandTiles].map(tile => ({
      ...tile,
      location: { type: 'Hand', player: currentPlayerId }
    }))
    
    console.log('  - Total tiles being returned to hand:', allRemovedTiles.length)
    console.log('  - Tiles from this turn:', tilesToRemove.length)
    console.log('  - Island tiles removed:', removedIslandTiles.length)
    
    updateCurrentPlayerHand(prev => {
      const newHand = [...prev, ...allRemovedTiles]
      console.log('  - Hand size AFTER undo:', newHand.length)
      return newHand
    })

    // Reset turn state
    setTilesPlacedThisTurn([])
    setTurnScore(0)
    setSelectedTile(null)
    
    // Create feedback message
    let message = `Undid ${tilesToRemove.length} tile placements.`
    if (removedIslandTiles.length > 0) {
      message += ` Also removed ${removedIslandTiles.length} island tile(s) that became disconnected.`
    }
    message += ` Try a different strategy!`
    
    setGameMessage(message)
  }

  const handleSkipTurn = () => {
    // Allow player to skip turn without placing tiles (with penalty)
    const penalty = Math.min(50, scores[currentPlayer])
    const newScores = [...scores]
    newScores[currentPlayer] = Math.max(0, newScores[currentPlayer] - penalty)
    setScores(newScores)

    // Draw one tile if possible from personal pile (from original logic)
    const personalPile = playerDrawPiles[currentPlayer] || []
    if (personalPile.length > 0 && handTiles.length < 5) {
      const newTiles = drawTilesFromPile(1)
      const newHandTile = {
        id: newTiles[0],
        uniqueId: `skip-${Date.now()}`,
        location: { type: 'Hand', player: currentPlayerId }
      }
      updateCurrentPlayerHand(prev => [...prev, newHandTile])
    }

    // Switch to next player in multiplayer (from original logic)
    let nextPlayer = currentPlayer
    let newTurnNumber = turnNumber
    
    if (gameConfig.playerCount > 1) {
      nextPlayer = (currentPlayer + 1) % gameConfig.playerCount
      if (nextPlayer === 0) {
        newTurnNumber = turnNumber + 1 // Complete round
      }
    } else {
      newTurnNumber = turnNumber + 1
    }

    setCurrentPlayer(nextPlayer)
    setTurnNumber(newTurnNumber)
    setTilesPlacedThisTurn([])
    setTurnScore(0)
    setSelectedTile(null)

    const nextPlayerName = gameConfig.playerNames[nextPlayer] || `Player ${nextPlayer + 1}`
    const messageEnd = gameConfig.playerCount === 1 
      ? `Current score: ${newScores[currentPlayer]}`
      : `${nextPlayerName}'s turn!`

    setGameMessage(`Turn skipped. ${penalty > 0 ? `Lost ${penalty} points as penalty.` : ''} ${messageEnd}`)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Helper functions for end game modal
  const formatGameTime = () => {
    const totalMs = Date.now() - gameStartTime
    const minutes = Math.floor(totalMs / 60000)
    const seconds = Math.floor((totalMs % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const calculatePlayerStats = (playerIndex: number) => {
    const score = scores[playerIndex] || 0
    const turns = Math.max(1, turnNumber - 1)
    return {
      name: gameConfig.playerNames[playerIndex] || `Player ${playerIndex + 1}`,
      score: score,
      turns: turns,
      totalTilesPlaced: boardTiles.length - 1, // Subtract center tile
      longestSequence: 5, // TODO: Calculate actual longest sequence
      averageScore: score / turns
    }
  }

  const generateAchievements = () => {
    const achievements = []
    const playerScore = scores[0] || 0
    const tilesPlaced = boardTiles.length - 1
    const tilesRemaining = (playerDrawPiles[0]?.length || 0) + (playerHands[0]?.length || 0)
    
    if (playerScore >= 1000) achievements.push("🏆 Score Master - Reached 1000+ points")
    if (playerScore >= 2000) achievements.push("🌟 Legendary Weaver - Reached 2000+ points") 
    if (tilesPlaced >= 30) achievements.push("🎯 Tile Master - Placed 30+ tiles")
    if (turnNumber <= 20 && playerScore >= 500) achievements.push("⚡ Speed Weaver - High score in few turns")
    if (tilesRemaining === 0) achievements.push("🎮 Perfect Completion - Used all tiles")
    if (playerScore >= gameConfig.winningScore) achievements.push("🏅 Victory - Reached winning score")
    if (playerScore / Math.max(1, turnNumber - 1) >= 100) achievements.push("💫 Efficiency Expert - High average score")
    
    return achievements
  }

  const handleNewGame = () => {
    // Reset all game state for a new game
    const newGameData = initializeGame(gameConfig)
    setBoardTiles(newGameData.boardTiles)
    setPlayerHands(newGameData.playerHands)
    setPlayerDrawPiles(newGameData.playerDrawPiles)
    setCurrentPlayer(newGameData.currentPlayer)
    setScores(newGameData.scores)
    setTurnNumber(newGameData.turnNumber)
    setGameMessage(newGameData.gameMessage)
    setSelectedTile(null)
    setGameEnded(false)
    setWinner(null)
    setTilesPlacedThisTurn([])
    setTurnScore(0)
    setShowEndGameModal(false)
  }

  return (
    <div css={containerStyle}>
      {/* Main Game Area */}
      <div css={mainAreaStyle(sidebarCollapsed)}>
        <NewAgeGameHeader
          gameConfig={gameConfig}
          gameState={{
            boardTiles,
            playerHands,
            playerDrawPiles,
            currentPlayer,
            scores,
            turnNumber,
            gameMessage,
            selectedTile,
            gameEnded,
            winner,
            tilesPlacedThisTurn,
            turnScore
          }}
          onBackToSetup={onBackToSetup}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Game Board */}
        <div css={boardAreaStyle}>
          <div css={boardContainerStyle}>
            <div css={gameboardStyle}>
              {Array.from({ length: 15 }, (_, rowIndex) => 
                Array.from({ length: 15 }, (_, colIndex) => {
                  const tile = [...boardTiles, ...tilesPlacedThisTurn]
                    .find(t => t.location.x === colIndex && t.location.y === rowIndex)
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      css={boardSpaceStyle}
                      onClick={() => handleBoardClick(colIndex, rowIndex)}
                    >
                      {tile ? (
                        <NewAgeTile
                          value={getTileValue(tile.id)}
                          state={
                            tilesPlacedThisTurn.some(placedTile => 
                              placedTile.location.x === colIndex && placedTile.location.y === rowIndex
                            ) ? "unplayed" : "played"
                          }
                          isSelected={false}
                          onClick={() => handlePlacedTileClick(tile)}
                        />
                      ) : (
                        <div css={emptySpaceStyle} />
                      )}
                    </div>
                  )
                })
              ).flat()}
            </div>
          </div>
        </div>

        {/* Current Player Hand */}
        <div css={handAreaStyle}>
          <div css={handHeaderStyle}>
            <h3 css={handTitleStyle}>
              {gameConfig.playerNames[currentPlayer]}'s Threads ({handTiles.length}/5)
            </h3>
            <div css={handActionsStyle}>
              {tilesPlacedThisTurn.length > 0 && (
                <button css={endTurnButtonStyle} onClick={handleEndTurn}>
                  End Turn ({turnScore} pts)
                </button>
              )}
              {tilesPlacedThisTurn.length > 0 && (
                <button css={undoTurnButtonStyle} onClick={handleUndoTurn}>
                  Undo Turn
                </button>
              )}
              <button css={skipTurnButtonStyle} onClick={handleSkipTurn}>
                Skip Turn
              </button>
            </div>
          </div>
          <div css={handContainerStyle}>
            {handTiles.map((tile, index) => (
              <NewAgeTile
                key={`${tile.id}-${index}`}
                value={getTileValue(tile.id)}
                state="unplayed"
                isSelected={selectedTile?.uniqueId === tile.uniqueId}
                onClick={() => handleTileSelect(tile)}
              />
            ))}
          </div>
        </div>

        {/* Status Message */}
        {gameMessage && (
          <div css={statusStyle}>
            {gameMessage}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div css={sidebarStyle(sidebarCollapsed)}>
        <NewAgePlayerPanel
          gameConfig={gameConfig}
          gameState={{
            boardTiles,
            playerHands,
            playerDrawPiles,
            currentPlayer,
            scores,
            turnNumber,
            gameMessage,
            selectedTile,
            gameEnded,
            winner,
            tilesPlacedThisTurn,
            turnScore
          }}
        />
      </div>

      {/* Mini Sidebar - Shows when main sidebar is collapsed */}
      {sidebarCollapsed && (
        <div css={miniSidebarStyle}>
          <div css={miniSidebarHeaderStyle}>
            <h3 css={miniSidebarTitleStyle}>Game</h3>
          </div>
          
          <div css={miniSidebarContentStyle}>
            {/* Current Player */}
            <div css={miniPlayerSectionStyle}>
              <div css={miniPlayerNameStyle}>
                {gameConfig.playerNames[currentPlayer]}
              </div>
              <div css={miniPlayerScoreStyle}>
                {scores[currentPlayer]} pts
              </div>
            </div>

            {/* All Players Scores */}
            <div css={miniScoresSectionStyle}>
              <div css={miniScoresTitleStyle}>Scores</div>
              {gameConfig.playerNames.map((playerName, index) => {
                const remainingTiles = (playerHands[index]?.length || 0) + (playerDrawPiles[index]?.length || 0)
                return (
                  <div 
                    key={index} 
                    css={[
                      miniScoreItemStyle,
                      index === currentPlayer && miniActiveScoreStyle,
                      winner === index && miniWinnerScoreStyle
                    ]}
                  >
                    <div css={miniScoreNameStyle}>
                      {playerName}
                      {index === currentPlayer && <span css={miniCurrentDotStyle}>●</span>}
                      {winner === index && <span css={miniWinnerCrownStyle}>👑</span>}
                    </div>
                    <div css={miniScoreDetailsStyle}>
                      <div css={miniScorePointsStyle}>{scores[index]} pts</div>
                      <div css={miniScoreTilesStyle}>{remainingTiles} threads</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Game Status */}
            <div css={miniStatusSectionStyle}>
              <div css={miniStatusItemStyle}>
                <span css={miniStatusLabelStyle}>Turn:</span>
                <span css={miniStatusValueStyle}>{turnNumber}</span>
              </div>
              <div css={miniStatusItemStyle}>
                <span css={miniStatusLabelStyle}>Threads:</span>
                <span css={miniStatusValueStyle}>
                  {playerHands.reduce((sum, hand) => sum + hand.length, 0) + 
                   playerDrawPiles.reduce((sum, pile) => sum + pile.length, 0)}
                </span>
              </div>
              {gameEnded && (
                <div css={miniGameEndedStyle}>
                  🎉 Complete!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* End Game Modal */}
      {showEndGameModal && (
        <NewAgeEndGameModal
          isOpen={showEndGameModal}
          onClose={() => setShowEndGameModal(false)}
          onNewGame={handleNewGame}
          onMainMenu={onBackToSetup}
          playerResult={calculatePlayerStats(0)}
          gameStats={{
            totalTurns: turnNumber - 1,
            totalTilesPlaced: boardTiles.length - 1,
            gameTime: formatGameTime(),
            tilesRemaining: (playerDrawPiles[0]?.length || 0) + (playerHands[0]?.length || 0)
          }}
          achievements={generateAchievements()}
          gameMode={'Classic Weaving'}
        />
      )}
    </div>
  )
}

const containerStyle = css`
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`

const mainAreaStyle = (collapsed: boolean) => {
  const safeCollapsed = typeof collapsed === 'boolean' ? collapsed : false
  return css`
    flex: 1;
    display: flex;
    flex-direction: column;
    transition: margin-right 0.3s ease;
    margin-right: ${safeCollapsed ? '120px' : '350px'};
    min-width: 0;
  `
}

const boardAreaStyle = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 0;
  z-index: 1;
  position: relative;
`

const boardContainerStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`

const gameboardStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 40px);
  grid-template-rows: repeat(15, 40px);
  gap: 2px;
  padding: 20px;
  background: rgba(139, 69, 19, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(5px);
`

const boardSpaceStyle = css`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`

const emptySpaceStyle = css`
  width: 100%;
  height: 100%;
  border: 2px dashed rgba(255, 215, 0, 0.3);
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
    background: rgba(255, 215, 0, 0.1);
  }
`

const handAreaStyle = css`
  padding: 20px;
  background: rgba(139, 69, 19, 0.08);
  border-top: 1px solid rgba(255, 215, 0, 0.2);
  z-index: 10;
  position: relative;
`

const handHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const handTitleStyle = css`
  color: #FFD700;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-align: center;
`

const handActionsStyle = css`
  display: flex;
  gap: 12px;
`

const endTurnButtonStyle = css`
  padding: 8px 16px;
  background: rgba(255, 215, 0, 0.2);
  border: none;
  border-radius: 4px;
  color: #FFD700;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: rgba(255, 215, 0, 0.3);
  }
`

const undoTurnButtonStyle = css`
  padding: 8px 16px;
  background: rgba(255, 215, 0, 0.2);
  border: none;
  border-radius: 4px;
  color: #FFD700;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: rgba(255, 215, 0, 0.3);
  }
`

const skipTurnButtonStyle = css`
  padding: 8px 16px;
  background: rgba(255, 215, 0, 0.2);
  border: none;
  border-radius: 4px;
  color: #FFD700;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: rgba(255, 215, 0, 0.3);
  }
`

const handContainerStyle = css`
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
`

const statusStyle = css`
  text-align: center;
  padding: 12px 20px;
  background: rgba(139, 69, 19, 0.12);
  border-top: 1px solid rgba(255, 215, 0, 0.2);
  color: #F5DEB3;
  font-size: 1rem;
  font-weight: 500;
  z-index: 10;
  position: relative;
`

const sidebarStyle = (collapsed: boolean) => {
  const safeCollapsed = typeof collapsed === 'boolean' ? collapsed : false
  return css`
    position: fixed;
    top: 0;
    right: 0;
    width: 350px;
    height: 100vh;
    background: rgba(139, 69, 19, 0.15);
    border-left: 2px solid rgba(255, 215, 0, 0.3);
    transform: translateX(${safeCollapsed ? '100%' : '0'});
    transition: transform 0.3s ease;
    z-index: 100;
    backdrop-filter: blur(10px);
    overflow-y: auto;
  `
}

const miniSidebarStyle = css`
  position: fixed;
  top: 0;
  right: 0;
  width: 120px;
  height: 100vh;
  background: rgba(139, 69, 19, 0.15);
  border-left: 2px solid rgba(255, 215, 0, 0.3);
  transform: translateX(0);
  transition: transform 0.3s ease;
  z-index: 100;
  backdrop-filter: blur(10px);
  overflow-y: auto;
`

const miniSidebarHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
`

const miniSidebarTitleStyle = css`
  color: #FFD700;
  font-size: 1.2rem;
  font-weight: 600;
`

const miniSidebarContentStyle = css`
  padding: 16px;
`

const miniPlayerSectionStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const miniPlayerNameStyle = css`
  color: #FFD700;
  font-size: 1rem;
  font-weight: 600;
`

const miniPlayerScoreStyle = css`
  color: #FFD700;
  font-size: 0.9rem;
  font-weight: 500;
`

const miniScoresSectionStyle = css`
  margin-bottom: 16px;
`

const miniScoresTitleStyle = css`
  color: #FFD700;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
`

const miniScoreItemStyle = css`
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  padding: 4px;
  border-radius: 4px;
`

const miniScoreNameStyle = css`
  color: #FFD700;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 2px;
`

const miniCurrentDotStyle = css`
  color: #FFD700;
  font-size: 0.8rem;
  margin-left: 4px;
`

const miniWinnerCrownStyle = css`
  color: #FFD700;
  font-size: 0.8rem;
  margin-left: 4px;
`

const miniScoreDetailsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const miniScorePointsStyle = css`
  color: #87CEEB;
  font-size: 0.7rem;
  font-weight: 600;
`

const miniScoreTilesStyle = css`
  color: #F5DEB3;
  font-size: 0.7rem;
  opacity: 0.8;
`

const miniStatusSectionStyle = css`
  margin-top: 16px;
`

const miniStatusItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`

const miniStatusLabelStyle = css`
  color: #F5DEB3;
  font-size: 0.7rem;
  font-weight: 500;
`

const miniStatusValueStyle = css`
  color: #87CEEB;
  font-size: 0.7rem;
  font-weight: 600;
`

const miniGameEndedStyle = css`
  color: #FFD700;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 12px;
  text-align: center;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 4px;
  padding: 4px;
`

const miniActiveScoreStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border-radius: 4px;
  padding: 4px;
`

const miniWinnerScoreStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border-radius: 4px;
  padding: 4px;
`