/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import type { GameConfig } from '../GameDisplay'
import { NewAgeTile } from './NewAgeTile'
import { NewAgePlayerPanel } from './NewAgePlayerPanel'
import { NewAgeGameHeader } from './NewAgeGameHeader'
import { NewAgeEndGameModal } from './NewAgeEndGameModal'
import { NumberTileId, GameParkUtils } from '../gamepark'
import { useGameCache } from '../hooks/useGameCache'
import { useBlockchainGame } from '../hooks/useBlockchainGame'

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
  // New fields for player tracking and tile states
  playerId?: number
  placedByPlayer?: number
  placedOnTurn?: number
  state?: 'unplayed' | 'played' | 'burning' | 'empty'
  countdownTurns?: number
  isBurning?: boolean
  burnStartTurn?: number
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
  // New fields for tile state management
  burningTiles: TileItem[]
  playerTileCounts: number[]
}

interface NewAgeGameBoardProps {
  gameConfig: GameConfig
  onBackToSetup: () => void
  blockchainGameId?: number
  mode?: 'local' | 'blockchain'
}

export function NewAgeGameBoard({ 
  gameConfig, 
  onBackToSetup, 
  blockchainGameId, 
  mode = 'local' 
}: NewAgeGameBoardProps) {
  
  const blockchainGame = useBlockchainGame()
  const [isBlockchainMode] = useState(mode === 'blockchain' && blockchainGameId)
  
  const { 
    placedTiles: cachedTiles, 
    currentGame: cachedGame, 
    allPlayersScores: cachedScores,
    playerInfo: cachedPlayerInfo,
    isLoading: cacheLoading,
    error: cacheError,
    refreshData: refreshCache
  } = useGameCache({
    blockchainGameId: blockchainGameId || 0,
    contractAddress: blockchainGame.contractAddress || '',
    networkName: blockchainGame.networkName || 'Base Sepolia',
    chainId: blockchainGame.currentNetwork || 84532
  })
  
  const [blockchainError, setBlockchainError] = useState<string | null>(null)
  const [isSubmittingMove, setIsSubmittingMove] = useState(false)

  const createInitialDrawPile = (): NumberTileId[] => {
    const pile: NumberTileId[] = []
    const totalTilesNeeded = gameConfig.playerCount * gameConfig.tilesPerPlayer + 20
    
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
    
    for (let i = pile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pile[i], pile[j]] = [pile[j], pile[i]]
    }
    
    return pile
  }

  function initializeGame(config: GameConfig): GameState {
    const initialPile = createInitialDrawPile()
    
    const boardTiles: TileItem[] = [
      { id: NumberTileId.Five, uniqueId: 'center-tile', location: { type: 'Board', x: 7, y: 7 } }
    ]
    
    const playerHands: TileItem[][] = []
    const playerDrawPiles: NumberTileId[][] = []
    let tileIndex = 0
    
    for (let playerIndex = 0; playerIndex < config.playerCount; playerIndex++) {
      const playerHand = initialPile.slice(tileIndex, tileIndex + 5).map((tileId: NumberTileId, index: number) => ({
        id: tileId,
        uniqueId: `hand-p${playerIndex}-${Date.now()}-${index}`,
        location: { type: 'Hand', player: `player${playerIndex}` }
      }))
      playerHands.push(playerHand)
      tileIndex += 5
      
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
      turnScore: 0,
      // New fields for tile state management
      burningTiles: [],
      playerTileCounts: Array(config.playerCount).fill(0)
    }
  }

  const initialGameData = useMemo(() => {
    if (isBlockchainMode && cachedGame) {
      return initializeGameFromBlockchain(cachedGame, cachedTiles, cachedPlayerInfo)
    }
    return initializeGame(gameConfig)
  }, [gameConfig, isBlockchainMode, cachedGame, cachedTiles, cachedPlayerInfo])

  function initializeGameFromBlockchain(blockchainGame: any, tiles: any[], playerInfo: any): GameState {
    console.log('🔄 Converting blockchain data to local format:', {
      blockchainGame,
      tiles: tiles?.length || 0,
      playerInfo
    })

    const boardTiles: TileItem[] = (tiles || []).map((tile, index) => ({
      id: tile.number as NumberTileId,
      uniqueId: `blockchain-tile-${index}`,
      location: { type: 'Board', x: tile.x, y: tile.y }
    }))

    const playerHands: TileItem[][] = []
    const playerDrawPiles: NumberTileId[][] = []
    
    for (let playerIndex = 0; playerIndex < blockchainGame.maxPlayers; playerIndex++) {
      if (playerIndex === 0 && playerInfo?.hand) {
        const playerHand = playerInfo.hand.map((tileNumber: number, index: number) => ({
          id: tileNumber as NumberTileId,
          uniqueId: `blockchain-hand-${index}`,
          location: { type: 'Hand', player: `player${playerIndex}` }
        }))
        playerHands.push(playerHand)
      } else {
        playerHands.push([])
      }
      playerDrawPiles.push([])
    }

    return {
      boardTiles,
      playerHands,
      playerDrawPiles,
      currentPlayer: blockchainGame.currentPlayerIndex || 0,
      scores: blockchainGame.playerScores || [0],
      turnNumber: blockchainGame.turnNumber || 1,
      gameMessage: `Blockchain Game ${blockchainGameId} - Turn ${blockchainGame.turnNumber}`,
      selectedTile: null,
      gameEnded: blockchainGame.state === 2,
      winner: null,
      tilesPlacedThisTurn: [],
      turnScore: 0,
      // New fields for tile state management
      burningTiles: [],
      playerTileCounts: Array(blockchainGame.maxPlayers).fill(0)
    }
  }

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
  // New state for tile management
  const [burningTiles, setBurningTiles] = useState<TileItem[]>([])
  const [playerTileCounts, setPlayerTileCounts] = useState<number[]>(Array(gameConfig.playerCount).fill(0))

  useEffect(() => {
    if (isBlockchainMode && cachedGame && cachedTiles) {
      console.log('🔄 Updating local state from blockchain cache')
      const blockchainGameState = initializeGameFromBlockchain(cachedGame, cachedTiles, cachedPlayerInfo)
      
      setBoardTiles(blockchainGameState.boardTiles)
      setPlayerHands(blockchainGameState.playerHands)
      setCurrentPlayer(blockchainGameState.currentPlayer)
      setScores(blockchainGameState.scores)
      setTurnNumber(blockchainGameState.turnNumber)
      setGameMessage(blockchainGameState.gameMessage)
      setGameEnded(blockchainGameState.gameEnded)
      setBurningTiles(blockchainGameState.burningTiles)
      setPlayerTileCounts(blockchainGameState.playerTileCounts)
      
      setTilesPlacedThisTurn([])
      setTurnScore(0)
      setSelectedTile(null)
    }
  }, [isBlockchainMode, cachedGame, cachedTiles, cachedPlayerInfo, blockchainGameId])

  useEffect(() => {
    if (cacheError) {
      setBlockchainError(cacheError)
      setGameMessage(`Blockchain Error: ${cacheError}`)
    } else {
      setBlockchainError(null)
    }
  }, [cacheError])

  const boardContainerRef = useRef<HTMLDivElement>(null)
  const [boardOffset, setBoardOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - boardOffset.x, y: e.clientY - boardOffset.y })
    }
  }, [boardOffset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      const clampedX = Math.max(-200, Math.min(200, newX))
      const clampedY = Math.max(-200, Math.min(200, newY))
      setBoardOffset({ x: clampedX, y: clampedY })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const resetBoardPosition = useCallback(() => {
    setBoardOffset({ x: 0, y: 0 })
  }, [])

  const handleRefreshBlockchain = useCallback(async () => {
    if (!isBlockchainMode) return
    
    try {
      console.log('🔄 Refreshing blockchain data...')
      await refreshCache()
      setGameMessage('Blockchain data refreshed!')
    } catch (error) {
      console.error('❌ Failed to refresh blockchain data:', error)
      setGameMessage(`Failed to refresh: ${error.message}`)
    }
  }, [isBlockchainMode, refreshCache])

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

  // Helper functions for tile state management
  const getTileState = (tile: TileItem): 'unplayed' | 'played' | 'burning' | 'empty' => {
    if (tile.state) return tile.state
    
    // Check if tile is burning
    if (tile.isBurning && tile.burnStartTurn) {
      const turnsSinceBurn = turnNumber - tile.burnStartTurn
      if (turnsSinceBurn >= 3) {
        return 'empty' // Tile has burnt out
      }
      return 'burning'
    }
    
    // Check if tile is placed this turn
    const isPlacedThisTurn = tilesPlacedThisTurn.some(placedTile => 
      placedTile.location.x === tile.location.x && 
      placedTile.location.y === tile.location.y
    )
    
    return isPlacedThisTurn ? 'unplayed' : 'played'
  }

  const getTileCountdown = (tile: TileItem): number | undefined => {
    if (tile.isBurning && tile.burnStartTurn) {
      const turnsSinceBurn = turnNumber - tile.burnStartTurn
      const remainingTurns = 3 - turnsSinceBurn
      return remainingTurns > 0 ? remainingTurns : undefined
    }
    return tile.countdownTurns
  }

  const updatePlayerTileCounts = useCallback(() => {
    const counts = Array(gameConfig.playerCount).fill(0)
    
    // Count tiles on board by player
    boardTiles.forEach(tile => {
      if (tile.placedByPlayer !== undefined && tile.placedByPlayer >= 0) {
        counts[tile.placedByPlayer]++
      }
    })
    
    setPlayerTileCounts(counts)
  }, [boardTiles, gameConfig.playerCount])

  const startTileBurning = useCallback((tile: TileItem) => {
    const burningTile: TileItem = {
      ...tile,
      isBurning: true,
      burnStartTurn: turnNumber,
      state: 'burning',
      countdownTurns: 3
    }
    
    setBurningTiles(prev => [...prev, burningTile])
    
    // Update the tile in boardTiles
    setBoardTiles(prev => prev.map(t => 
      t.uniqueId === tile.uniqueId ? burningTile : t
    ))
  }, [turnNumber])

  const processBurningTiles = useCallback(() => {
    const newBurningTiles: TileItem[] = []
    const tilesToRemove: TileItem[] = []
    
    burningTiles.forEach(tile => {
      if (tile.burnStartTurn && (turnNumber - tile.burnStartTurn) >= 3) {
        // Tile has burnt out
        tilesToRemove.push(tile)
      } else {
        newBurningTiles.push(tile)
      }
    })
    
    setBurningTiles(newBurningTiles)
    
    // Remove burnt tiles from board
    if (tilesToRemove.length > 0) {
      setBoardTiles(prev => prev.filter(tile => 
        !tilesToRemove.some(burntTile => burntTile.uniqueId === tile.uniqueId)
      ))
    }
  }, [burningTiles, turnNumber])

  // Update player tile counts when board changes
  useEffect(() => {
    updatePlayerTileCounts()
  }, [boardTiles, updatePlayerTileCounts])

  // Process burning tiles at the start of each turn
  useEffect(() => {
    if (turnNumber > 1) {
      processBurningTiles()
    }
  }, [turnNumber, processBurningTiles])

  const handTiles = playerHands[currentPlayer] || []
  const currentPlayerId = `player${currentPlayer}`
  
  const updateCurrentPlayerHand = (updater: (prevHand: TileItem[]) => TileItem[]) => {
    setPlayerHands(prev => {
      const newHands = [...prev]
      newHands[currentPlayer] = updater(newHands[currentPlayer] || [])
      return newHands
    })
  }

  const drawTilesFromPile = (count: number): NumberTileId[] => {
    const currentPlayerPile = playerDrawPiles[currentPlayer] || []
    const drawnTiles = currentPlayerPile.slice(0, count)
    
    setPlayerDrawPiles(prev => {
      const newPiles = [...prev]
      newPiles[currentPlayer] = newPiles[currentPlayer].slice(count)
      return newPiles
    })
    
    return drawnTiles
  }

  const submitMoveToBlockchain = async (placements: TileItem[]) => {
    if (!isBlockchainMode || !blockchainGameId) return false
    
    setIsSubmittingMove(true)
    try {
      console.log('🔗 Submitting move to blockchain...', placements)
      
      const tilePlacements = placements.map(tile => ({
        number: getTileValue(tile.id),
        x: tile.location.x!,
        y: tile.location.y!
      }))
      
      const txHash = await blockchainGame.playTurn(blockchainGameId, tilePlacements)
      console.log('✅ Move submitted to blockchain:', txHash)
      
      setTimeout(() => {
        refreshCache()
      }, 2000)
      
      return true
    } catch (error) {
      console.error('❌ Failed to submit move to blockchain:', error)
      setGameMessage(`Failed to submit move: ${error.message}`)
      return false
    } finally {
      setIsSubmittingMove(false)
    }
  }

  const handleTileSelect = (tile: TileItem) => {
    console.log('🎯 TILE SELECTED:')
    console.log('  - Tile value:', getTileValue(tile.id))
    console.log('  - Tile uniqueId:', tile.uniqueId)
    console.log('  - Current hand size:', handTiles.length)
    console.log('  - Hand uniqueIds:', handTiles.map(t => t.uniqueId))
    setSelectedTile(tile)
  }

  const getConnectedTiles = (allTiles: TileItem[]) => {
    if (allTiles.length <= 1) return allTiles
    
    const centerTile = allTiles.find(tile => tile.location.x === 7 && tile.location.y === 7)
    const startTile = centerTile || allTiles[0]
    
    if (!startTile) return []
    
    const positionMap = new Map<string, TileItem>()
    allTiles.forEach(tile => {
      if (tile.location.x !== undefined && tile.location.y !== undefined) {
        positionMap.set(`${tile.location.x},${tile.location.y}`, tile)
      }
    })
    
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

  const handleBoardClick = (x: number, y: number) => {
    if (!selectedTile) {
      setGameMessage("Select a thread from your hand first!")
      return
    }

    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    const existingTile = allTiles.find(tile => tile.location.x === x && tile.location.y === y)
    
    if (existingTile) {
      setGameMessage("Position already occupied!")
      return
    }

    const validationResult = isValidMathematicalPlacement(x, y, getTileValue(selectedTile.id), allTiles, tilesPlacedThisTurn)
    if (!validationResult.valid) {
      setGameMessage(`🚫 ${validationResult.reason}`)
      return
    }

    const placedTile: TileItem = {
      id: selectedTile.id,
      uniqueId: selectedTile.uniqueId,
      location: { type: 'board', x, y },
      playerId: currentPlayer,
      placedByPlayer: currentPlayer,
      placedOnTurn: turnNumber,
      state: 'unplayed'
    }

    setTilesPlacedThisTurn(prev => [...prev, placedTile])
    
    updateCurrentPlayerHand(prevHand => 
      prevHand.filter(tile => tile.uniqueId !== selectedTile.uniqueId)
    )

    setSelectedTile(null)
    setGameMessage(`Thread placed at (${x}, ${y})`)
  }

  const handlePlacedTileClick = (tile: TileItem) => {
    const isPlacedThisTurn = tilesPlacedThisTurn.some(placedTile => 
      placedTile.location.x === tile.location.x && 
      placedTile.location.y === tile.location.y
    )
    
    if (!isPlacedThisTurn) return
    
    const newTilesPlacedThisTurn = tilesPlacedThisTurn.filter(placedTile => 
      !(placedTile.location.x === tile.location.x && placedTile.location.y === tile.location.y)
    )
    
    if (gameConfig.allowIslands) {
      setTilesPlacedThisTurn(newTilesPlacedThisTurn)
      
      const returnedTile = {
        ...tile,
        location: { type: 'Hand', player: currentPlayerId }
      }
      console.log('🏠 RETURNING TILE TO HAND (Islands mode):')
      console.log('  - Tile value:', getTileValue(returnedTile.id))
      console.log('  - Tile uniqueId:', returnedTile.uniqueId)
      console.log('  - Hand size before:', handTiles.length)
      updateCurrentPlayerHand(prev => {
        const newHand = [...prev, returnedTile]
        console.log('  - Hand size after:', newHand.length)
        console.log('  - Hand uniqueIds:', newHand.map(t => t.uniqueId))
        return newHand
      })
      
      const finalAllTiles = [...boardTiles, ...newTilesPlacedThisTurn]
      const turnSequences = calculateTurnSequences(finalAllTiles, newTilesPlacedThisTurn)
      const newTurnScore = turnSequences.reduce((total, seq) => total + (seq.sum * 10), 0)
      setTurnScore(newTurnScore)
      
      let message = `Returned ${getTileValue(tile.id)} tile to hand.`
      if (newTilesPlacedThisTurn.length > 0) {
        message += ` Click green tiles to return them or end turn when ready.`
      } else {
        message += ` End turn when ready.`
      }
      setGameMessage(message)
      return
    }
    
    const allRemainingTiles = [...boardTiles, ...newTilesPlacedThisTurn]
    
    const connectedTiles = getConnectedTiles(allRemainingTiles)
    const connectedPositions = new Set(
      connectedTiles.map(t => `${t.location.x},${t.location.y}`)
    )
    
    const finalBoardTiles = boardTiles.filter(boardTile =>
      connectedPositions.has(`${boardTile.location.x},${boardTile.location.y}`)
    )
    
    const finalTilesPlacedThisTurn = newTilesPlacedThisTurn.filter(placedTile =>
      connectedPositions.has(`${placedTile.location.x},${placedTile.location.y}`)
    )
    
    const removedBoardTiles = boardTiles.filter(boardTile =>
      !connectedPositions.has(`${boardTile.location.x},${boardTile.location.y}`)
    )
    
    const removedPlacedTiles = newTilesPlacedThisTurn.filter(placedTile =>
      !connectedPositions.has(`${placedTile.location.x},${placedTile.location.y}`)
    )
    
    setBoardTiles(finalBoardTiles)
    setTilesPlacedThisTurn(finalTilesPlacedThisTurn)
    
    const returnedTile = {
      ...tile,
      location: { type: 'Hand', player: currentPlayerId }
    }
    
    const allRemovedTiles = [returnedTile, ...removedBoardTiles, ...removedPlacedTiles].map(t => ({
      ...t,
      location: { type: 'Hand', player: currentPlayerId }
    }))
    
    updateCurrentPlayerHand(prev => {
      const newHand = [...prev, ...allRemovedTiles]
      console.log('🏠 RETURNING TILE TO HAND (Non-Islands mode):')
      console.log('  - Tile value:', getTileValue(returnedTile.id))
      console.log('  - Tile uniqueId:', returnedTile.uniqueId)
      console.log('  - Hand size before:', handTiles.length)
      console.log('  - Hand size after:', newHand.length)
      console.log('  - Hand uniqueIds:', newHand.map(t => t.uniqueId))
      return newHand
    })
    
    const finalAllTiles = [...finalBoardTiles, ...finalTilesPlacedThisTurn]
    const turnSequences = calculateTurnSequences(finalAllTiles, finalTilesPlacedThisTurn)
    const newTurnScore = turnSequences.reduce((total, seq) => total + (seq.sum * 10), 0)
    setTurnScore(newTurnScore)
    
    const totalRemoved = allRemovedTiles.length
    let message = `Returned ${getTileValue(tile.id)} tile to hand.`
    
    if (totalRemoved > 1) {
      message += ` Also removed ${totalRemoved - 1} orphaned tile(s) that became disconnected.`
    }
    
    if (finalTilesPlacedThisTurn.length > 0) {
      message += ` Click green tiles to return them or end turn when ready.`
    } else {
      message += ` End turn when ready.`
    }
    
    setGameMessage(message)
  }

  const triggerTileBurning = useCallback((tile: TileItem) => {
    // Random chance for tiles to start burning (10% chance)
    if (Math.random() < 0.1) {
      startTileBurning(tile)
      setGameMessage(`🔥 ${getTileValue(tile.id)} tile has caught fire! It will burn out in 3 turns.`)
    }
  }, [startTileBurning])

  const handleEndTurn = () => {
    if (tilesPlacedThisTurn.length === 0) {
      setGameMessage("You must place at least one tile before ending your turn!")
      return
    }

    if (isBlockchainMode) {
      handleBlockchainEndTurn()
      return
    }

    const allTiles = [...boardTiles, ...tilesPlacedThisTurn]
    
    for (const placedTile of tilesPlacedThisTurn) {
      const validation = isValidMathematicalPlacement(
        placedTile.location.x!, 
        placedTile.location.y!, 
        getTileValue(placedTile.id), 
        boardTiles, 
        tilesPlacedThisTurn.filter(t => t !== placedTile)
      )
      if (!validation.valid) {
        setGameMessage(`🚫 Invalid placement: ${validation.reason}`)
        return
      }
    }
    
    const turnSequences = calculateTurnSequences(allTiles, tilesPlacedThisTurn)
    const finalTurnScore = turnSequences.reduce((total, seq) => total + (seq.sum * 10), 0)
    
    if (turnSequences.length === 0) {
      setGameMessage("🚫 Invalid turn: No valid sequences found. All sequences must sum to multiples of 5.")
      return
    }
    
    const newScores = [...scores]
    newScores[currentPlayer] += finalTurnScore
    setScores(newScores)

    // Update tiles with player tracking and check for burning
    const updatedTilesPlacedThisTurn = tilesPlacedThisTurn.map(tile => {
      const updatedTile = {
        ...tile,
        state: 'played' as const,
        playerId: currentPlayer,
        placedByPlayer: currentPlayer,
        placedOnTurn: turnNumber
      }
      
      // Check if tile should start burning
      triggerTileBurning(updatedTile)
      
      return updatedTile
    })

    const newBoardTiles = [...boardTiles, ...updatedTilesPlacedThisTurn]
    setBoardTiles(newBoardTiles)

    const playerPile = playerDrawPiles[currentPlayer] || []
    const tilesNeeded = Math.min(5 - handTiles.length, playerPile.length)
    if (tilesNeeded > 0) {
      const newTiles = drawTilesFromPile(tilesNeeded)
      const newHandTiles = newTiles.map((tileId, index) => ({
        id: tileId,
        uniqueId: `refill-${Date.now()}-${index}`,
        location: { type: 'Hand', player: currentPlayerId },
        state: 'unplayed' as const
      }))
      updateCurrentPlayerHand(prev => [...prev, ...newHandTiles])
    }
    
    setTilesPlacedThisTurn([])
    setTurnScore(0)
    setSelectedTile(null)
    
    const allPlayersOutOfTiles = Array.from({ length: gameConfig.playerCount }, (_, i) => {
      const playerHand = i === currentPlayer ? handTiles : (playerHands[i] || [])
      const playerPile = playerDrawPiles[i] || []
      return playerHand.length === 0 && playerPile.length === 0
    }).every(isEmpty => isEmpty)
    
    const isGameEnd = allPlayersOutOfTiles || turnNumber >= 200

    let nextPlayer = currentPlayer
    let newTurnNumber = turnNumber
    
    if (!isGameEnd && gameConfig.playerCount > 1) {
      nextPlayer = (currentPlayer + 1) % gameConfig.playerCount
      if (nextPlayer === 0) {
        newTurnNumber = turnNumber + 1
      }
    } else if (!isGameEnd && gameConfig.playerCount === 1) {
      newTurnNumber = turnNumber + 1
    }
    
    setCurrentPlayer(nextPlayer)
    setTurnNumber(newTurnNumber)

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

  const handleBlockchainEndTurn = async () => {
    if (isSubmittingMove) return
    
    try {
      setGameMessage("Submitting move to blockchain...")
      const success = await submitMoveToBlockchain(tilesPlacedThisTurn)
      
      if (success) {
        setGameMessage("Move submitted successfully! Waiting for confirmation...")
        setTilesPlacedThisTurn([])
        setSelectedTile(null)
        setTurnScore(0)
      } else {
        setGameMessage("Failed to submit move. Please try again.")
      }
    } catch (error) {
      console.error('❌ Blockchain move submission failed:', error)
      setGameMessage(`Move submission failed: ${error.message}`)
    }
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

    const tilesToRemove = tilesPlacedThisTurn
    const remainingBoardTiles = boardTiles.filter(boardTile => 
      !tilesToRemove.some(removeTile => 
        boardTile.location.x === removeTile.location.x && 
        boardTile.location.y === removeTile.location.y
      )
    )

    const connectedTiles = getConnectedTiles(remainingBoardTiles)
    const connectedPositions = new Set(
      connectedTiles.map(t => `${t.location.x},${t.location.y}`)
    )
    
    const finalBoardTiles = remainingBoardTiles.filter(boardTile =>
      connectedPositions.has(`${boardTile.location.x},${boardTile.location.y}`)
    )
    
    const removedIslandTiles = remainingBoardTiles.filter(boardTile =>
      !connectedPositions.has(`${boardTile.location.x},${boardTile.location.y}`)
    )

    setBoardTiles(finalBoardTiles)

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

    setTilesPlacedThisTurn([])
    setTurnScore(0)
    setSelectedTile(null)
    
    let message = `Undid ${tilesToRemove.length} tile placements.`
    if (removedIslandTiles.length > 0) {
      message += ` Also removed ${removedIslandTiles.length} island tile(s) that became disconnected.`
    }
    message += ` Try a different strategy!`
    
    setGameMessage(message)
  }

  const handleSkipTurn = () => {
    const penalty = Math.min(50, scores[currentPlayer])
    const newScores = [...scores]
    newScores[currentPlayer] = Math.max(0, newScores[currentPlayer] - penalty)
    setScores(newScores)

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

    let nextPlayer = currentPlayer
    let newTurnNumber = turnNumber
    
    if (gameConfig.playerCount > 1) {
      nextPlayer = (currentPlayer + 1) % gameConfig.playerCount
      if (nextPlayer === 0) {
        newTurnNumber = turnNumber + 1
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
      totalTilesPlaced: boardTiles.length - 1,
      longestSequence: 5,
      averageScore: score / turns
    }
  }

  const generateAchievements = () => {
    const achievements: string[] = []
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

  // Validate mathematical rules (sum equals 5) - matching contract logic
  const isValidMathematicalPlacement = (x: number, y: number, tileNumber: number, placedTiles: TileItem[], stagedTiles: TileItem[] = []) => {
    const adjacentPositions = [
      { x: x - 1, y },     // Left
      { x: x + 1, y },     // Right
      { x: x, y: y - 1 },     // Up
      { x: x, y: y + 1 }      // Down
    ]

    let hasAdjacent = false

    for (const pos of adjacentPositions) {
      // Check placed tiles
      const placedTile = placedTiles.find(tile => tile.location.x === pos.x && tile.location.y === pos.y)
      // Check staged tiles
      const stagedTile = stagedTiles.find(tile => tile.location.x === pos.x && tile.location.y === pos.y)
      
      const adjacentNumber = placedTile ? getTileValue(placedTile.id) : (stagedTile ? getTileValue(stagedTile.id) : undefined)
      
      if (adjacentNumber !== undefined) {
        hasAdjacent = true
        
        // Check mathematical rules: sum must equal 5 (matching contract)
        const sum = tileNumber + adjacentNumber
        
        if (sum !== 5) {
          return { valid: false, reason: `Tile ${tileNumber} cannot be placed next to ${adjacentNumber}. Sum must equal 5 (currently ${sum}).` }
        }
      }
    }

    // If this is the very first tile (no placed tiles and no staged tiles), allow anywhere
    if (!hasAdjacent && placedTiles.length === 0 && stagedTiles.length === 0) {
      return { valid: true }
    }

    // If there are already placed tiles, or this is the 2nd+ staged tile, must be adjacent (unless islands allowed)
    if (!hasAdjacent) {
      if (gameConfig.allowIslands) {
        return { valid: true }
      } else {
        return { valid: false, reason: 'Tile must be placed adjacent to existing tiles.' }
      }
    }

    return { valid: true }
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

  return (
    <div css={containerStyle}>
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
            turnScore,
            burningTiles,
            playerTileCounts
          }}
          onBackToSetup={onBackToSetup}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        <div css={boardAreaStyle}>
          <div css={boardContainerStyle} ref={boardContainerRef}>
            <button 
              css={resetButtonStyle}
              onClick={resetBoardPosition}
              title="Reset board position"
            >
              🔄
            </button>
            <div 
              css={draggableBoardContainerStyle}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div 
                css={gameboardStyle}
                style={{ transform: `translate(${boardOffset.x}px, ${boardOffset.y}px)` }}
              >
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
                          <div css={tileContainerStyle}>
                            <NewAgeTile
                              value={getTileValue(tile.id)}
                              state={getTileState(tile)}
                              countdownTurns={getTileCountdown(tile)}
                              isSelected={false}
                              onClick={() => handlePlacedTileClick(tile)}
                            />
                            {tile.placedByPlayer !== undefined && (
                              <div css={playerIndicatorStyle(tile.placedByPlayer)}>
                                {tile.placedByPlayer + 1}
                              </div>
                            )}
                          </div>
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
        </div>

        <div css={handAreaStyle}>
          <div css={handHeaderStyle}>
            <h3 css={handTitleStyle}>
              {gameConfig.playerNames[currentPlayer]}'s Threads ({handTiles.length}/5)
            </h3>
            <div css={handActionsStyle}>
              {isBlockchainMode && (
                <button 
                  css={refreshButtonStyle} 
                  onClick={handleRefreshBlockchain}
                  disabled={cacheLoading}
                >
                  {cacheLoading ? '⏳' : '🔄'} Refresh
                </button>
              )}
              
              {tilesPlacedThisTurn.length > 0 && (
                <button css={endTurnButtonStyle} onClick={handleEndTurn}>
                  {isBlockchainMode ? 'Submit to Blockchain' : 'End Turn'} ({turnScore} pts)
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
            {handTiles.map((tile) => (
              <NewAgeTile
                key={tile.uniqueId}
                value={getTileValue(tile.id)}
                state={getTileState(tile)}
                countdownTurns={getTileCountdown(tile)}
                isSelected={selectedTile?.uniqueId === tile.uniqueId}
                onClick={() => handleTileSelect(tile)}
              />
            ))}
          </div>
        </div>

        {gameMessage && (
          <div css={statusStyle}>
            {gameMessage}
          </div>
        )}
      </div>

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
            turnScore,
            burningTiles,
            playerTileCounts
          }}
        />
      </div>

      {sidebarCollapsed && (
        <div css={miniSidebarStyle}>
          <div css={miniSidebarHeaderStyle}>
            <h3 css={miniSidebarTitleStyle}>Game</h3>
          </div>
          
          <div css={miniSidebarContentStyle}>
            <div css={miniPlayerSectionStyle}>
              <div css={miniPlayerNameStyle}>
                {gameConfig.playerNames[currentPlayer]}
              </div>
              <div css={miniPlayerScoreStyle}>
                {scores[currentPlayer]} pts
              </div>
            </div>

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
  padding: 5px;
  background: rgba(139, 69, 19, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(5px);
  width: fit-content;
  height: fit-content;
`

const boardSpaceStyle = css`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(255, 215, 0, 0.1);

  &:hover {
    background: rgba(255, 215, 0, 0.2);
  }
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

const draggableBoardContainerStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
  cursor: grab;
`

const resetButtonStyle = css`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 16px;
  z-index: 1000;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`

const refreshButtonStyle = css`
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

  &:disabled {
    background: rgba(255, 215, 0, 0.1);
    cursor: not-allowed;
  }
`

const tileContainerStyle = css`
  position: relative;
`

const playerIndicatorStyle = (playerIndex: number) => {
  return css`
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #000;
    border: 2px solid rgba(255, 215, 0, 0.3);
  `
}