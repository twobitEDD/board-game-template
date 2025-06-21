/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'
import { NumberTile } from './NumberTile'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'
import { useState, useEffect, useMemo } from 'react'

import { GameConfig } from './GameSetup'

// Simplified global styles
const globalStyles = css`
  * {
    box-sizing: border-box;
  }
`

interface TileItem {
  id: NumberTileId
  uniqueId: string // Add unique identifier for each tile instance
  location: {
    type: string
    x?: number
    y?: number
    player?: any
  }
}

interface FivesGameBoardProps {
  gameConfig: GameConfig
  onGameDataUpdate?: (data: {
    playerScores: number[]
    turnNumber: number
    tilesRemaining: number
    gameMessage: string
    currentPlayerIndex: number
  }) => void
}

export function FivesGameBoard({ gameConfig, onGameDataUpdate }: FivesGameBoardProps) {
  // Always use local player data for now (bypass GamePark hooks that cause issues)
  console.log('FivesGameBoard received gameConfig:', gameConfig)
  const playerId = 'player1'
  const playerName = gameConfig.playerNames[0] || 'Player 1'
  
  // Create initial draw pile with all tiles
  const createInitialDrawPile = (): NumberTileId[] => {
    const pile: NumberTileId[] = []
    // Add multiple copies of each number (like Scrabble)
    const tileDistribution = {
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
    
    Object.entries(tileDistribution).forEach(([tileId, count]) => {
      for (let i = 0; i < count; i++) {
        pile.push(parseInt(tileId) as NumberTileId)
      }
    })
    
    // Shuffle the pile
    for (let i = pile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pile[i], pile[j]] = [pile[j], pile[i]]
    }
    
    return pile
  }

  // Initialize game state with useMemo to ensure consistency
  const initialPile = useMemo(() => createInitialDrawPile(), [])
  
  // Game state
  const [drawPile, setDrawPile] = useState<NumberTileId[]>(() => initialPile.slice(5))
  
  const [boardTiles, setBoardTiles] = useState<TileItem[]>([
    { id: NumberTileId.Five, uniqueId: 'center-tile', location: { type: 'Board', x: 7, y: 7 } }
  ])
  
  const [handTiles, setHandTiles] = useState<TileItem[]>(() => 
    initialPile.slice(0, 5).map((tileId: NumberTileId, index: number) => ({
      id: tileId,
      uniqueId: `hand-${Date.now()}-${index}`,
      location: { type: 'Hand', player: gameConfig.playerCount === 1 ? 'player1' : 'unknown' }
    }))
  )
  
  const [selectedTile, setSelectedTile] = useState<TileItem | null>(null)
  const [tilesPlacedThisTurn, setTilesPlacedThisTurn] = useState<TileItem[]>([])
  // Separate scores for each player
  const [playerScores, setPlayerScores] = useState<number[]>(() => 
    Array.from({ length: gameConfig.playerCount }, () => 0)
  )
  const [turnScore, setTurnScore] = useState(0)
  const [turnNumber, setTurnNumber] = useState(1)
  const [currentTurnDirection, setCurrentTurnDirection] = useState<'horizontal' | 'vertical' | null>(null)
  const [currentTurnRow, setCurrentTurnRow] = useState<number | null>(null)
  const [currentTurnCol, setCurrentTurnCol] = useState<number | null>(null)
  // For multiplayer, track current player
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const currentPlayer = gameConfig.playerNames[currentPlayerIndex] || 'Player 1'
  const currentScore = playerScores[currentPlayerIndex] || 0
  
  const [gameMessage, setGameMessage] = useState(
    gameConfig.playerCount === 1 
      ? `Welcome to Solo Practice, ${gameConfig.playerNames[0]}! Place tiles in a single row or column that adds to a multiple of 5. Max 5 tiles per sequence.`
      : `${currentPlayer}'s turn! Place tiles in a single row or column that adds to a multiple of 5. Max 5 tiles per sequence.`
  )

  // Update parent component with game data
  useEffect(() => {
    if (onGameDataUpdate) {
      onGameDataUpdate({
        playerScores,
        turnNumber,
        tilesRemaining: drawPile.length + handTiles.length,
        gameMessage,
        currentPlayerIndex
      })
    }
  }, [playerScores, turnNumber, drawPile.length, handTiles.length, gameMessage, currentPlayerIndex, onGameDataUpdate])

  const handleTileSelect = (tile: TileItem) => {
    console.log('Tile selected:', tile)
    setSelectedTile(tile)
    setGameMessage(`Selected ${getTileValue(tile.id)} tile. Click on the board to place it.`)
  }

  const handleBoardClick = (x: number, y: number) => {
    console.log('Board clicked at:', x, y, 'Selected tile:', selectedTile)
    if (!selectedTile) {
      setGameMessage("Please select a tile from your hand first!")
      return
    }
    
    // Check if placement is valid
    if (!isValidPlacement(x, y)) {
      console.log(`Invalid placement at (${x},${y}). Turn direction: ${currentTurnDirection}, Row: ${currentTurnRow}, Col: ${currentTurnCol}`)
      console.log('Tiles placed this turn:', tilesPlacedThisTurn.map(t => `(${t.location.x},${t.location.y})`))
      
      // Check if it's specifically a 5-tile sequence limit issue
      const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
      const allTilesIncludingNew = [...allTiles, { 
        id: NumberTileId.One,
        uniqueId: 'temp',
        location: { type: 'Board', x, y }
      }]
      
      // Check horizontal sequence length
      const horizontalTiles = []
      let leftX = x
      while (leftX > 0 && allTilesIncludingNew.some(tile => tile.location.x === leftX - 1 && tile.location.y === y)) {
        leftX--
      }
      for (let currentX = leftX; currentX < 15; currentX++) {
        const tile = allTilesIncludingNew.find(tile => tile.location.x === currentX && tile.location.y === y)
        if (tile) {
          horizontalTiles.push(tile)
        } else {
          break
        }
      }
      
      // Check vertical sequence length
      const verticalTiles = []
      let topY = y
      while (topY > 0 && allTilesIncludingNew.some(tile => tile.location.x === x && tile.location.y === topY - 1)) {
        topY--
      }
      for (let currentY = topY; currentY < 15; currentY++) {
        const tile = allTilesIncludingNew.find(tile => tile.location.x === x && tile.location.y === currentY)
        if (tile) {
          verticalTiles.push(tile)
        } else {
          break
        }
      }
      
      // Check if it's an adjacency issue
      const adjacentPositions = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      ]
      const isAdjacent = adjacentPositions.some(pos =>
        allTiles.some((tile: TileItem) => tile.location.x === pos.x && tile.location.y === pos.y)
      )
      
      if (horizontalTiles.length > 5) {
        setGameMessage(`🚫 Cannot place tile! Would create a horizontal sequence of ${horizontalTiles.length} tiles (max 5 allowed).`)
      } else if (verticalTiles.length > 5) {
        setGameMessage(`🚫 Cannot place tile! Would create a vertical sequence of ${verticalTiles.length} tiles (max 5 allowed).`)
      } else if (!isAdjacent && (boardTiles.length > 0 || tilesPlacedThisTurn.length > 0)) {
        setGameMessage("🚫 Invalid placement! Tiles must be adjacent (touching) to existing tiles on the board.")
      } else if (boardTiles.length === 0 && tilesPlacedThisTurn.length === 0) {
        setGameMessage("🚫 First tile must be placed on or adjacent to the center star (⭐).")
      } else {
        // Check if it's a turn placement issue
        const isValidTurn = tilesPlacedThisTurn.length > 0 ? isValidTurnPlacement(x, y, tilesPlacedThisTurn) : true
        
        if (!isValidTurn) {
          setGameMessage("🚫 Invalid placement! All tiles in a turn must be in the same row OR the same column.")
        } else {
          setGameMessage("Invalid placement! Check that you're placing tiles in a valid position.")
        }
      }
      return
    }
    
    // Place the tile
    const newTile: TileItem = {
      id: selectedTile.id,
      uniqueId: selectedTile.uniqueId,
      location: { type: 'Board', x, y }
    }
    
    const newBoardTiles = [...boardTiles, newTile]
    
    // Add to tiles placed this turn
    const newTilesPlacedThisTurn = [...tilesPlacedThisTurn, newTile]
    setTilesPlacedThisTurn(newTilesPlacedThisTurn)

    // Set turn direction if this is the first tile placed this turn
    if (tilesPlacedThisTurn.length === 0) {
      // Don't set direction on first tile - let the player choose with their second tile
      // This allows flexibility in Quinto-style play
      console.log(`First tile placed at (${x},${y}) - direction will be determined by next tile`)
    } else if (tilesPlacedThisTurn.length === 1) {
      // Determine direction based on the relationship between first and second tile
      const firstTile = tilesPlacedThisTurn[0]
      
      if (firstTile.location.y === y) {
        // Same row - horizontal play
        setCurrentTurnDirection('horizontal')
        setCurrentTurnRow(y)
        setCurrentTurnCol(null)
        console.log(`Setting direction to horizontal (row ${y})`)
      } else if (firstTile.location.x === x) {
        // Same column - vertical play
        setCurrentTurnDirection('vertical')
        setCurrentTurnCol(x)
        setCurrentTurnRow(null)
        console.log(`Setting direction to vertical (column ${x})`)
      }
    }
    
    // Calculate potential score for this turn
    const turnSequences = calculateTurnSequences(newBoardTiles, newTilesPlacedThisTurn)
    const newTurnScore = turnSequences.reduce((total, seq) => {
      const baseScore = seq.sum * 10
      console.log(`🔍 SCORING DEBUG: Sequence [${seq.tiles.map(t => getTileValue(t.id)).join(',')}] sum=${seq.sum}, length=${seq.tiles.length}`)
      console.log(`   Score: ${seq.sum} × 10 = ${baseScore}`)
      return total + baseScore
    }, 0)
    
    setTurnScore(newTurnScore)
    
    setBoardTiles(newBoardTiles)
    setHandTiles(prev => prev.filter(tile => tile.uniqueId !== selectedTile.uniqueId))
    setSelectedTile(null)
    
    // Update message based on turn progress - check ALL sequences created
    const allTurnSequences = calculateTurnSequences(newBoardTiles, newTilesPlacedThisTurn)
    
    if (allTurnSequences.length > 0) {
      const allValid = allTurnSequences.every(seq => seq.sum % 5 === 0)
      const sequenceTexts = allTurnSequences.map(seq => 
        `${seq.tiles.map(t => getTileValue(t.id)).join(' + ')} = ${seq.sum}`
      )
      
      console.log(`All sequences this turn:`, sequenceTexts)
      
      if (allValid) {
        setGameMessage(`✅ Valid sequences! ${sequenceTexts.join(' | ')} (all multiples of 5). You can end your turn or place more tiles.`)
      } else {
        const invalidSeqs = allTurnSequences.filter(seq => seq.sum % 5 !== 0)
        const invalidTexts = invalidSeqs.map(seq => 
          `${seq.tiles.map(t => getTileValue(t.id)).join(' + ')} = ${seq.sum}`
        )
        setGameMessage(`🔄 Building sequences. Invalid: ${invalidTexts.join(', ')}. Need all sequences to be multiples of 5.`)
      }
    } else {
      setGameMessage("Tile placed! Continue building your sequence.")
    }
    
    console.log(`Tile placed! Potential turn score: ${newTurnScore}`)
  }

  const drawTilesFromPile = (count: number): NumberTileId[] => {
    const drawnTiles = drawPile.slice(0, count)
    setDrawPile(prev => prev.slice(count))
    return drawnTiles
  }

  const handleEndTurn = () => {
    if (tilesPlacedThisTurn.length === 0) {
      setGameMessage("You must place at least one tile before ending your turn!")
      return
    }

    // Validate that all sequences containing new tiles sum to multiples of 5
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    let hasValidSequence = false
    let invalidSequences: string[] = []
    let allSequencesFound: string[] = []

    console.log(`🔍 END TURN VALIDATION: Checking ${tilesPlacedThisTurn.length} tiles placed this turn`)
    console.log('Tiles placed this turn:', tilesPlacedThisTurn.map(t => `(${t.location.x},${t.location.y})=${getTileValue(t.id)}`))

    // Check all sequences that contain tiles placed this turn
    tilesPlacedThisTurn.forEach(placedTile => {
      if (placedTile.location.x === undefined || placedTile.location.y === undefined) return
      
      console.log(`🔍 Checking sequences at position (${placedTile.location.x},${placedTile.location.y})`)
      const sequences = getSequencesAtPosition(placedTile.location.x, placedTile.location.y, allTiles)
      console.log(`Found ${sequences.length} sequences at this position`)
      
      sequences.forEach(seq => {
        const hasNewTile = seq.tiles.some(tile => 
          tilesPlacedThisTurn.some(placed => 
            placed.location.x === tile.location.x && placed.location.y === tile.location.y
          )
        )
        
        const seqText = `${seq.tiles.map(t => getTileValue(t.id)).join('+')} = ${seq.sum}`
        allSequencesFound.push(`${seqText} (length: ${seq.tiles.length}, hasNewTile: ${hasNewTile})`)
        
        if (hasNewTile) {
          console.log(`🔍 Sequence contains new tile: ${seqText}`)
          if (seq.sum % 5 === 0 && seq.sum > 0) {
            console.log(`✅ Valid sequence: ${seqText}`)
            hasValidSequence = true
          } else {
            console.log(`❌ Invalid sequence: ${seqText}`)
            if (!invalidSequences.includes(seqText)) {
              invalidSequences.push(seqText)
            }
          }
        }
      })
    })

    console.log(`🔍 All sequences found:`, allSequencesFound)
    console.log(`🔍 Valid sequences found: ${hasValidSequence}`)
    console.log(`🔍 Invalid sequences:`, invalidSequences)

    if (!hasValidSequence) {
      setGameMessage(`Invalid play! All sequences must sum to multiples of 5. Current sequences: ${invalidSequences.join(', ')}. Keep playing or use Undo Turn.`)
      return
    }

    if (invalidSequences.length > 0) {
      setGameMessage(`Invalid play! Some sequences don't sum to multiples of 5: ${invalidSequences.join(', ')}. Keep playing or use Undo Turn.`)
      return
    }
    
    // Calculate final score for this turn
    const turnSequences = calculateTurnSequences(boardTiles, tilesPlacedThisTurn)
    const finalTurnScore = turnSequences.reduce((total, seq) => {
      const baseScore = seq.sum * 10
      console.log(`🎯 FINAL SCORING: Sequence [${seq.tiles.map(t => getTileValue(t.id)).join(',')}] sum=${seq.sum}, length=${seq.tiles.length}`)
      console.log(`   Score: ${seq.sum} × 10 = ${baseScore}`)
      return total + baseScore
    }, 0)
    
    // Add turn score to current player's total score
    const newTotalScore = currentScore + finalTurnScore
    setPlayerScores(prev => {
      const newScores = [...prev]
      newScores[currentPlayerIndex] = newTotalScore
      return newScores
    })
    
    // Draw new tiles to refill hand to 5 tiles
    const tilesNeeded = Math.min(5 - handTiles.length, drawPile.length)
    if (tilesNeeded > 0) {
      const newTiles = drawTilesFromPile(tilesNeeded)
      const newHandTiles = newTiles.map((tileId, index) => ({
        id: tileId,
        uniqueId: `refill-${Date.now()}-${index}`,
        location: { type: 'Hand', player: playerId || 'player1' }
      }))
      setHandTiles(prev => [...prev, ...newHandTiles])
    }
    
    // Reset turn state
    setTilesPlacedThisTurn([])
    setTurnScore(0)
    setTurnNumber(prev => prev + 1)
    setCurrentTurnDirection(null)
    setCurrentTurnRow(null)
    setCurrentTurnCol(null)
    
    // Switch to next player in multiplayer
    if (gameConfig.playerCount > 1) {
      const nextPlayerIndex = (currentPlayerIndex + 1) % gameConfig.playerCount
      setCurrentPlayerIndex(nextPlayerIndex)
      const nextPlayer = gameConfig.playerNames[nextPlayerIndex] || `Player ${nextPlayerIndex + 1}`
      setGameMessage(`${nextPlayer}'s turn! Place tiles in a single row or column that adds to a multiple of 5. Max 5 tiles per sequence.`)
    }
    
    // Show turn summary
    const sequenceText = turnSequences.map(seq => 
      `${seq.tiles.map(t => getTileValue(t.id)).join('+')} = ${seq.sum}`
    ).join(', ')
    
    setGameMessage(`🎉 Turn ${turnNumber} complete! Scored ${finalTurnScore} points. ${sequenceText ? `Sequences: ${sequenceText}` : ''} Total: ${newTotalScore}`)
    
    console.log(`🎉 Turn complete! Turn score: ${finalTurnScore}, Total score: ${newTotalScore}`)
    console.log('Valid sequences:', turnSequences.map(seq => 
      `${seq.tiles.map(t => getTileValue(t.id)).join('+')} = ${seq.sum} (${seq.sum * 10} points)`
    ))
    
    // Check for game end conditions
    if (handTiles.length === 0 && drawPile.length === 0) {
      if (gameConfig.playerCount === 1) {
        setGameMessage(`🎯 Practice Complete! Final Score: ${newTotalScore} points! Great job!`)
      } else {
        setGameMessage(`🏆 Game Over! Final Score: ${newTotalScore} points!`)
      }
    } else if (newTotalScore >= 500) {
      if (gameConfig.playerCount === 1) {
        setGameMessage(`🎯 Excellent! You reached ${newTotalScore} points! Ready for multiplayer?`)
      } else {
        setGameMessage(`🏆 Congratulations! You reached ${newTotalScore} points and won the game!`)
      }
    }
  }

  const handleSkipTurn = () => {
    // Allow player to skip turn without placing tiles (with penalty)
    const penalty = Math.min(50, currentScore)
    const newScore = Math.max(0, currentScore - penalty)
    setPlayerScores(prev => {
      const newScores = [...prev]
      newScores[currentPlayerIndex] = newScore
      return newScores
    })
    
    // Draw one tile if possible
    if (drawPile.length > 0 && handTiles.length < 5) {
      const newTiles = drawTilesFromPile(1)
      const newHandTile = {
        id: newTiles[0],
        uniqueId: `skip-${Date.now()}`,
        location: { type: 'Hand', player: playerId || 'player1' }
      }
      setHandTiles(prev => [...prev, newHandTile])
    }
    
    // Reset turn state
    setTilesPlacedThisTurn([])
    setTurnScore(0)
    setCurrentTurnDirection(null)
    setCurrentTurnRow(null)
    setCurrentTurnCol(null)
    
    setTurnNumber(prev => prev + 1)
    setGameMessage(`Turn skipped. ${penalty > 0 ? `Lost ${penalty} points as penalty.` : ''} Current score: ${newScore}`)
  }

  const handleUndoTurn = () => {
    // Remove all tiles placed this turn and return them to hand
    if (tilesPlacedThisTurn.length === 0) {
      setGameMessage("No tiles to undo!")
      return
    }

    // Remove tiles from board
    const tilesToRemove = tilesPlacedThisTurn
    const newBoardTiles = boardTiles.filter(boardTile => 
      !tilesToRemove.some(removeTile => 
        boardTile.location.x === removeTile.location.x && 
        boardTile.location.y === removeTile.location.y
      )
    )
    setBoardTiles(newBoardTiles)

    // Return tiles to hand
    const returnedTiles = tilesToRemove.map(tile => ({
      ...tile,
      location: { type: 'Hand', player: playerId || 'player1' }
    }))
    setHandTiles(prev => [...prev, ...returnedTiles])

    // Reset turn state
    setTilesPlacedThisTurn([])
    setTurnScore(0)
    setCurrentTurnDirection(null)
    setCurrentTurnRow(null)
    setCurrentTurnCol(null)
    setSelectedTile(null)

    setGameMessage(`Undid ${tilesToRemove.length} tile placements. Try a different strategy!`)
  }

  const calculateTurnSequences = (allTiles: TileItem[], placedTiles: TileItem[]) => {
    const sequences: Array<{ tiles: TileItem[]; sum: number }> = []
    
    // For each tile placed this turn, check if it creates or extends sequences
    placedTiles.forEach(placedTile => {
      if (placedTile.location.x === undefined || placedTile.location.y === undefined) return
      
      const tileSequences = getSequencesAtPosition(placedTile.location.x, placedTile.location.y, allTiles)
      tileSequences.forEach(seq => {
        // Only count sequences that are valid (sum is multiple of 5) and contain at least one placed tile
        if (seq.sum % 5 === 0 && seq.sum > 0) {
          const hasPlacedTile = seq.tiles.some(tile => 
            placedTiles.some(placed => 
              placed.location.x === tile.location.x && placed.location.y === tile.location.y
            )
          )
          if (hasPlacedTile) {
            // Avoid duplicate sequences
            const isDuplicate = sequences.some(existing => 
              existing.tiles.length === seq.tiles.length &&
              existing.tiles.every(tile => 
                seq.tiles.some(seqTile => 
                  seqTile.location.x === tile.location.x && seqTile.location.y === tile.location.y
                )
              )
            )
            if (!isDuplicate) {
              sequences.push(seq)
            }
          }
        }
      })
    })
    
    return sequences
  }

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

  // Simplified validation: just check basic rules without overly complex contiguity
  const isValidTurnPlacement = (x: number, y: number, tilesPlacedThisTurn: TileItem[]): boolean => {
    // First tile of turn: always valid (adjacency checked elsewhere)
    if (tilesPlacedThisTurn.length === 0) {
      return true
    }
    
    // All tiles in a turn must be in the same row OR same column
    const allTurnTilesWithNew = [...tilesPlacedThisTurn, {
      id: NumberTileId.One,
      uniqueId: 'temp',
      location: { type: 'Board', x, y }
    }]
    
    const allXValues = allTurnTilesWithNew.map(tile => tile.location.x || 0)
    const allYValues = allTurnTilesWithNew.map(tile => tile.location.y || 0)
    
    const allSameRow = allYValues.every(val => val === allYValues[0])
    const allSameCol = allXValues.every(val => val === allXValues[0])
    
    // Must be all in same row OR all in same column
    return allSameRow || allSameCol
  }

  const getSequencesAtPosition = (x: number, y: number, tiles: TileItem[]) => {
    const sequences: Array<{ tiles: TileItem[]; sum: number }> = []
    
    // Check horizontal sequence (max 5 tiles)
    const horizontalTiles = []
    
    // Find leftmost position
    let leftX = x
    while (leftX > 0 && tiles.some(tile => tile.location.x === leftX - 1 && tile.location.y === y)) {
      leftX--
    }
    
    // Collect horizontal tiles from left to right (max 5 tiles)
    for (let currentX = leftX; currentX < 15 && horizontalTiles.length < 5; currentX++) {
      const tile = tiles.find(tile => tile.location.x === currentX && tile.location.y === y)
      if (tile) {
        horizontalTiles.push(tile)
      } else {
        break
      }
    }
    
    if (horizontalTiles.length > 1) {
      const sum = horizontalTiles.reduce((total, tile) => total + getTileValue(tile.id), 0)
      sequences.push({ tiles: horizontalTiles, sum })
      console.log(`🔍 Horizontal sequence: ${horizontalTiles.length} tiles, sum=${sum}`)
    }
    
    // Check vertical sequence (max 5 tiles)
    const verticalTiles = []
    
    // Find topmost position
    let topY = y
    while (topY > 0 && tiles.some(tile => tile.location.x === x && tile.location.y === topY - 1)) {
      topY--
    }
    
    // Collect vertical tiles from top to bottom (max 5 tiles)
    for (let currentY = topY; currentY < 15 && verticalTiles.length < 5; currentY++) {
      const tile = tiles.find(tile => tile.location.x === x && tile.location.y === currentY)
      if (tile) {
        verticalTiles.push(tile)
      } else {
        break
      }
    }
    
    if (verticalTiles.length > 1) {
      const sum = verticalTiles.reduce((total, tile) => total + getTileValue(tile.id), 0)
      sequences.push({ tiles: verticalTiles, sum })
      console.log(`🔍 Vertical sequence: ${verticalTiles.length} tiles, sum=${sum}`)
    }
    
    return sequences
  }

  // Smart validation that only runs when a tile is selected and position is empty
  const isValidPlacement = useMemo(() => {
    if (!selectedTile) return () => false
    
    const cache = new Map<string, boolean>()
    
    return (x: number, y: number): boolean => {
      const cacheKey = `${x},${y},${boardTiles.length},${tilesPlacedThisTurn.length},${currentTurnDirection || 'none'}`
      
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!
      }
      
      const result = validatePlacement(x, y)
      cache.set(cacheKey, result)
      return result
    }
  }, [selectedTile, boardTiles, tilesPlacedThisTurn, currentTurnDirection])

  const validatePlacement = (x: number, y: number): boolean => {
    // Check if the specific position is within board bounds (0-14)
    if (x < 0 || x >= 15 || y < 0 || y >= 15) {
      return false
    }
    
    // Check if the specific position is already occupied
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    const isOccupied = allTiles.some(tile => tile.location.x === x && tile.location.y === y)
    
    if (isOccupied) {
      return false
    }

    // Special case: first tile of the game must be on center (7,7) or adjacent to center
    if (boardTiles.length === 0 && tilesPlacedThisTurn.length === 0) {
      const isCenterOrAdjacent = (x === 7 && y === 7) || 
        (Math.abs(x - 7) <= 1 && Math.abs(y - 7) <= 1 && (x === 7 || y === 7))
      if (!isCenterOrAdjacent) {
        return false
      }
    } else {
      // All other tiles must be adjacent to existing tiles (including tiles placed this turn)
      const adjacentPositions = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      ]
      
      const isAdjacent = adjacentPositions.some(pos =>
        allTiles.some((tile: TileItem) => tile.location.x === pos.x && tile.location.y === pos.y)
      )
      
      if (!isAdjacent) {
        return false
      }
    }

    // If tiles already placed this turn, check direction constraints AND contiguity
    if (tilesPlacedThisTurn.length > 0) {
      // Reduced direction check logging
      
      if (currentTurnDirection === 'horizontal' && y !== currentTurnRow) {
        return false
      }
      
      if (currentTurnDirection === 'vertical' && x !== currentTurnCol) {
        return false
      }
      
      // If direction hasn't been set yet (only one tile placed), check if this would be valid
      if (currentTurnDirection === null && tilesPlacedThisTurn.length === 1) {
        const firstTile = tilesPlacedThisTurn[0]
        const sameRow = firstTile.location.y === y
        const sameCol = firstTile.location.x === x
        
        if (!sameRow && !sameCol) {
          return false
        }
      }
      
      // Check turn placement rules: tiles must be in same row or column
      try {
        const isValidTurn = isValidTurnPlacement(x, y, tilesPlacedThisTurn)
        
        if (!isValidTurn) {
          return false
        }
      } catch (error) {
        console.error(`Error checking turn placement at (${x},${y}):`, error)
        // If there's an error in turn checking, allow the placement to avoid crashes
        return true
      }
    }

    // Check 5-tile limit: no contiguous sequence can be more than 5 tiles
    const allTilesIncludingNew = [...allTiles, { 
      id: NumberTileId.One, // dummy tile for counting
      uniqueId: 'temp',
      location: { type: 'Board', x, y }
    }]
    
    // Check horizontal sequence length at this position
    const horizontalTiles = []
    
    // Find leftmost position in horizontal sequence
    let leftX = x
    while (leftX > 0 && allTilesIncludingNew.some(tile => tile.location.x === leftX - 1 && tile.location.y === y)) {
      leftX--
    }
    
    // Count horizontal tiles from left to right
    for (let currentX = leftX; currentX < 15; currentX++) {
      const tile = allTilesIncludingNew.find(tile => tile.location.x === currentX && tile.location.y === y)
      if (tile) {
        horizontalTiles.push(tile)
      } else {
        break
      }
    }
    
    if (horizontalTiles.length > 5) {
      return false
    }
    
    // Check vertical sequence length at this position
    const verticalTiles = []
    
    // Find topmost position in vertical sequence
    let topY = y
    while (topY > 0 && allTilesIncludingNew.some(tile => tile.location.x === x && tile.location.y === topY - 1)) {
      topY--
    }
    
    // Count vertical tiles from top to bottom
    for (let currentY = topY; currentY < 15; currentY++) {
      const tile = allTilesIncludingNew.find(tile => tile.location.x === x && tile.location.y === currentY)
      if (tile) {
        verticalTiles.push(tile)
      } else {
        break
      }
    }
    
    if (verticalTiles.length > 5) {
      return false
    }

    return true
  }

  return (
    <div css={gameContainerStyle}>
      <Global styles={globalStyles} />
      
      {/* Game Content */}
      <div css={gameContentStyle}>
        {/* Header */}
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
            <span>Draw Pile: {drawPile.length}</span>
            <span>Hand: {handTiles.length} {handTiles.length > 0 ? `(${handTiles.map(t => getTileValue(t.id)).join(',')})` : ''}</span>
            {selectedTile && <span>Selected: {getTileValue(selectedTile.id)}</span>}
          </div>
        </div>
        
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
        
        {/* Game Board */}
        <div css={boardContainerStyle}>
          <div css={gridStyle}>
            {Array.from({ length: 15 }, (_, row) =>
              Array.from({ length: 15 }, (_, col) => {
                const boardTile = boardTiles.find((tile: TileItem) => tile.location.x === col && tile.location.y === row)
                const isCenter = row === 7 && col === 7
                const isPlacedThisTurn = tilesPlacedThisTurn.some(tile => tile.location.x === col && tile.location.y === row)
                
                // Only validate placement if tile is selected and position is empty
                // This prevents calling isValidPlacement 225 times on every render
                let canPlace = false
                let invalidPlace = false
                if (selectedTile && !boardTile && !tilesPlacedThisTurn.some(t => t.location.x === col && t.location.y === row)) {
                  canPlace = isValidPlacement(col, row)
                  invalidPlace = !canPlace
                }
                
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
                    `}
                    onClick={() => handleBoardClick(col, row)}
                  >
                    {boardTile && (
                      <NumberTile 
                        tileId={boardTile.id} 
                        size="large"
                      />
                    )}
                    {!boardTile && isCenter && <div css={centerStarStyle}>⭐</div>}
                    {canPlace && <div css={placementHintStyle}>+</div>}
                  </div>
                )
              })
            )}
          </div>
        </div>
        
        {/* Player Hand */}
        <div css={handStyle}>
          <div css={handHeaderStyle}>
            <div css={handLabelStyle}>YOUR HAND</div>
            <div css={actionButtonsStyle}>
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
          <div css={handTilesStyle}>
            {handTiles && handTiles.length > 0 ? (
              handTiles.map((tile: TileItem, index: number) => (
                <div 
                  key={`hand-tile-${index}-${tile.id}`} 
                  css={handTileWrapperStyle}
                  className={selectedTile?.uniqueId === tile.uniqueId ? 'selected' : ''}
                  onClick={() => handleTileSelect(tile)}
                >
                  <NumberTile 
                    tileId={tile.id} 
                    size="normal"
                    isSelected={selectedTile?.uniqueId === tile.uniqueId}
                    onClick={() => handleTileSelect(tile)}
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
      </div>
    </div>
  )
}

// Contained, consistent styles
const gameContainerStyle = css`
  width: 100%;
  max-width: 900px;
  height: auto;
  min-height: 700px;
  max-height: 95vh;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
`

const gameContentStyle = css`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 20px;
  gap: 15px;
`

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

const boardContainerStyle = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 15px;
  min-height: 500px;
  max-height: 70vh;
  overflow: auto;
`

const gridStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(15, 1fr);
  gap: 2px;
  width: 100%;
  max-width: 600px;
  aspect-ratio: 1;
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
  cursor: not-allowed;
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
`

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
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 60px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const handTileWrapperStyle = css`
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 2px;
  
  &:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &.selected {
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.2);
    transform: translateY(-5px);
  }
`

const emptyHandStyle = css`
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  font-style: italic;
  padding: 10px;
`

const gameMessageStyle = css`
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  text-align: center;
`

const actionButtonsStyle = css`
  display: flex;
  gap: 8px;
` 