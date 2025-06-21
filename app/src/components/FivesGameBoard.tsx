/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'
import { NumberTile } from './NumberTile'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'
import { useState, useMemo, useEffect } from 'react'

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
    { id: NumberTileId.Five, uniqueId: 'center-tile', location: { type: 'Board', x: 3, y: 3 } }
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
      ? `Welcome to Solo Practice, ${gameConfig.playerNames[0]}! Place tiles in a single row or column that adds to a multiple of 5.`
      : `${currentPlayer}'s turn! Place tiles in a single row or column that adds to a multiple of 5.`
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
    
    // Check if spot is empty
    const isOccupied = boardTiles.some((tile: TileItem) => tile.location.x === x && tile.location.y === y)
    if (isOccupied) {
      setGameMessage("That spot is already occupied!")
      return
    }
    
    // Check if placement is valid
    if (!isValidPlacement(x, y)) {
      console.log(`Invalid placement at (${x},${y}). Turn direction: ${currentTurnDirection}, Row: ${currentTurnRow}, Col: ${currentTurnCol}`)
      console.log('Tiles placed this turn:', tilesPlacedThisTurn.map(t => `(${t.location.x},${t.location.y})`))
      setGameMessage("Invalid placement! Check the game rules.")
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
      const lengthBonus = seq.tiles.length * 20
      return total + baseScore + lengthBonus
    }, 0)
    
    setTurnScore(newTurnScore)
    
    setBoardTiles(newBoardTiles)
    setHandTiles(prev => prev.filter(tile => tile.uniqueId !== selectedTile.uniqueId))
    setSelectedTile(null)
    
    // Update message based on turn progress
    const currentSeq = getCurrentTurnSequence()
    if (currentSeq) {
      const isValidSum = currentSeq.sum % 5 === 0
      const directionText = currentTurnDirection === 'horizontal' ? `row ${currentTurnRow}` : `column ${currentTurnCol}`
      
      if (isValidSum) {
        setGameMessage(`✅ Valid sequence in ${directionText}! Sum: ${currentSeq.sum} (multiple of 5). You can end your turn or place more tiles.`)
      } else {
        setGameMessage(`🔄 Building sequence in ${directionText}. Current sum: ${currentSeq.sum}. Need a multiple of 5 to end turn.`)
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

  const getCurrentTurnSequence = () => {
    if (tilesPlacedThisTurn.length === 0) return null
    
    // Get all tiles in the current turn's row or column
    let sequenceTiles: TileItem[] = []
    
    if (currentTurnDirection === 'horizontal' && currentTurnRow !== null) {
      // Get all tiles in the current row
      sequenceTiles = [...boardTiles, ...tilesPlacedThisTurn]
        .filter(tile => tile.location.y === currentTurnRow)
        .sort((a, b) => a.location.x! - b.location.x!)
    } else if (currentTurnDirection === 'vertical' && currentTurnCol !== null) {
      // Get all tiles in the current column
      sequenceTiles = [...boardTiles, ...tilesPlacedThisTurn]
        .filter(tile => tile.location.x === currentTurnCol)
        .sort((a, b) => a.location.y! - b.location.y!)
    }
    
    if (sequenceTiles.length === 0) return null
    
    const sum = sequenceTiles.reduce((total, tile) => total + getTileValue(tile.id), 0)
    return { tiles: sequenceTiles, sum }
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

    // Check all sequences that contain tiles placed this turn
    tilesPlacedThisTurn.forEach(placedTile => {
      if (placedTile.location.x === undefined || placedTile.location.y === undefined) return
      
      const sequences = getSequencesAtPosition(placedTile.location.x, placedTile.location.y, allTiles)
      sequences.forEach(seq => {
        const hasNewTile = seq.tiles.some(tile => 
          tilesPlacedThisTurn.some(placed => 
            placed.location.x === tile.location.x && placed.location.y === tile.location.y
          )
        )
        
        if (hasNewTile) {
          if (seq.sum % 5 === 0 && seq.sum > 0) {
            hasValidSequence = true
          } else {
            const seqText = `${seq.tiles.map(t => getTileValue(t.id)).join('+')} = ${seq.sum}`
            if (!invalidSequences.includes(seqText)) {
              invalidSequences.push(seqText)
            }
          }
        }
      })
    })

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
      const lengthBonus = seq.tiles.length * 20
      return total + baseScore + lengthBonus
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
      setGameMessage(`${nextPlayer}'s turn! Place tiles in a single row or column that adds to a multiple of 5.`)
    }
    
    // Show turn summary
    const sequenceText = turnSequences.map(seq => 
      `${seq.tiles.map(t => getTileValue(t.id)).join('+')} = ${seq.sum}`
    ).join(', ')
    
    setGameMessage(`🎉 Turn ${turnNumber} complete! Scored ${finalTurnScore} points. ${sequenceText ? `Sequences: ${sequenceText}` : ''} Total: ${newTotalScore}`)
    
    console.log(`🎉 Turn complete! Turn score: ${finalTurnScore}, Total score: ${newTotalScore}`)
    console.log('Valid sequences:', turnSequences.map(seq => 
      `${seq.tiles.map(t => getTileValue(t.id)).join('+')} = ${seq.sum} (${seq.sum * 10 + seq.tiles.length * 20} points)`
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

  const getSequencesAtPosition = (x: number, y: number, tiles: TileItem[]) => {
    const sequences: Array<{ tiles: TileItem[]; sum: number }> = []
    
    // Check horizontal sequence
    const horizontalTiles = []
    
    // Find leftmost position
    let leftX = x
    while (leftX > 0 && tiles.some(tile => tile.location.x === leftX - 1 && tile.location.y === y)) {
      leftX--
    }
    
    // Collect horizontal tiles from left to right
    for (let currentX = leftX; currentX < 7; currentX++) {
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
    }
    
    // Check vertical sequence
    const verticalTiles = []
    
    // Find topmost position
    let topY = y
    while (topY > 0 && tiles.some(tile => tile.location.x === x && tile.location.y === topY - 1)) {
      topY--
    }
    
    // Collect vertical tiles from top to bottom
    for (let currentY = topY; currentY < 7; currentY++) {
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
    }
    
    return sequences
  }

  const isValidPlacement = (x: number, y: number): boolean => {
    // If no tiles placed this turn, must be adjacent to existing tiles
    if (tilesPlacedThisTurn.length === 0) {
      const adjacentPositions = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      ]
      
      const isAdjacent = adjacentPositions.some(pos =>
        boardTiles.some((tile: TileItem) => tile.location.x === pos.x && tile.location.y === pos.y)
      )
      
      if (!isAdjacent) {
        console.log(`Checking placement at (${x},${y}): not adjacent to existing tiles`)
        return false
      }
    }

    // If tiles already placed this turn, check direction constraints
    if (tilesPlacedThisTurn.length > 0) {
      if (currentTurnDirection === 'horizontal' && y !== currentTurnRow) {
        console.log(`Checking placement at (${x},${y}): must be in row ${currentTurnRow}`)
        return false
      }
      
      if (currentTurnDirection === 'vertical' && x !== currentTurnCol) {
        console.log(`Checking placement at (${x},${y}): must be in column ${currentTurnCol}`)
        return false
      }
      
      // If direction hasn't been set yet (only one tile placed), check if this would be valid
      if (currentTurnDirection === null && tilesPlacedThisTurn.length === 1) {
        const firstTile = tilesPlacedThisTurn[0]
        const sameRow = firstTile.location.y === y
        const sameCol = firstTile.location.x === x
        
        if (!sameRow && !sameCol) {
          console.log(`Checking placement at (${x},${y}): must be in same row or column as first tile at (${firstTile.location.x},${firstTile.location.y})`)
          return false
        }
      }
      
      // For subsequent tiles in the turn, they can be placed anywhere in the row/column
      // No need to be adjacent to existing tiles, just in the right row/column
    }

    // Check if row/column would exceed 7 tiles (board size)
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    const tilesInRow = allTiles.filter(tile => tile.location.y === y).length
    const tilesInCol = allTiles.filter(tile => tile.location.x === x).length
    
    if (tilesInRow >= 7) {
      console.log(`Checking placement at (${x},${y}): row ${y} already has 7 tiles (board limit)`)
      return false
    }
    
    if (tilesInCol >= 7) {
      console.log(`Checking placement at (${x},${y}): column ${x} already has 7 tiles (board limit)`)
      return false
    }

    console.log(`Checking placement at (${x},${y}): valid placement`)
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
            {Array.from({ length: 7 }, (_, row) =>
              Array.from({ length: 7 }, (_, col) => {
                const boardTile = boardTiles.find((tile: TileItem) => tile.location.x === col && tile.location.y === row)
                const isCenter = row === 3 && col === 3
                const canPlace = selectedTile && !boardTile && isValidPlacement(col, row)
                const invalidPlace = selectedTile && !boardTile && !isValidPlacement(col, row)
                const isPlacedThisTurn = tilesPlacedThisTurn.some(tile => tile.location.x === col && tile.location.y === row)
                
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
  max-width: 800px;
  height: auto;
  min-height: 600px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  overflow: visible;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 15px;
  height: 400px;
`

const gridStyle = css`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 3px;
  width: 100%;
  max-width: 400px;
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