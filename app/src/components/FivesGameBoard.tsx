/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'
import { NumberTile } from './NumberTile'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

import { GameConfig } from './GameSetup'
import { GameBoard } from './GameBoard'
import { TurnSummaryModal } from './TurnSummaryModal'
import { EndGameModal } from './EndGameModal'

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
  // Performance optimization: debouncing and throttling refs
  const scoreCalculationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastCalculationTimeRef = useRef<number>(0)
  const isCalculatingRef = useRef<boolean>(false)
  const interactionCountRef = useRef<number>(0)
  
  // Circular pattern detection and emergency circuit breaker
  const circularPatternDetectedRef = useRef<boolean>(false)
  const performanceIssueCountRef = useRef<number>(0)
  const lastPerformanceCheckRef = useRef<number>(0)

  // Challenge mode state (only for solo play)
  const [challengeTimer, setChallengeTimer] = useState<number>(0)
  const [moveCount, setMoveCount] = useState<number>(0)
  const [mistakeCount, setMistakeCount] = useState<number>(0)
  const [challengeFailed, setChallengeFailed] = useState<boolean>(false)
  
  // Challenge mode configurations
  const challengeConfig = useMemo(() => {
    if (gameConfig.playerCount !== 1 || !gameConfig.soloChallenge) return null
    
    switch (gameConfig.soloChallenge) {
      case 'speedrun':
        return {
          timeLimit: 300000, // 5 minutes in milliseconds
          showTimer: true,
          description: 'Complete before time runs out!'
        }
      case 'perfectionist':
        return {
          maxMistakes: 0,
          showMistakes: true,
          description: 'No mistakes allowed - every move must be perfect!'
        }
      case 'minimalist':
        return {
          maxMoves: Math.ceil(gameConfig.winningScore / 150), // Rough estimate
          showMoves: true,
          description: 'Use the fewest moves possible!'
        }
      default: // classic
        return {
          description: 'Play at your own pace and enjoy the quilting!'
        }
    }
  }, [gameConfig])

  // Simplified score calculation (reduced timeouts to prevent layout issues)
  const debouncedCalculateScore = useCallback((boardTiles: TileItem[], placedTiles: TileItem[]) => {
    // Prevent infinite loops by checking if we're already calculating
    if (isCalculatingRef.current) {
      return
    }

    // Clear existing timeout
    if (scoreCalculationTimeoutRef.current) {
      clearTimeout(scoreCalculationTimeoutRef.current)
    }

    // Longer delay to reduce frequency and prevent layout shifts
    scoreCalculationTimeoutRef.current = setTimeout(() => {
      performScoreCalculation(boardTiles, placedTiles)
      interactionCountRef.current = 0
    }, 500) // Increased from 100-300ms to 500ms
  }, [])

  // Throttled score calculation (prevents too frequent execution)
  const performScoreCalculation = useCallback((boardTiles: TileItem[], placedTiles: TileItem[]) => {
    const calculationStartTime = Date.now()
    
    // Emergency circuit breaker for circular patterns
    if (circularPatternDetectedRef.current) {
      console.warn('🚨 Circular pattern detected - skipping score calculation')
      return // Don't update state in emergency mode
    }
    
    // Throttle: don't calculate more than once every 150ms
    if (calculationStartTime - lastCalculationTimeRef.current < 150 || isCalculatingRef.current) {
      return
    }

    isCalculatingRef.current = true
    lastCalculationTimeRef.current = calculationStartTime

    try {
      const sequences = calculateTurnSequences(boardTiles, placedTiles)
      const calculationTime = Date.now() - calculationStartTime
      
      // Monitor for performance issues that could indicate circular patterns
      if (calculationTime > 100) {
        performanceIssueCountRef.current += 1
        console.warn(`⚠️ Slow calculation detected: ${calculationTime}ms (issue #${performanceIssueCountRef.current})`)
        
        // If we have multiple performance issues in a short time, activate emergency mode
        if (performanceIssueCountRef.current > 3) {
          circularPatternDetectedRef.current = true
          console.warn('🚨 Multiple performance issues detected - activating emergency mode')
          isCalculatingRef.current = false // Reset flag before return
          return // Don't update state when entering emergency mode
        }
      }
      
      // Reset performance issue counter if we haven't had issues recently
      if (calculationStartTime - lastPerformanceCheckRef.current > 10000) { // 10 seconds
        performanceIssueCountRef.current = 0
        lastPerformanceCheckRef.current = calculationStartTime
      }
      
      const score = sequences.reduce((total, seq) => total + (seq.sum * 10), 0)
      
      // Only update state if values actually changed (prevent unnecessary re-renders)
      setTurnScore(prevScore => prevScore !== score ? score : prevScore)

      // Update message only if score changed significantly or sequences changed
      if (sequences.length > 0 && placedTiles.length <= 3) {
        const previewText = sequences.map(seq => {
          const tileValues = seq.tiles.map(t => getTileValue(t.id)).join('+')
          return `${tileValues} = ${seq.sum}`
        }).join(', ')
        
        const allValid = sequences.every(seq => seq.sum % 5 === 0)
        const statusIcon = allValid ? "✅" : "🔄"
        
        const newMessage = `${statusIcon} ${placedTiles.length} tile(s) placed. Preview: ${previewText}. Potential score: ${score} pts. ${allValid ? "Ready to end turn!" : "Need multiples of 5 to score."} Click green tiles to return them.`
        setGameMessage(prevMessage => prevMessage !== newMessage ? newMessage : prevMessage)
      } else if (placedTiles.length > 3) {
        // For many tiles, show simplified message
        const newMessage = `🔄 ${placedTiles.length} tiles placed. Potential score: ${score} pts. End turn to finalize.`
        setGameMessage(prevMessage => prevMessage !== newMessage ? newMessage : prevMessage)
      }
    } catch (error) {
      console.warn('⚠️ Error in score calculation, possible circular pattern:', error)
      circularPatternDetectedRef.current = true
      // Don't update state on error to prevent infinite loops
    } finally {
      isCalculatingRef.current = false
    }
  }, []) // Empty dependency array to prevent re-creation

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scoreCalculationTimeoutRef.current) {
        clearTimeout(scoreCalculationTimeoutRef.current)
      }
    }
  }, [])

  // Always use local player data for now (bypass GamePark hooks that cause issues)
  const playerName = gameConfig.playerNames[0] || 'Player 1'
  
  // Create initial draw pile scaled from original 36-tile distribution
  const createInitialDrawPile = (): NumberTileId[] => {
    const pile: NumberTileId[] = []
    const totalTilesNeeded = gameConfig.playerCount * gameConfig.tilesPerPlayer + 20 // +20 buffer
    
    // Original 36-tile distribution (Scrabble-like)
    const originalDistribution = {
      [NumberTileId.Zero]: 2,    // 5.56% - rare endpoints
      [NumberTileId.One]: 4,     // 11.11%
      [NumberTileId.Two]: 4,     // 11.11%
      [NumberTileId.Three]: 4,   // 11.11%
      [NumberTileId.Four]: 4,    // 11.11%
      [NumberTileId.Five]: 4,    // 11.11% - key number for multiples of 5
      [NumberTileId.Six]: 4,     // 11.11%
      [NumberTileId.Seven]: 4,   // 11.11%
      [NumberTileId.Eight]: 4,   // 11.11%
      [NumberTileId.Nine]: 2     // 5.56% - rare endpoints
    }
    
    // Calculate scale factor: how many times bigger than 36 tiles we need
    const scaleFactor = totalTilesNeeded / 36
    
    // Scale each tile type proportionally, ensuring at least 1 of each
    const scaledDistribution = Object.fromEntries(
      Object.entries(originalDistribution).map(([tileId, originalCount]) => [
        tileId,
        Math.max(1, Math.round(originalCount * scaleFactor))
      ])
    ) as Record<NumberTileId, number>
    
    // Generate the scaled tiles
    Object.entries(scaledDistribution).forEach(([tileIdStr, count]) => {
      const tileId = parseInt(tileIdStr) as NumberTileId
      for (let i = 0; i < count; i++) {
        pile.push(tileId)
      }
    })
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      const actualTotal = Object.values(scaledDistribution).reduce((sum, count) => sum + count, 0)
      console.log(`🎲 Scaled ${actualTotal} tiles from base 36 (${scaleFactor.toFixed(1)}x scale)`)
      console.log('Distribution:', scaledDistribution)
      console.log(`For ${gameConfig.playerCount} players × ${gameConfig.tilesPerPlayer} tiles each = ${gameConfig.playerCount * gameConfig.tilesPerPlayer} needed`)
    }
    
    // Shuffle the pile thoroughly
    for (let i = pile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pile[i], pile[j]] = [pile[j], pile[i]]
    }
    
    return pile
  }

  // Game state
  const [boardTiles, setBoardTiles] = useState<TileItem[]>([
    { id: NumberTileId.Five, uniqueId: 'center-tile', location: { type: 'Board', x: 7, y: 7 } }
  ])
  
  // Each player has their own hand (always 5 tiles) - CREATE PILE HERE FIRST
  const [playerHands, setPlayerHands] = useState<TileItem[][]>(() => {
    // Create the pile directly here to avoid timing issues
    const initialPile = createInitialDrawPile()
    
    const hands: TileItem[][] = []
    let tileIndex = 0
    
    for (let playerIndex = 0; playerIndex < gameConfig.playerCount; playerIndex++) {
      // Each player starts with 5 tiles in hand
      const playerHand = initialPile.slice(tileIndex, tileIndex + 5).map((tileId: NumberTileId, index: number) => ({
        id: tileId,
        uniqueId: `hand-p${playerIndex}-${Date.now()}-${index}`,
        location: { type: 'Hand', player: `player${playerIndex}` }
      }))
      hands.push(playerHand)
      tileIndex += 5
    }
    
    return hands
  })
  
  // Initialize game state with useMemo to ensure consistency (use same creation function)
  const initialPile = useMemo(() => createInitialDrawPile(), [])
  
  // Each player has their own personal draw pile (remaining tiles from their stake)
  const [playerDrawPiles, setPlayerDrawPiles] = useState<NumberTileId[][]>(() => {
    // Create pile again for draw piles (they need to be consistent)
    const pile = createInitialDrawPile()
    const piles: NumberTileId[][] = []
    let tileIndex = 5 * gameConfig.playerCount // Skip the initial hands
    
    for (let playerIndex = 0; playerIndex < gameConfig.playerCount; playerIndex++) {
      // Each player's remaining tiles (tilesPerPlayer - 5 for their starting hand)
      const remainingTiles = gameConfig.tilesPerPlayer - 5
      const playerPile = pile.slice(tileIndex, tileIndex + remainingTiles)
      piles.push(playerPile)
      tileIndex += remainingTiles
    }
    
    return piles
  })
  
  // Shared draw pile for any remaining tiles (shouldn't be needed but for safety)
  const [drawPile] = useState<NumberTileId[]>(() => 
    initialPile.slice(gameConfig.playerCount * gameConfig.tilesPerPlayer)
  )
  
  const [selectedTile, setSelectedTile] = useState<TileItem | null>(null)
  const [tilesPlacedThisTurn, setTilesPlacedThisTurn] = useState<TileItem[]>([])
  // Separate scores for each player
  const [playerScores, setPlayerScores] = useState<number[]>(() => 
    Array.from({ length: gameConfig.playerCount }, () => 0)
  )
  const [turnScore, setTurnScore] = useState(0)
  const [turnNumber, setTurnNumber] = useState(1)
  // For multiplayer, track current player
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const currentPlayer = gameConfig.playerNames[currentPlayerIndex] || 'Player 1'
  const currentScore = playerScores[currentPlayerIndex] || 0
  const currentPlayerId = `player${currentPlayerIndex}`
  
  // Current player's hand (derived from playerHands)
  const handTiles = playerHands[currentPlayerIndex] || []
  
  // Helper function to update current player's hand
  const updateCurrentPlayerHand = (updater: (prevHand: TileItem[]) => TileItem[]) => {
    setPlayerHands(prev => {
      const newHands = [...prev]
      newHands[currentPlayerIndex] = updater(newHands[currentPlayerIndex] || [])
      return newHands
    })
  }
  
  const [gameMessage, setGameMessage] = useState(
    gameConfig.playerCount === 1 
      ? `Welcome to ${gameConfig.soloChallenge === 'classic' ? 'Solo Practice' : `${gameConfig.soloChallenge?.charAt(0).toUpperCase()}${gameConfig.soloChallenge?.slice(1)} Challenge`}, ${gameConfig.playerNames[0]}! ${challengeConfig?.description || 'Place tiles in rows or columns that sum to multiples of 5.'}`
      : `${currentPlayer}'s turn! Place tiles in a single row or column that adds to a multiple of 5. Max 5 tiles per sequence.`
  )

  // Timer for speedrun mode
  useEffect(() => {
    if (challengeConfig?.showTimer && !challengeFailed) {
      const interval = setInterval(() => {
        setChallengeTimer(prev => {
          const newTime = prev + 1000
          if (challengeConfig.timeLimit && newTime >= challengeConfig.timeLimit) {
            setChallengeFailed(true)
            setGameMessage("⏰ Time's up! Challenge failed. But you can keep playing for practice!")
            clearInterval(interval)
          }
          return newTime
        })
      }, 1000)
      
      return () => clearInterval(interval)
    }
    
    return undefined
  }, [challengeConfig, challengeFailed])

  // Modal states
  const [showTurnSummary, setShowTurnSummary] = useState(false)
  const [showEndGame, setShowEndGame] = useState(false)
  const [lastTurnData, setLastTurnData] = useState<{
    sequences: Array<{ tiles: TileItem[]; sum: number }>
    tilesPlaced: TileItem[]
    turnScore: number
    totalScore: number
  } | null>(null)
  const [gameStartTime] = useState(Date.now())
  
  // Mobile UI state
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false)
  const [isTurnStatusExpanded, setIsTurnStatusExpanded] = useState(false)
  const [isActionsExpanded, setIsActionsExpanded] = useState(false)

  // Performance monitoring disabled to prevent layout issues
  useEffect(() => {
    // Performance monitoring disabled - was causing layout recalculations
    // Only do minimal cleanup without frequent logging
    if (turnNumber % 50 === 0 && turnNumber > 0 && (window as any).gc) {
      // Very infrequent garbage collection hint
      setTimeout(() => (window as any).gc(), 1000)
    }
  }, [turnNumber])

  // Update parent component with game data (simplified to prevent infinite loops)
  useEffect(() => {
    if (onGameDataUpdate) {
      const currentPlayerPile = playerDrawPiles[currentPlayerIndex] || []
      onGameDataUpdate({
        playerScores,
        turnNumber,
        tilesRemaining: currentPlayerPile.length + handTiles.length,
        gameMessage,
        currentPlayerIndex
      })
    }
  }, [turnNumber, currentPlayerIndex]) // Only depend on stable values

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
    
    // Update turn score
    const newSequences = calculateTurnSequences(finalBoardTiles, finalTilesPlacedThisTurn)
    const newTurnScore = newSequences.reduce((total, seq) => total + (seq.sum * 10), 0)
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
    
    // Quick checks during placement for better UX
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
    
    const newBoardTiles = [...boardTiles, newTile]
    
    // Add to tiles placed this turn
    const newTilesPlacedThisTurn = [...tilesPlacedThisTurn, newTile]
    setTilesPlacedThisTurn(newTilesPlacedThisTurn)
    
    setBoardTiles(newBoardTiles)
    updateCurrentPlayerHand(prev => prev.filter(tile => tile.uniqueId !== selectedTile.uniqueId))
    setSelectedTile(null)
    
    // Track move for challenge modes
    if (challengeConfig?.showMoves) {
      setMoveCount(prev => prev + 1)
    }
    
    // Use debounced calculation to reduce performance impact - but avoid infinite loops
    setGameMessage(`🔄 ${newTilesPlacedThisTurn.length} tile(s) placed. Calculating score...`)
     
    // Trigger debounced score calculation only if not already calculating
    if (!isCalculatingRef.current) {
      debouncedCalculateScore(newBoardTiles, newTilesPlacedThisTurn)
    }
  }

  const drawTilesFromPile = (count: number): NumberTileId[] => {
    // Draw from current player's personal pile
    const currentPlayerPile = playerDrawPiles[currentPlayerIndex] || []
    const drawnTiles = currentPlayerPile.slice(0, count)
    
    // Update the current player's draw pile
    setPlayerDrawPiles(prev => {
      const newPiles = [...prev]
      newPiles[currentPlayerIndex] = newPiles[currentPlayerIndex].slice(count)
      return newPiles
    })
    
    return drawnTiles
  }

  const handleEndTurn = () => {
    if (tilesPlacedThisTurn.length === 0) {
      setGameMessage("You must place at least one tile before ending your turn!")
      return
    }

    // Reset circular pattern detection on turn end (recovery mechanism)
    if (circularPatternDetectedRef.current) {
      console.log('🔧 Resetting circular pattern detection on turn end')
      circularPatternDetectedRef.current = false
      performanceIssueCountRef.current = 0
      setGameMessage("🔧 Performance recovery: Circular pattern detection reset. Turn ending...")
    }

    // Performance safeguard: Prevent extremely long games
    if (turnNumber > 100) {
      setGameMessage("🎯 Game completed due to turn limit! Final scores calculated.")
      // Force end game with current scores
      const winners = gameConfig.playerNames[playerScores.indexOf(Math.max(...playerScores))]
      setGameMessage(`🏆 Game Over! Winner: ${winners} with ${Math.max(...playerScores)} points!`)
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
    
    // Reduced logging to prevent performance issues
    // (Detailed logging disabled to prevent layout recalculations)
    
    // Add turn score to current player's total score
    const newTotalScore = currentScore + finalTurnScore
    setPlayerScores(prev => {
      const newScores = [...prev]
      newScores[currentPlayerIndex] = newTotalScore
      return newScores
    })

    // Store turn data for summary modal
    setLastTurnData({
      sequences: turnSequences,
      tilesPlaced: [...tilesPlacedThisTurn], // Copy array
      turnScore: finalTurnScore,
      totalScore: newTotalScore
    })
    
    // Draw new tiles to maintain exactly 5 tiles in hand
    const playerPile = playerDrawPiles[currentPlayerIndex] || []
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
    
    // Reset turn state and clean up memory
    setTilesPlacedThisTurn([])
    setTurnScore(0)
    setTurnNumber(prev => prev + 1)
    
    // Memory optimization reduced frequency to prevent layout issues
    if (turnNumber % 50 === 0) {
      // Less frequent board tile optimization to reduce layout recalculations
      setBoardTiles(prevTiles => 
        prevTiles.map(tile => ({
          ...tile,
          uniqueId: tile.uniqueId.startsWith('center-') ? tile.uniqueId : `optimized-${Date.now()}-${Math.random()}`
        }))
      )
    }
    
    // Switch to next player in multiplayer
    if (gameConfig.playerCount > 1) {
      const nextPlayerIndex = (currentPlayerIndex + 1) % gameConfig.playerCount
      setCurrentPlayerIndex(nextPlayerIndex)
      const nextPlayer = gameConfig.playerNames[nextPlayerIndex] || `Player ${nextPlayerIndex + 1}`
      setGameMessage(`${nextPlayer}'s turn! Place tiles in a single row or column that adds to a multiple of 5. Max 5 tiles per sequence.`)
    }
    
    // Show turn summary with scoring breakdown
    const sequenceText = turnSequences.map(seq => {
      const tileValues = seq.tiles.map(t => getTileValue(t.id)).join('+')
      return `${tileValues} = ${seq.sum} (×10 = ${seq.sum * 10})`
    }).join(', ')
    
    const message = turnSequences.length > 0
      ? `🎉 Turn ${turnNumber} complete! ${sequenceText}. Total turn score: ${finalTurnScore}. Game total: ${newTotalScore}`
      : `🎉 Turn ${turnNumber} complete! Scored ${finalTurnScore} points. Total: ${newTotalScore}`
    
    setGameMessage(message)
    
    // Check for game end conditions
    const currentPlayerPile = playerDrawPiles[currentPlayerIndex] || []
    const isGameEnd = (handTiles.length === 0 && currentPlayerPile.length === 0) || newTotalScore >= gameConfig.winningScore || turnNumber >= 100
    
    if (isGameEnd) {
      // Show end game modal instead of turn summary
      setTimeout(() => setShowEndGame(true), 500) // Small delay for better UX
      
              if (handTiles.length === 0 && currentPlayerPile.length === 0) {
          setGameMessage(`🎯 Game Complete! ${gameConfig.playerNames[currentPlayerIndex]} played all their tiles!`)
      } else if (newTotalScore >= gameConfig.winningScore) {
        setGameMessage(`🏆 Victory! ${newTotalScore} points reached!`)
      } else {
        setGameMessage(`⏰ Game Complete! Turn limit reached.`)
      }
    } else {
      // Show turn summary modal for regular turns
      setTimeout(() => setShowTurnSummary(true), 300) // Small delay for better UX
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
    
    // Draw one tile if possible from personal pile
    const personalPile = playerDrawPiles[currentPlayerIndex] || []
    if (personalPile.length > 0 && handTiles.length < 5) {
      const newTiles = drawTilesFromPile(1)
      const newHandTile = {
        id: newTiles[0],
        uniqueId: `skip-${Date.now()}`,
        location: { type: 'Hand', player: currentPlayerId }
      }
      updateCurrentPlayerHand(prev => [...prev, newHandTile])
    }
    
    // Reset turn state
    setTilesPlacedThisTurn([])
    setTurnScore(0)
    
    setTurnNumber(prev => prev + 1)
    setGameMessage(`Turn skipped. ${penalty > 0 ? `Lost ${penalty} points as penalty.` : ''} Current score: ${newScore}`)
  }

  // Emergency reset function for performance recovery
  const handleEmergencyReset = () => {
    if (window.confirm('⚠️ Emergency Reset: This will clear placed tiles this turn and attempt to recover performance. Continue?')) {
      setTilesPlacedThisTurn([])
      setSelectedTile(null)
      setTurnScore(0)
      
      // Clear any potential memory leaks
      if ((window as any).gc) {
        (window as any).gc()
      }
      
      setGameMessage('🔧 Emergency reset completed. Game state recovered.')
    }
  }

  const handleUndoTurn = () => {
    // Remove all tiles placed this turn and return them to hand
    if (tilesPlacedThisTurn.length === 0) {
      setGameMessage("No tiles to undo!")
      return
    }

    // Track mistake for perfectionist mode
    if (challengeConfig?.showMistakes && tilesPlacedThisTurn.length > 0) {
      const newMistakeCount = mistakeCount + 1
      setMistakeCount(newMistakeCount)
      
      if (challengeConfig.maxMistakes !== undefined && newMistakeCount > challengeConfig.maxMistakes) {
        setChallengeFailed(true)
        setGameMessage("💎 Perfectionist Challenge Failed! No mistakes allowed. But you can keep playing for practice!")
        return
      }
    }

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
    
    console.log('🔄 FIVES UNDO TURN DEBUG:')
    console.log('  - Hand size BEFORE undo:', handTiles.length)
    console.log('  - Tiles placed this turn:', tilesPlacedThisTurn.length)
    console.log('  - Total tiles being returned to hand:', allRemovedTiles.length)
    
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

  const calculateTurnSequences = useMemo(() => {
    return (allTiles: TileItem[], placedTiles: TileItem[]) => {
      const startTime = Date.now()
      const sequences: Array<{ tiles: TileItem[]; sum: number }> = []
      const seenSequences = new Set<string>()
      
      // Circuit breaker for circular patterns and large boards
      if (allTiles.length > 100) {
        console.warn('🔄 Board too large for turn sequence calculation')
        return [] // Return empty sequences for very large boards
      }
      
      if (placedTiles.length > 10) {
        console.warn('🔄 Too many tiles placed in one turn, skipping sequence calculation')
        return [] // Prevent excessive calculation
      }
      
      // Timeout check before starting
      if (Date.now() - startTime > 10) {
        console.warn('⚠️ Turn sequence calculation timeout before start')
        return []
      }
      
      // Create position lookup for O(1) access with duplicate detection
      const positionMap = new Map<string, TileItem>()
      const positionSet = new Set<string>()
      
      allTiles.forEach(tile => {
        if (tile.location.x !== undefined && tile.location.y !== undefined) {
          const posKey = `${tile.location.x},${tile.location.y}`
          
          // Detect duplicate positions (could indicate circular patterns)
          if (positionSet.has(posKey)) {
            console.warn('🔄 Duplicate position in turn sequence calculation:', posKey)
            return // Skip duplicate positions
          }
          
          positionSet.add(posKey)
          positionMap.set(posKey, tile)
        }
      })
      
      // Create placed tiles position set for O(1) lookup 
      const placedPositions = new Set<string>()
      placedTiles.forEach(tile => {
        if (tile.location.x !== undefined && tile.location.y !== undefined) {
          placedPositions.add(`${tile.location.x},${tile.location.y}`)
        }
      })
      
      // Timeout check after position mapping
      if (Date.now() - startTime > 20) {
        console.warn('⚠️ Turn sequence calculation timeout after position mapping')
        return []
      }
      
      try {
        // For each tile placed this turn, check sequences with timeout protection
        for (const placedTile of placedTiles) {
          if (placedTile.location.x === undefined || placedTile.location.y === undefined) continue
          
          // Check timeout for each tile
          if (Date.now() - startTime > 50) {
            console.warn('⚠️ Turn sequence calculation timeout during tile processing')
            break
          }
          
          const x = placedTile.location.x
          const y = placedTile.location.y
          
          // Check horizontal sequence with timeout
          const horizontalKey = `h-${y}`
          if (!seenSequences.has(horizontalKey) && Date.now() - startTime < 40) {
            const horizontalSeq = getHorizontalSequence(x, y, positionMap)
            if (horizontalSeq && horizontalSeq.tiles.length > 1 && 
                horizontalSeq.sum % 5 === 0 && horizontalSeq.sum > 0 &&
                horizontalSeq.tiles.some(tile => placedPositions.has(`${tile.location.x},${tile.location.y}`))) {
              sequences.push(horizontalSeq)
              seenSequences.add(horizontalKey)
            }
          }
          
          // Check vertical sequence with timeout
          const verticalKey = `v-${x}`
          if (!seenSequences.has(verticalKey) && Date.now() - startTime < 45) {
            const verticalSeq = getVerticalSequence(x, y, positionMap)
            if (verticalSeq && verticalSeq.tiles.length > 1 && 
                verticalSeq.sum % 5 === 0 && verticalSeq.sum > 0 &&
                verticalSeq.tiles.some(tile => placedPositions.has(`${tile.location.x},${tile.location.y}`))) {
              sequences.push(verticalSeq)
              seenSequences.add(verticalKey)
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error in turn sequence calculation, likely circular pattern:', error)
        return [] // Return empty sequences on error
      }
      
      // Final timeout check
      if (Date.now() - startTime > 50) {
        console.warn('⚠️ Turn sequence calculation took too long, possible circular pattern')
        return sequences.slice(0, 3) // Return only first few sequences to prevent freezing
      }
      
      return sequences
    }
  }, [])
  
  // Optimized sequence builders with circular pattern protection
  const getHorizontalSequence = (startX: number, y: number, positionMap: Map<string, TileItem>) => {
    // Circuit breaker for circular patterns
    const startTime = Date.now()
    const maxIterations = 10 // Prevent infinite loops
    let iterations = 0
    
    // Find leftmost tile in row with loop protection
    let leftX = startX
    while (leftX > 0 && positionMap.has(`${leftX - 1},${y}`) && iterations < maxIterations) {
      leftX--
      iterations++
      
      // Timeout protection for circular patterns
      if (Date.now() - startTime > 10) {
        console.warn('⚠️ Horizontal sequence detection timeout - circular pattern detected')
        break
      }
    }
    
    // Collect all tiles in horizontal sequence with strict limits
    const tiles: TileItem[] = []
    const visitedPositions = new Set<string>() // Prevent circular revisiting
    
    for (let x = leftX; x < 15 && tiles.length < 5; x++) {
      const posKey = `${x},${y}`
      
      // Circular pattern detection
      if (visitedPositions.has(posKey)) {
        console.warn('🔄 Circular pattern detected in horizontal sequence')
        break
      }
      visitedPositions.add(posKey)
      
      const tile = positionMap.get(posKey)
      if (tile) {
        tiles.push(tile)
      } else {
        break
      }
      
      // Additional timeout check
      if (Date.now() - startTime > 15) {
        console.warn('⚠️ Horizontal sequence collection timeout')
        break
      }
    }
    
    if (tiles.length <= 1) return null
    
    const sum = tiles.reduce((total, tile) => total + getTileValue(tile.id), 0)
    return { tiles, sum }
  }
  
  const getVerticalSequence = (x: number, startY: number, positionMap: Map<string, TileItem>) => {
    // Circuit breaker for circular patterns
    const startTime = Date.now()
    const maxIterations = 10 // Prevent infinite loops
    let iterations = 0
    
    // Find topmost tile in column with loop protection
    let topY = startY
    while (topY > 0 && positionMap.has(`${x},${topY - 1}`) && iterations < maxIterations) {
      topY--
      iterations++
      
      // Timeout protection for circular patterns
      if (Date.now() - startTime > 10) {
        console.warn('⚠️ Vertical sequence detection timeout - circular pattern detected')
        break
      }
    }
    
    // Collect all tiles in vertical sequence with strict limits
    const tiles: TileItem[] = []
    const visitedPositions = new Set<string>() // Prevent circular revisiting
    
    for (let y = topY; y < 15 && tiles.length < 5; y++) {
      const posKey = `${x},${y}`
      
      // Circular pattern detection
      if (visitedPositions.has(posKey)) {
        console.warn('🔄 Circular pattern detected in vertical sequence')
        break
      }
      visitedPositions.add(posKey)
      
      const tile = positionMap.get(posKey)
      if (tile) {
        tiles.push(tile)
      } else {
        break
      }
      
      // Additional timeout check
      if (Date.now() - startTime > 15) {
        console.warn('⚠️ Vertical sequence collection timeout')
        break
      }
    }
    
    if (tiles.length <= 1) return null
    
    const sum = tiles.reduce((total, tile) => total + getTileValue(tile.id), 0)
    return { tiles, sum }
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

  // Helper functions for modal data
  const formatGameTime = () => {
    const totalMs = Date.now() - gameStartTime
    const minutes = Math.floor(totalMs / 60000)
    const seconds = Math.floor((totalMs % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const calculatePlayerStats = (playerIndex: number) => {
    const score = playerScores[playerIndex] || 0
    const turns = Math.max(1, turnNumber - 1) // Avoid division by zero
    return {
      name: gameConfig.playerNames[playerIndex] || `Player ${playerIndex + 1}`,
      score: score,
      turns: turns,
      totalTilesPlaced: boardTiles.length - 1, // Subtract center tile
      longestSequence: 5, // TODO: Calculate actual longest sequence
      averageScore: score / turns
    }
  }

  const determineWinnerAndLoser = () => {
    if (gameConfig.playerCount === 1) {
      return {
        winner: calculatePlayerStats(0),
        loser: undefined
      }
    }

    // Find the player with the highest score
    const maxScore = Math.max(...playerScores)
    const winnerIndex = playerScores.findIndex(score => score === maxScore)
    
    // Find the player with the second highest score (or any other player for loser)
    const loserIndex = playerScores.findIndex((_, index) => index !== winnerIndex)
    
    return {
      winner: calculatePlayerStats(winnerIndex),
      loser: loserIndex !== -1 ? calculatePlayerStats(loserIndex) : undefined
    }
  }

  const generateMockWinnings = (winnerScore: number) => {
    // Mock winnings for demo - in real game this would come from game logic
    const mockTiles: TileItem[] = Array.from({ length: 15 }, (_, i) => ({
      id: (i % 10) as NumberTileId,
      uniqueId: `won-${i}`,
      location: { type: 'Won' }
    }))
    
    return {
      tiles: mockTiles,
      cash: 150.75 + (winnerScore * 0.1)
    }
  }

  // Quick validation for immediate feedback during placement (lightweight with circuit breaker)
  const quickValidatePlacement = (x: number, y: number, tilesPlacedThisTurn: TileItem[], allTiles: TileItem[]) => {
    const startTime = Date.now()
    
    // Circuit breaker: prevent expensive validation on very large boards
    if (allTiles.length > 100) {
      // For very large boards, use minimal validation
      if (x < 0 || x >= 15 || y < 0 || y >= 15) {
        return { isValid: false, error: "Outside board boundaries" }
      }
      return { isValid: true, error: null } // Allow placement, validate on turn end
    }
    
    // Bounds check
    if (x < 0 || x >= 15 || y < 0 || y >= 15) {
      return { isValid: false, error: "Outside board boundaries" }
    }

    // Performance timeout check
    if (Date.now() - startTime > 50) {
      console.warn('⚠️ Validation timeout - allowing placement')
      return { isValid: true, error: null }
    }

    // First move rules
    if (allTiles.length === 0) {
      const isCenterOrAdjacent = (x === 7 && y === 7) || 
        (Math.abs(x - 7) <= 1 && Math.abs(y - 7) <= 1 && (x === 7 || y === 7))
      if (!isCenterOrAdjacent) {
        return { isValid: false, error: "First tile must be on or adjacent to center star" }
      }
      return { isValid: true, error: null }
    }

    // Check adjacency to existing tiles - optimized check with limit (unless islands are allowed)
    if (!gameConfig.allowIslands) {
      const tilesToCheck = allTiles.length > 50 ? allTiles.slice(-30) : allTiles
      const isAdjacent = tilesToCheck.some(tile => {
        const tx = tile.location.x || 0
        const ty = tile.location.y || 0
        return (Math.abs(tx - x) === 1 && ty === y) || (tx === x && Math.abs(ty - y) === 1)
      })
      if (!isAdjacent && allTiles.length <= 50) {
        return { isValid: false, error: "Must be adjacent to existing tiles" }
      }
    }

    // Check contiguity within the turn (tile-agnostic - any tile should follow same pattern)
    if (tilesPlacedThisTurn.length > 0 && tilesPlacedThisTurn.length < 10) {
      const xValues = tilesPlacedThisTurn.map(tile => tile.location.x || 0).concat([x])
      const yValues = tilesPlacedThisTurn.map(tile => tile.location.y || 0).concat([y])
      
      const allSameRow = yValues.every(val => val === yValues[0])
      const allSameCol = xValues.every(val => val === xValues[0])
      
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

  // Comprehensive turn validation (only called on turn end)
  const validateTurnPlacement = (placedTiles: TileItem[], existingTiles: TileItem[]) => {
    if (placedTiles.length === 0) {
      return { isValid: false, error: "No tiles placed" }
    }

    const allTiles = [...existingTiles, ...placedTiles]

    // First move rules
    if (existingTiles.length === 0) {
      const centerOrAdjacent = placedTiles.some(tile => {
        const x = tile.location.x || 0
        const y = tile.location.y || 0
        return (x === 7 && y === 7) || 
               (Math.abs(x - 7) <= 1 && Math.abs(y - 7) <= 1 && (x === 7 || y === 7))
      })
      if (!centerOrAdjacent) {
        return { isValid: false, error: "First tile must be on or adjacent to center star" }
      }
    } else if (!gameConfig.allowIslands) {
      // Check adjacency - at least one placed tile must be adjacent to existing tiles (unless islands are allowed)
      // Optimized with position set for O(1) lookup
      const existingPositions = new Set<string>()
      existingTiles.forEach(tile => {
        const x = tile.location.x || 0
        const y = tile.location.y || 0
        // Add all adjacent positions to the set
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
        return { isValid: false, error: "Tiles must be adjacent to existing tiles on board" }
      }
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

    // Check 5-tile sequence limits - optimized with position map
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

  // Validation caching and throttling for performance
  const validationCacheRef = useRef<Map<string, boolean>>(new Map())

  // Clear validation cache only when needed to prevent memory leaks
  useEffect(() => {
    const clearCacheInterval = setInterval(() => {
      if (validationCacheRef.current.size > 200) { // Higher threshold
        validationCacheRef.current.clear()
      }
    }, 60000) // Every 60 seconds instead of 10

    return () => clearInterval(clearCacheInterval)
  }, [])

  // Lightweight placement validation for visual indicators (tile-agnostic - only checks position rules)
  const isValidPlacement = useCallback((x: number, y: number): boolean => {
    if (!selectedTile) return false
    
    // Use position-only cache key (tile number doesn't matter for basic placement)
    const cacheKey = `${x},${y}-${boardTiles.length}-${tilesPlacedThisTurn.length}`
    if (validationCacheRef.current.has(cacheKey)) {
      return validationCacheRef.current.get(cacheKey)!
    }
    
    // Basic boundary check
    if (x < 0 || x >= 15 || y < 0 || y >= 15) {
      validationCacheRef.current.set(cacheKey, false)
      return false
    }
    
    // Check if position is occupied
    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    const isOccupied = allTiles.some(tile => tile.location.x === x && tile.location.y === y)
    
    if (isOccupied) {
      validationCacheRef.current.set(cacheKey, false)
      return false
    }
    
    // For large boards, skip complex validation to prevent performance issues
    if (allTiles.length > 80) {
      // Simple adjacency check only
      const isAdjacent = allTiles.some(tile => {
        const tx = tile.location.x || 0
        const ty = tile.location.y || 0
        return (Math.abs(tx - x) === 1 && ty === y) || (tx === x && Math.abs(ty - y) === 1)
      })
      const result = allTiles.length === 0 || isAdjacent
      validationCacheRef.current.set(cacheKey, result)
      return result
    }
    
    // Use lightweight validation for smaller boards - THIS IS TILE-AGNOSTIC
    const result = quickValidatePlacement(x, y, tilesPlacedThisTurn, allTiles)
    validationCacheRef.current.set(cacheKey, result.isValid)
    return result.isValid
  }, [selectedTile, boardTiles, tilesPlacedThisTurn])

  // Cached sequence detection with position map, cache management, and circular pattern protection
  const getSequencesAtPosition = useMemo(() => {
    const sequenceCache = new Map<string, Array<{ tiles: TileItem[]; sum: number }>>()
    const MAX_CACHE_SIZE = 500 // Prevent unbounded cache growth
    
    return (x: number, y: number, tiles: TileItem[]) => {
      const startTime = Date.now()
      
      // Circuit breaker for very large boards or circular patterns
      if (tiles.length > 100) {
        console.warn('🔄 Board too large for sequence detection, using simplified mode')
        return [] // Return empty sequences for very large boards
      }
      
      // Use simplified cache key for better performance
      const tileCount = tiles.length
      const cacheKey = `${x},${y}:${tileCount}`
      
      if (sequenceCache.has(cacheKey)) {
        return sequenceCache.get(cacheKey)!
      }
      
      // Manage cache size to prevent memory leaks
      if (sequenceCache.size > MAX_CACHE_SIZE) {
        // Clear oldest entries (simple LRU-like behavior)
        const firstKey = sequenceCache.keys().next().value
        if (firstKey) {
          sequenceCache.delete(firstKey)
        }
      }
      
      const sequences: Array<{ tiles: TileItem[]; sum: number }> = []
      
      // Timeout check before creating position map
      if (Date.now() - startTime > 25) {
        console.warn('⚠️ Sequence detection timeout before position map creation')
        return []
      }
      
      // Create fast position lookup map with circular pattern detection
      const positionMap = new Map<string, TileItem>()
      const positionSet = new Set<string>() // Track duplicates
      
      tiles.forEach(tile => {
        if (tile.location.x !== undefined && tile.location.y !== undefined) {
          const posKey = `${tile.location.x},${tile.location.y}`
          
          // Detect duplicate positions (could indicate circular patterns)
          if (positionSet.has(posKey)) {
            console.warn('🔄 Duplicate position detected, possible circular pattern:', posKey)
            return // Skip duplicate positions
          }
          
          positionSet.add(posKey)
          positionMap.set(posKey, tile)
        }
      })
      
      // Timeout check before sequence calculations
      if (Date.now() - startTime > 30) {
        console.warn('⚠️ Sequence detection timeout before sequence calculations')
        return []
      }
      
      try {
        // Check horizontal sequence using optimized helper with timeout protection
        const horizontalSeq = getHorizontalSequence(x, y, positionMap)
        if (horizontalSeq && Date.now() - startTime < 40) {
          sequences.push(horizontalSeq)
        }
        
        // Check vertical sequence using optimized helper with timeout protection
        const verticalSeq = getVerticalSequence(x, y, positionMap)
        if (verticalSeq && Date.now() - startTime < 50) {
          sequences.push(verticalSeq)
        }
      } catch (error) {
        console.warn('⚠️ Error in sequence detection, likely circular pattern:', error)
        return [] // Return empty sequences on error
      }
      
      // Final timeout check
      if (Date.now() - startTime > 50) {
        console.warn('⚠️ Sequence detection took too long, possible circular pattern')
        return [] // Don't cache potentially problematic results
      }
      
      // Cache the result only if calculation completed successfully
      sequenceCache.set(cacheKey, sequences)
      return sequences
    }
  }, [])



  return (
    <div css={gameContainerStyle}>
      <Global styles={globalStyles} />
      
      {/* Game Content */}
      <div css={gameContentStyle}>
        {/* Header */}
        <div css={headerStyle}>
          <div css={headerMainStyle}>
            <h2 css={titleStyle}>🎮 FIVES</h2>
            <div css={headerEssentialStyle}>
              <span css={currentPlayerStyle}>
                {gameConfig.playerCount === 1 
                  ? playerName || 'Solo' 
                  : currentPlayer
                }
              </span>
              <span css={scoreStyle}>{currentScore}pts</span>
              <button 
                css={expandButtonStyle}
                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              >
                {isHeaderExpanded ? '▼' : '▶'}
              </button>
            </div>
          </div>
          {isHeaderExpanded && (
            <div css={headerExpandedStyle}>
              <div css={playerInfoStyle}>
                <span>Turn: {turnNumber}</span>
                <span>Draw Pile: {drawPile.length}</span>
                <span>Hand: {handTiles.length}</span>
                {selectedTile && <span>Selected: {getTileValue(selectedTile.id)}</span>}
                {challengeConfig?.showTimer && (
                  <span css={challengeTimerStyle}>
                    ⏰ {Math.floor((challengeConfig.timeLimit! - challengeTimer) / 60000)}:{String(Math.floor(((challengeConfig.timeLimit! - challengeTimer) % 60000) / 1000)).padStart(2, '0')}
                  </span>
                )}
                {challengeConfig?.showMoves && (
                  <span css={challengeCounterStyle}>
                    🎯 Moves: {moveCount}{challengeConfig.maxMoves ? `/${challengeConfig.maxMoves}` : ''}
                  </span>
                )}
                {challengeConfig?.showMistakes && (
                  <span css={challengeCounterStyle}>
                    💎 Mistakes: {mistakeCount}/{challengeConfig.maxMistakes || '∞'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Game Message */}
        <div css={gameMessageStyle}>
          {gameMessage}
        </div>
        

        
        {/* Game Board */}
        <div css={gameBoardWrapperStyle}>
          {/* Turn Status - positioned over the board */}
          {tilesPlacedThisTurn.length > 0 && (
            <div css={turnStatusStyle}>
              <div css={turnStatusMainStyle}>
                <span css={turnStatusEssentialStyle}>
                  {tilesPlacedThisTurn.length} tiles • {turnScore}pts
                </span>
                <button 
                  css={expandButtonStyle}
                  onClick={() => setIsTurnStatusExpanded(!isTurnStatusExpanded)}
                >
                  {isTurnStatusExpanded ? '▼' : '▶'}
                </button>
              </div>
              {isTurnStatusExpanded && (
                <div css={turnStatusExpandedStyle}>
                  {turnScore > 0 && (
                    <div style={{ fontSize: '11px', opacity: 0.9 }}>
                      {(() => {
                        // Simplified display to prevent layout calculations during render
                        return `${tilesPlacedThisTurn.length} tiles placed - ${turnScore}pts - End turn to finalize`
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <GameBoard
            boardTiles={boardTiles}
            tilesPlacedThisTurn={tilesPlacedThisTurn}
            selectedTile={selectedTile}
            onBoardClick={handleBoardClick}
            onPlacedTileClick={handlePlacedTileClick}
            isValidPlacement={isValidPlacement}
          />
        </div>
        
        {/* Player Hand */}
        <div css={handStyle}>
          <div css={handHeaderStyle}>
            <div css={handHeaderMainStyle}>
              <div css={handLabelStyle}>YOUR HAND</div>
              <div css={handEssentialActionsStyle}>
                {tilesPlacedThisTurn.length > 0 && (
                  <button css={endTurnButtonCompactStyle} onClick={handleEndTurn}>
                    End ({turnScore}pts)
                  </button>
                )}
                <button 
                  css={expandButtonStyle}
                  onClick={() => setIsActionsExpanded(!isActionsExpanded)}
                >
                  {isActionsExpanded ? '▼' : '▶'}
                </button>
              </div>
            </div>
            {isActionsExpanded && (
              <div css={handActionsExpandedStyle}>
                <div css={actionButtonsStyle}>
                  {tilesPlacedThisTurn.length > 0 && (
                    <button css={undoTurnButtonStyle} onClick={handleUndoTurn}>
                      Undo Turn
                    </button>
                  )}
                  <button css={skipTurnButtonStyle} onClick={handleSkipTurn}>
                    Skip Turn
                  </button>
                  {turnNumber > 20 && (
                    <button css={emergencyResetButtonStyle} onClick={handleEmergencyReset}>
                      🔧 Reset
                    </button>
                  )}
                </div>
              </div>
            )}
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
                    isPlaced={false}
                    useTextures={true}
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

      {/* Turn Summary Modal */}
      {lastTurnData && (
        <TurnSummaryModal
          isOpen={showTurnSummary}
          onClose={() => setShowTurnSummary(false)}
          turnNumber={turnNumber - 1}
          playerName={currentPlayer}
          tilesPlaced={lastTurnData.tilesPlaced}
          sequences={lastTurnData.sequences}
          turnScore={lastTurnData.turnScore}
          totalScore={lastTurnData.totalScore}
        />
      )}

      {/* End Game Modal */}
      {(() => {
        const { winner, loser } = determineWinnerAndLoser()
        return (
          <EndGameModal
            isOpen={showEndGame}
            onClose={() => setShowEndGame(false)}
            winner={winner}
            loser={loser}
            gameStats={{
              totalTurns: turnNumber - 1,
              totalTilesPlaced: boardTiles.length - 1,
              totalSequences: Math.floor((boardTiles.length - 1) / 2), // Rough estimate
              gameTime: formatGameTime()
            }}
            potValue={350.50} // Mock pot value
            winnings={generateMockWinnings(winner.score)}
          />
        )
      })()}
    </div>
  )
}

// Contained, consistent styles
const gameContainerStyle = css`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: 
    "header"
    "board"
    "hand";
  overflow: hidden;
  gap: 12px;
`

const gameContentStyle = css`
  display: contents; /* Let child elements participate in parent grid */
`

const headerStyle = css`
  grid-area: header;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
`

const headerMainStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
`

const titleStyle = css`
  margin: 0;
  color: white;
  font-size: 20px;
  font-weight: 700;
`

const headerEssentialStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
`

const currentPlayerStyle = css`
  color: #a7d129; // A vibrant green
  font-weight: bold;
`;

const scoreStyle = css`
  color: #FFD700;
  font-size: 16px;
  font-weight: 900;
  background: rgba(0,0,0,0.3);
  padding: 4px 10px;
  border-radius: 6px;
`

const expandButtonStyle = css`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 0 5px;
`;

const headerExpandedStyle = css`
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const playerInfoStyle = css`
  display: flex;
  justify-content: space-around;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`;

const gameMessageStyle = css`
  display: none; /* Hide the separate message bar for a cleaner look */
`

const turnStatusStyle = css`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  padding: 6px 12px;
`

const turnStatusMainStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
`

const turnStatusEssentialStyle = css`
  font-size: 12px;
  font-weight: 600;
`

const turnStatusExpandedStyle = css`
  padding-top: 6px;
  margin-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const gameBoardWrapperStyle = css`
  grid-area: board;
  overflow: hidden;
  min-height: 0; /* Important for grid children */
  display: flex;
`

const handStyle = css`
  grid-area: hand;
  background: rgba(139, 69, 19, 0.3);
  border-top: 2px solid rgba(255, 215, 0, 0.2);
  min-height: 120px;
  max-height: 160px;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 8px;
`

const handHeaderStyle = css`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`

const handHeaderMainStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const handLabelStyle = css`
  color: #F5E6A3;
  font-size: 14px;
  font-weight: 700;
`

const handEssentialActionsStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const handActionsExpandedStyle = css`
  width: 100%;
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const handTilesStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
  min-height: 0;
`

const actionButtonsStyle = css`
  display: flex;
  gap: 8px;
  align-items: center;
`

const endTurnButtonCompactStyle = css`
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(76, 175, 80, 0.4);
  }
`

const undoTurnButtonStyle = css`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: white;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
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

const emergencyResetButtonStyle = css`
  background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #D32F2F 0%, #F44336 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const challengeTimerStyle = css`
  color: #FFD700;
  font-size: 12px;
  font-weight: 700;
  margin-left: 10px;
`

const challengeCounterStyle = css`
  color: #a7d129;
  font-size: 12px;
  font-weight: 700;
  margin-left: 10px;
`