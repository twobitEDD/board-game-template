/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { css } from '@emotion/react'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { BlockchainTurnSummaryModal } from './BlockchainTurnSummaryModal'
import { TurnRecapModal } from './TurnRecapModal'
import { useGameCache } from '../hooks/useGameCache'

interface GamePlayerProps {
  gameId: number
  playerIndex: number
  canMakeMove: boolean
  gameData?: any // Pass game data from parent to avoid re-fetching
  userAddress?: string // Pass user address for player info lookup
  onGameStateChange?: () => void // Callback to trigger parent refresh
}

interface PlacedTile {
  x: number
  y: number
  number: number
  placedAt?: number // timestamp when tile was placed
  turnNumber?: number // turn number when tile was placed
  isRecent?: boolean // flag to indicate if tile should be animated as recent
}

interface TileInstance {
  id: string // unique identifier for each tile instance
  number: number
}

interface PendingTilePlacement {
  tileId: string // reference to the specific tile instance
  number: number
  x: number
  y: number
}

export function GamePlayer({ gameId, playerIndex, canMakeMove, gameData, userAddress, onGameStateChange }: GamePlayerProps) {
  console.log(`🎮 GamePlayer: Initializing for game ${gameId}, player ${playerIndex}, canMove: ${canMakeMove}`)
  
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([])
  const [currentGame, setCurrentGame] = useState<any>(gameData || null)
  const [playerHand, setPlayerHand] = useState<TileInstance[]>([]) // Changed to TileInstance[]
  const [selectedTile, setSelectedTile] = useState<TileInstance | null>(null) // Changed to TileInstance
  const [pendingPlacements, setPendingPlacements] = useState<PendingTilePlacement[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingTurn, setIsProcessingTurn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameMessage, setGameMessage] = useState<string>('')
  const hasLoadedInitialData = useRef(false)
  
  // Turn summary modal state
  const [showTurnSummary, setShowTurnSummary] = useState(false)
  const [turnSummaryData, setTurnSummaryData] = useState<{
    turnNumber: number
    playerName: string
    tilesPlaced: { number: number; x: number; y: number }[]
    scoreGained: number
    totalScore: number
    allPlayers: {
      address: string
      name: string
      score: number
      tilesRemaining: number
      isCurrentPlayer: boolean
      isYou: boolean
    }[]
    nextPlayerName?: string
    gameComplete?: boolean
  } | null>(null)

  // Turn recap modal state (for when it becomes your turn)
  const [showTurnRecap, setShowTurnRecap] = useState(false)
  const [turnRecapData, setTurnRecapData] = useState<{
    previousPlayerName: string
    previousPlayerTiles: { number: number; x: number; y: number }[]
    previousPlayerScoreGained: number
    previousPlayerTotalScore: number
    turnNumber: number
    allPlayers: {
      address: string
      name: string
      score: number
      tilesRemaining: number
      isCurrentPlayer: boolean
      isYou: boolean
    }[]
  } | null>(null)

  // Turn transition detection
  const [previousCanMakeMove, setPreviousCanMakeMove] = useState(canMakeMove)
  const [lastProcessedTurn, setLastProcessedTurn] = useState<number | null>(null)
  
  // Recent tiles tracking for animation
  const [recentlyPlacedTiles, setRecentlyPlacedTiles] = useState<Set<string>>(new Set())
  const [lastBoardUpdate, setLastBoardUpdate] = useState<number>(Date.now())

  // Debug modal rendering
  useEffect(() => {
    console.log('🎯 RENDER DEBUG: Modal state changed', { 
      showTurnSummary, 
      hasData: !!turnSummaryData,
      showTurnRecap,
      hasRecapData: !!turnRecapData
    })
  }, [showTurnSummary, turnSummaryData, showTurnRecap, turnRecapData])

  // Auto-clear game message after 5 seconds
  useEffect(() => {
    if (gameMessage) {
      const timer = setTimeout(() => {
        setGameMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [gameMessage])

  const blockchainGame = useBlockchainGame()

  // Use passed game data instead of re-fetching
  useEffect(() => {
    if (gameData) {
      console.log(`✅ GamePlayer: Using game data from parent`, { 
        state: gameData.state, 
        currentPlayer: gameData.currentPlayerIndex,
        turnNumber: gameData.turnNumber 
      })
      setCurrentGame(gameData)
    }
  }, [gameData])

  // Convert number array to TileInstance array
  const createTileInstances = (numbers: number[]): TileInstance[] => {
    return numbers.map((number, index) => ({
      id: `${number}-${index}-${Date.now()}`, // unique ID
      number
    }))
  }

  // Load player hand data when blockchain connection is ready
  const loadPlayerHand = async () => {
    if (!userAddress || !blockchainGame.isConnected) {
      console.log(`⏳ GamePlayer: Waiting for connection... userAddress: ${!!userAddress}, connected: ${blockchainGame.isConnected}`)
      return
    }

    try {
      console.log(`🔍 GamePlayer: Loading player hand for ${userAddress}...`)
      const playerInfo = await blockchainGame.getPlayerInfo(gameId, userAddress)
      
      if (playerInfo && playerInfo.hand) {
        const tileInstances = createTileInstances(playerInfo.hand)
        setPlayerHand(tileInstances)
        console.log(`✅ GamePlayer: Player hand loaded:`, playerInfo.hand)
      } else {
        console.log(`⚠️ GamePlayer: No player hand data found`)
        // For setup games, use default hand
        const defaultTiles = createTileInstances([1, 2, 3, 4, 5])
        setPlayerHand(defaultTiles)
      }
    } catch (error) {
      console.warn(`⚠️ GamePlayer: Could not load player hand:`, error.message)
      // Use default hand for testing
      const defaultTiles = createTileInstances([1, 2, 3, 4, 5])
      setPlayerHand(defaultTiles)
    }
  }

  // Load player hand when connection is ready
  useEffect(() => {
    loadPlayerHand()
  }, [gameId, userAddress, blockchainGame.isConnected])

  // Update player hand when blockchainGame.playerInfo changes
  useEffect(() => {
    if (blockchainGame.playerInfo && blockchainGame.playerInfo.hand) {
      const tileInstances = createTileInstances(blockchainGame.playerInfo.hand)
      setPlayerHand(tileInstances)
      console.log(`🔄 GamePlayer: Player hand updated from hook:`, blockchainGame.playerInfo.hand)
    }
  }, [blockchainGame.playerInfo])

  // Use cache system for placed tiles
  const { 
    placedTiles: cachedTiles,
    refreshData: refreshCache
  } = useGameCache({
    blockchainGameId: gameId,
    contractAddress: blockchainGame.contractAddress || '0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F',
    networkName: blockchainGame.networkName || 'Base Sepolia',
    chainId: blockchainGame.currentNetwork || 84532
  })

  // One-time initial data load when component mounts
  useEffect(() => {
    if (blockchainGame.isConnected && userAddress && !hasLoadedInitialData.current) {
      console.log('🔄 GamePlayer: Loading initial board data (one-time only)...')
      hasLoadedInitialData.current = true
      refreshCache().then(() => {
        console.log('✅ GamePlayer: Initial board data loaded')
      }).catch(err => {
        console.error('❌ GamePlayer: Failed to load initial board data:', err)
      })
    }
  }, [blockchainGame.isConnected, userAddress])

  // Update placed tiles from cache with stable positioning
  useEffect(() => {
    if (cachedTiles) {
      const currentTime = Date.now()
      
      // Create a stable map of existing tiles by position
      const existingTilesMap = new Map(
        placedTiles.map(tile => [`${tile.x}-${tile.y}`, tile])
      )
      
      // Process new tiles with stable positioning
      const newTiles = cachedTiles.map(tile => {
        const tileKey = `${tile.x}-${tile.y}`
        const existingTile = existingTilesMap.get(tileKey)
        
        // If tile already exists, preserve its properties to maintain React key stability
        if (existingTile) {
          return {
            ...existingTile,
            number: tile.number || tile.displayNumber, // Update number if changed
            turnNumber: tile.turnNumber || currentGame?.turnNumber
          }
        }
        
        // New tile - create with stable properties
        return {
          x: tile.x,
          y: tile.y,
          number: tile.number || tile.displayNumber,
          placedAt: currentTime,
          turnNumber: tile.turnNumber || currentGame?.turnNumber,
          isRecent: true, // Mark as recent for animation
          // Create a stable unique ID for React key
          id: `tile-${tile.x}-${tile.y}-${currentTime}`
        }
      })
      
      // Detect truly new tiles for animation
      const existingTileKeys = new Set(existingTilesMap.keys())
      const newTileKeys = new Set<string>()
      
      newTiles.forEach(tile => {
        const tileKey = `${tile.x}-${tile.y}`
        if (!existingTileKeys.has(tileKey)) {
          newTileKeys.add(tileKey)
        }
      })
      
      // Update recent tiles set for animation
      if (newTileKeys.size > 0) {
        setRecentlyPlacedTiles(newTileKeys)
        setLastBoardUpdate(currentTime)
        
        // Clear recent status after animation duration
        setTimeout(() => {
          setRecentlyPlacedTiles(new Set())
          setPlacedTiles(prev => prev.map(tile => ({ ...tile, isRecent: false })))
        }, 3000) // 3 second animation duration
      }
      
      // Only update if tiles actually changed to prevent unnecessary re-renders
      const tilesChanged = newTiles.length !== placedTiles.length || 
        newTiles.some((newTile, index) => {
          const oldTile = placedTiles[index]
          return !oldTile || 
                 newTile.x !== oldTile.x || 
                 newTile.y !== oldTile.y || 
                 newTile.number !== oldTile.number
        })
      
      if (tilesChanged) {
        console.log(`🔄 GamePlayer: Updating ${newTiles.length} tiles (${newTileKeys.size} new)`)
        setPlacedTiles(newTiles)
      }
    }
  }, [cachedTiles, currentGame?.turnNumber])

  // Detect turn transitions (when it becomes your turn)
  useEffect(() => {
    console.log('🔄 TRANSITION DEBUG: Checking turn transition...', {
      previousCanMakeMove,
      canMakeMove,
      turnNumber: currentGame?.turnNumber,
      lastProcessedTurn,
      gameState: currentGame?.state
    })

    const turnTransitionDetected = 
      !previousCanMakeMove && // Was not your turn before
      canMakeMove && // Is now your turn
      currentGame?.turnNumber && // Game has turn data
      currentGame.turnNumber !== lastProcessedTurn && // Haven't processed this turn yet
      currentGame.turnNumber > 1 // Not the first turn of the game

    console.log('🔄 TRANSITION DEBUG: Turn transition detected?', turnTransitionDetected)

    if (turnTransitionDetected) {
      console.log('🔄 Turn transition detected! Your turn now, processing previous player data...')
      
      // Show a simple recap modal first to test
      console.log('👀 RECAP DEBUG: Showing turn recap modal...')
      setTurnRecapData({
        previousPlayerName: 'Previous Player',
        previousPlayerTiles: [{ number: 5, x: 7, y: 8 }], // Placeholder
        previousPlayerScoreGained: 150,
        previousPlayerTotalScore: 1250,
        turnNumber: currentGame?.turnNumber || 0,
        allPlayers: [{
          address: userAddress || '',
          name: 'You',
          score: 1100,
          tilesRemaining: playerHand.length,
          isCurrentPlayer: true,
          isYou: true
        }]
      })
      setShowTurnRecap(true)
      setLastProcessedTurn(currentGame.turnNumber)
      console.log('👀 RECAP DEBUG: Turn recap modal should be visible now')
      
      // Process previous player's move data
      const processPreviousPlayerMove = async () => {
        try {
          if (!currentGame || !userAddress) return
          
          // Get all players info
          const allPlayers: {
            address: string
            name: string
            score: number
            tilesRemaining: number
            isCurrentPlayer: boolean
            isYou: boolean
          }[] = []
          if (currentGame.playerAddresses && currentGame.playerScores) {
            for (let i = 0; i < currentGame.playerAddresses.length; i++) {
              const playerAddress = currentGame.playerAddresses[i]
              const playerScore = currentGame.playerScores[i] || 0
              const playerInfo = await blockchainGame.getPlayerInfo(gameId, playerAddress)
              
              allPlayers.push({
                address: playerAddress,
                name: `${playerAddress.slice(0, 6)}...${playerAddress.slice(-4)}`,
                score: playerScore,
                tilesRemaining: playerInfo?.hand?.length || 0,
                isCurrentPlayer: currentGame.currentPlayerIndex === i,
                isYou: playerAddress.toLowerCase() === userAddress.toLowerCase()
              })
            }
          }
          
          // Find previous player (the one who just played)
          const previousPlayerIndex = currentGame.currentPlayerIndex > 0 
            ? currentGame.currentPlayerIndex - 1 
            : currentGame.playerAddresses.length - 1
          
          const previousPlayerAddress = currentGame.playerAddresses[previousPlayerIndex]
          const previousPlayerName = `${previousPlayerAddress.slice(0, 6)}...${previousPlayerAddress.slice(-4)}`
          const previousPlayerScore = currentGame.playerScores[previousPlayerIndex] || 0
          
          // For now, we'll simulate recent tiles data. In a real implementation,
          // we'd need to track tile placement history or get it from blockchain events
          const recentTiles = cachedTiles?.slice(-3) || [] // Last 3 tiles as approximation
          const previousPlayerTiles = recentTiles.map(tile => ({
            number: tile.number || tile.displayNumber,
            x: tile.x,
            y: tile.y
          }))
          
          // Estimate score gained (this is approximation - ideally we'd track score history)
          const estimatedScoreGained = Math.max(0, previousPlayerScore - 1000) // Rough estimate
          
          // Set recap data and show modal
          setTurnRecapData({
            previousPlayerName,
            previousPlayerTiles,
            previousPlayerScoreGained: estimatedScoreGained,
            previousPlayerTotalScore: previousPlayerScore,
            turnNumber: currentGame.turnNumber,
            allPlayers
          })
          
          setShowTurnRecap(true)
          setLastProcessedTurn(currentGame.turnNumber)
          
        } catch (error) {
          console.warn('⚠️ Could not process previous player move:', error)
        }
      }
      
      processPreviousPlayerMove()
    }
    
    // Update previous state
    setPreviousCanMakeMove(canMakeMove)
  }, [canMakeMove, previousCanMakeMove, currentGame?.turnNumber, lastProcessedTurn, currentGame, userAddress, gameId, blockchainGame, cachedTiles])

  // Handle tile selection from hand (select specific tile instance)
  const handleTileSelect = (tile: TileInstance) => {
    if (!canMakeMove) return
    setSelectedTile(selectedTile?.id === tile.id ? null : tile)
    console.log(`🎯 Selected tile: ${tile.number} (ID: ${tile.id})`)
  }

  // Handle board cell click for tile placement
  const handleCellClick = (x: number, y: number) => {
    if (!canMakeMove) return
    
    // Check if there's a pending tile at this location that we can remove
    const pendingTileIndex = pendingPlacements.findIndex(placement => placement.x === x && placement.y === y)
    if (pendingTileIndex !== -1) {
      // Remove the pending tile and return it to hand
      removePendingPlacement(pendingTileIndex)
      console.log(`🔄 Removed pending tile from (${x}, ${y}) and returned to hand`)
      return
    }
    
    // Check if there's a confirmed tile at this location
    const confirmedTile = placedTiles.find(tile => tile.x === x && tile.y === y)
    if (confirmedTile) {
      console.log(`❌ Cell (${x}, ${y}) has a confirmed tile - cannot modify`)
      return
    }
    
    // If no tile selected, we can't place anything
    if (selectedTile === null) {
      console.log(`❌ No tile selected to place at (${x}, ${y})`)
      return
    }

    // Add to pending placements
    const newPlacement: PendingTilePlacement = { 
      tileId: selectedTile.id,
      number: selectedTile.number, 
      x, 
      y 
    }
    setPendingPlacements(prev => [...prev, newPlacement])
    
    // Remove tile from hand immediately
    setPlayerHand(prev => prev.filter(tile => tile.id !== selectedTile.id))
    setSelectedTile(null) // Deselect after placing
    
    console.log(`📍 Added tile ${selectedTile.number} to (${x}, ${y})`)
  }

  // Remove a pending placement and restore tile to hand
  const removePendingPlacement = (index: number) => {
    const placement = pendingPlacements[index]
    if (placement) {
      // Restore tile to hand
      const restoredTile: TileInstance = {
        id: placement.tileId,
        number: placement.number
      }
      setPlayerHand(prev => [...prev, restoredTile])
      
      // Remove from pending
      setPendingPlacements(prev => prev.filter((_, i) => i !== index))
    }
  }

  // Clear all pending placements and restore tiles to hand
  const clearPendingPlacements = () => {
    // Restore all tiles to hand
    const restoredTiles = pendingPlacements.map(placement => ({
      id: placement.tileId,
      number: placement.number
    }))
    setPlayerHand(prev => [...prev, ...restoredTiles])
    
    setPendingPlacements([])
    setSelectedTile(null)
  }

  // Submit turn with all pending placements
  const submitTurn = async () => {
    if (pendingPlacements.length === 0) {
      console.log('❌ No tiles to place')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setGameMessage('')

    try {
      console.log(`🚀 Submitting turn with ${pendingPlacements.length} placements:`, pendingPlacements)
      
      // Convert to the format expected by the blockchain (original TilePlacement interface)
      const placementsForBlockchain = pendingPlacements.map(p => ({
        number: p.number,
        x: p.x,
        y: p.y
      }))
      
      console.log(`💰 SPONSORSHIP: Preparing to call playTurn with:`, placementsForBlockchain)
      
      // Store turn data before submission for the modal
      const turnData = {
        tilesPlaced: [...placementsForBlockchain],
        playerName: userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'You',
        turnNumber: currentGame?.turnNumber || 0,
        previousScore: currentGame?.playerScores?.[playerIndex] || 0
      }
      
      // Step 1: Send transaction and get hash
      setGameMessage('🔄 Sending transaction to blockchain...')
      const txHash = await blockchainGame.playTurn(gameId, placementsForBlockchain)
      
      console.log(`✅ Transaction sent successfully:`, txHash)
      setGameMessage(`⏳ Transaction submitted! Hash: ${txHash.slice(0, 10)}...`)
      
      // Clear pending placements immediately for better UX
      setPendingPlacements([])
      setSelectedTile(null)
      setIsProcessingTurn(true)
      
      // Step 2: Wait for transaction confirmation with proper error handling
      setGameMessage(`⏳ Waiting for blockchain confirmation...`)
      
      try {
        // Get public client for transaction monitoring
        const publicClient = blockchainGame.getPublicClient?.()
        if (!publicClient) {
          throw new Error('No public client available for transaction monitoring')
        }
        
        console.log(`🔍 Monitoring transaction: ${txHash}`)
        
        // Wait for transaction receipt with timeout and retry logic
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: txHash as `0x${string}`,
          timeout: 60000 // 60 second timeout
        })
        
        console.log(`✅ Transaction confirmed! Block: ${receipt.blockNumber}`)
        setGameMessage(`✅ Transaction confirmed in block ${receipt.blockNumber}!`)
        
        // Step 3: Check transaction status
        if (receipt.status === 'success') {
          setGameMessage(`🎉 Turn confirmed successfully!`)
          
          // Step 4: Refresh game state and show summary
          try {
            console.log(`🔄 Refreshing game state after confirmation...`)
            await refreshCache()
            await loadPlayerHand()
            onGameStateChange?.()
            
            // Get updated game state for modal
            const updatedPlayerInfo = userAddress ? await blockchainGame.getPlayerInfo(gameId, userAddress) : null
            const updatedGameState = await blockchainGame.getGameState(gameId)
            
            const newScore = updatedPlayerInfo?.score || updatedGameState?.playerScores?.[playerIndex] || 0
            const scoreGained = newScore - turnData.previousScore
            
            // Build player list for standings
            const allPlayers: {
              address: string
              name: string
              score: number
              tilesRemaining: number
              isCurrentPlayer: boolean
              isYou: boolean
            }[] = []
            
            if (updatedGameState?.playerAddresses && updatedGameState?.playerScores) {
              for (let i = 0; i < updatedGameState.playerAddresses.length; i++) {
                const playerAddress = updatedGameState.playerAddresses[i]
                const playerScore = updatedGameState.playerScores[i] || 0
                const playerInfo = await blockchainGame.getPlayerInfo(gameId, playerAddress)
                
                allPlayers.push({
                  address: playerAddress,
                  name: `${playerAddress.slice(0, 6)}...${playerAddress.slice(-4)}`,
                  score: playerScore,
                  tilesRemaining: playerInfo?.hand?.length || 0,
                  isCurrentPlayer: updatedGameState.currentPlayerIndex === i,
                  isYou: userAddress ? playerAddress.toLowerCase() === userAddress.toLowerCase() : false
                })
              }
            }
            
            // Determine next player
            const nextPlayerIndex = updatedGameState?.currentPlayerIndex !== undefined 
              ? (updatedGameState.currentPlayerIndex + 1) % (updatedGameState?.playerAddresses?.length || 1)
              : 0
            const nextPlayerAddress = updatedGameState?.playerAddresses?.[nextPlayerIndex]
            const nextPlayerName = nextPlayerAddress ? `${nextPlayerAddress.slice(0, 6)}...${nextPlayerAddress.slice(-4)}` : 'Unknown'
            
            // Show turn summary modal
            setTurnSummaryData({
              turnNumber: turnData.turnNumber + 1,
              playerName: turnData.playerName,
              tilesPlaced: turnData.tilesPlaced,
              scoreGained: scoreGained,
              totalScore: newScore,
              allPlayers: allPlayers,
              nextPlayerName: nextPlayerName,
              gameComplete: updatedGameState?.state === 2
            })
            
            setShowTurnSummary(true)
            
            // Clear success message after showing modal
            setTimeout(() => setGameMessage(''), 2000)
            
          } catch (refreshError) {
            console.error(`❌ Post-confirmation refresh failed:`, refreshError)
            setError(`Turn confirmed but failed to refresh game state: ${refreshError.message}`)
          }
          
        } else {
          // Transaction failed on-chain
          throw new Error('Transaction failed on blockchain')
        }
        
      } catch (confirmationError) {
        console.error(`❌ Transaction confirmation failed:`, confirmationError)
        
        if (confirmationError.message.includes('timeout')) {
          setError('Transaction confirmation timed out. Please check your transaction status manually.')
        } else if (confirmationError.message.includes('failed on blockchain')) {
          setError('Transaction failed on blockchain. Please try again.')
        } else {
          setError(`Transaction confirmation failed: ${confirmationError.message}`)
        }
        
        // Restore tiles to hand on confirmation failure
        const restoredTiles = pendingPlacements.map(placement => ({
          id: placement.tileId,
          number: placement.number
        }))
        setPlayerHand(prev => [...prev, ...restoredTiles])
        setPendingPlacements([...turnData.tilesPlaced.map((tile, index) => ({
          tileId: `restored-${index}`,
          number: tile.number,
          x: tile.x,
          y: tile.y
        }))])
      }
      
    } catch (error) {
      console.error('❌ Failed to submit turn:', error)
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to submit turn'
      
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction. Please check your wallet balance.'
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message.includes('sponsorship')) {
        errorMessage = 'Sponsored transaction failed. Please try again or use a regular wallet.'
      } else {
        errorMessage = `Failed to submit turn: ${error.message}`
      }
      
      setError(errorMessage)
      
      // Restore tiles to hand on error
      const restoredTiles = pendingPlacements.map(placement => ({
        id: placement.tileId,
        number: placement.number
      }))
      setPlayerHand(prev => [...prev, ...restoredTiles])
      setPendingPlacements([])
    } finally {
      setIsSubmitting(false)
      setIsProcessingTurn(false)
    }
  }

  // Skip turn (burn hand and draw new tiles)
  const skipTurn = async () => {
    setIsSubmitting(true)
    setError(null)
    setGameMessage('')

    try {
      console.log(`⏭️ Skipping turn for game ${gameId}`)
      
      // Step 1: Send transaction and get hash
      setGameMessage('🔄 Sending skip transaction to blockchain...')
      const txHash = await blockchainGame.skipTurn(gameId)
      
      console.log(`✅ Skip transaction sent successfully:`, txHash)
      setGameMessage(`⏳ Skip transaction submitted! Hash: ${txHash.slice(0, 10)}...`)
      
      // Clear any pending placements and restore tiles to hand (if any)
      if (pendingPlacements.length > 0) {
        const restoredTiles = pendingPlacements.map(placement => ({
          id: placement.tileId,
          number: placement.number
        }))
        setPlayerHand(prev => [...prev, ...restoredTiles])
      }
      setPendingPlacements([])
      setSelectedTile(null)
      setIsProcessingTurn(true)
      
      // Step 2: Wait for transaction confirmation with proper error handling
      setGameMessage(`⏳ Waiting for blockchain confirmation...`)
      
      try {
        // Get public client for transaction monitoring
        const publicClient = blockchainGame.getPublicClient?.()
        if (!publicClient) {
          throw new Error('No public client available for transaction monitoring')
        }
        
        console.log(`🔍 Monitoring skip transaction: ${txHash}`)
        
        // Wait for transaction receipt with timeout
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: txHash as `0x${string}`,
          timeout: 60000 // 60 second timeout
        })
        
        console.log(`✅ Skip transaction confirmed! Block: ${receipt.blockNumber}`)
        setGameMessage(`✅ Skip transaction confirmed in block ${receipt.blockNumber}!`)
        
        // Step 3: Check transaction status
        if (receipt.status === 'success') {
          setGameMessage(`🎉 Turn skipped successfully!`)
          
          // Step 4: Refresh game state
          try {
            console.log(`🔄 Refreshing game state after skip confirmation...`)
            await refreshCache()
            await loadPlayerHand()
            onGameStateChange?.()
            
            // Clear success message after refresh
            setTimeout(() => setGameMessage(''), 2000)
            
          } catch (refreshError) {
            console.error(`❌ Post-skip refresh failed:`, refreshError)
            setError(`Turn skipped but failed to refresh game state: ${refreshError.message}`)
          }
          
        } else {
          // Transaction failed on-chain
          throw new Error('Skip transaction failed on blockchain')
        }
        
      } catch (confirmationError) {
        console.error(`❌ Skip transaction confirmation failed:`, confirmationError)
        
        if (confirmationError.message.includes('timeout')) {
          setError('Skip transaction confirmation timed out. Please check your transaction status manually.')
        } else if (confirmationError.message.includes('failed on blockchain')) {
          setError('Skip transaction failed on blockchain. Please try again.')
        } else {
          setError(`Skip transaction confirmation failed: ${confirmationError.message}`)
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to skip turn:', error)
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to skip turn'
      
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction. Please check your wallet balance.'
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message.includes('sponsorship')) {
        errorMessage = 'Sponsored transaction failed. Please try again or use a regular wallet.'
      } else {
        errorMessage = `Failed to skip turn: ${error.message}`
      }
      
      setError(errorMessage)
      
      // Restore tiles to hand on error (if any)
      if (pendingPlacements.length > 0) {
        const restoredTiles = pendingPlacements.map(placement => ({
          id: placement.tileId,
          number: placement.number
        }))
        setPlayerHand(prev => [...prev, ...restoredTiles])
      }
      setPendingPlacements([])
    } finally {
      setIsSubmitting(false)
      setIsProcessingTurn(false)
    }
  }

  // Render a board cell
  const renderCell = (x: number, y: number) => {
    const placedTile = placedTiles.find(tile => tile.x === x && tile.y === y)
    const pendingTile = pendingPlacements.find(placement => placement.x === x && placement.y === y)
    const isCenter = x === 7 && y === 7
    const tileKey = `${x}-${y}`
    const isRecentTile = recentlyPlacedTiles.has(tileKey) || placedTile?.isRecent
    
    const tile = placedTile || pendingTile
    
    return (
      <div
        key={`${x}-${y}`}
        css={[
          cellStyle,
          isCenter && centerCellStyle,
          // Make cells clickable if: can make move AND (has selected tile OR has pending tile)
          canMakeMove && (selectedTile !== null || pendingTile) && clickableCellStyle
        ]}
        onClick={() => handleCellClick(x, y)}
      >
        {tile ? (
          <div css={[
            tileStyle, 
            pendingTile && pendingTileStyle,
            isRecentTile && recentTileStyle
          ]}>
            <span css={tileNumberStyle}>{tile.number}</span>
            {pendingTile && (
              <div css={pendingIndicatorStyle}>🔄</div>
            )}
          </div>
        ) : isCenter ? (
          <div css={centerMarkerStyle}>★</div>
        ) : null}
      </div>
    )
  }

  return (
    <div css={containerStyle}>
      {/* Game Board */}
      <div css={boardContainerStyle}>
        <div css={boardStyle}>
          {Array.from({ length: 15 }, (_, row) =>
            Array.from({ length: 15 }, (_, col) => renderCell(col, row))
          ).flat()}
        </div>
      </div>

      {/* Player Interface */}
      <div css={interfaceStyle}>
        {/* Player Hand */}
        <div css={handSectionStyle}>
          <h3 css={sectionTitleStyle}>Your Hand ({playerHand.length} tiles)</h3>
          <div css={handStyle}>
            {playerHand.map((tile, index) => (
              <div
                key={`${tile.id}-${index}`}
                css={[
                  handTileStyle,
                  selectedTile?.id === tile.id && selectedHandTileStyle,
                  canMakeMove && clickableHandTileStyle
                ]}
                onClick={() => handleTileSelect(tile)}
              >
                {tile.number}
              </div>
            ))}
          </div>
          {selectedTile && (
            <div css={selectedTileInfoStyle}>
              Selected: {selectedTile.number} (Click a board cell to place)
            </div>
          )}
          
          {pendingPlacements.length > 0 && (
            <div css={pendingInfoStyle}>
              💡 Tip: Click on any pending tile to return it to your hand
            </div>
          )}
        </div>

        {/* Pending Placements */}
        {pendingPlacements.length > 0 && (
          <div css={pendingSectionStyle}>
            <h3 css={sectionTitleStyle}>Pending Placements ({pendingPlacements.length})</h3>
            <div css={pendingListStyle}>
              {pendingPlacements.map((placement, index) => (
                <div key={index} css={pendingItemStyle}>
                  <span>Tile {placement.number} → ({placement.x}, {placement.y})</span>
                  <button css={removeButtonStyle} onClick={() => removePendingPlacement(index)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div css={actionsSectionStyle}>
          {currentGame?.state === 0 && userAddress && currentGame.creator?.toLowerCase() === userAddress.toLowerCase() ? (
            // Setup state - show start game button for creator
            <div css={actionsStyle}>
              <button
                css={[actionButtonStyle, startGameButtonStyle]}
                onClick={async () => {
                  setIsSubmitting(true)
                  setError(null)
                  try {
                    console.log(`🚀 Starting game ${gameId}...`)
                    await blockchainGame.startGame(gameId)
                    console.log(`✅ Game ${gameId} started successfully`)
                    
                    // Wait a moment for the transaction to be fully processed
                    setTimeout(() => {
                      console.log(`🔄 GamePlayer: Triggering parent game state refresh...`)
                      onGameStateChange?.()
                    }, 2000)
                    
                  } catch (error) {
                    console.error('❌ Failed to start game:', error)
                    setError(`Failed to start game: ${error.message}`)
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? '⏳ Starting...' : '🚀 Start Game!'}
              </button>
              <div css={setupInfoStyle}>
                Game is ready! You're the creator, so you can start when ready.
              </div>
            </div>
          ) : canMakeMove ? (
            <div css={actionsStyle}>
              {isProcessingTurn ? (
                <div css={processingStyle}>
                  <div css={processingIconStyle}>⏳</div>
                  <div css={processingTextStyle}>Processing your turn...</div>
                  <div css={processingSubtextStyle}>Please wait while the blockchain confirms your move</div>
                </div>
              ) : (
                <>
                  <button
                    css={[actionButtonStyle, submitButtonStyle]}
                    onClick={submitTurn}
                    disabled={isSubmitting || pendingPlacements.length === 0}
                  >
                    {isSubmitting ? '⏳ Submitting...' : `🎲 Submit Turn (${pendingPlacements.length} tiles)`}
                  </button>
                  
                  <button
                    css={[actionButtonStyle, skipButtonStyle]}
                    onClick={skipTurn}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '⏳ Skipping...' : '⏭️ Skip Turn'}
                  </button>
                  
                  {pendingPlacements.length > 0 && (
                    <button
                      css={[actionButtonStyle, clearButtonStyle]}
                      onClick={clearPendingPlacements}
                      disabled={isSubmitting}
                    >
                      🗑️ Clear All
                    </button>
                  )}
                </>
              )}
            </div>
          ) : currentGame?.state === 0 ? (
            <div css={waitingStyle}>
              ⏳ Waiting for game creator to start the game...
            </div>
          ) : (
            <div css={waitingStyle}>
              ⏳ Waiting for your turn...
            </div>
          )}
        </div>

        {/* Manual Refresh Button (Debug) */}
        {process.env.NODE_ENV === 'development' && (
          <div css={debugSectionStyle}>
            <button
              css={[actionButtonStyle, debugButtonStyle]}
              onClick={async () => {
                console.log(`🔄 GamePlayer: Manual refresh requested...`)
                try {
                  await refreshCache()
                  // Don't call onGameStateChange here to avoid double refresh
                  console.log(`✅ GamePlayer: Manual refresh completed`)
                } catch (error) {
                  console.error(`❌ GamePlayer: Manual refresh failed:`, error)
                }
              }}
            >
              🔄 Manual Refresh
            </button>
            
            <button
              css={[actionButtonStyle, debugButtonStyle]}
              onClick={() => {
                console.log('🧪 TEST: Manually triggering turn summary modal...')
                setTurnSummaryData({
                  turnNumber: 5,
                  playerName: 'Test Player',
                  tilesPlaced: [{ number: 3, x: 7, y: 8 }, { number: 7, x: 8, y: 7 }],
                  scoreGained: 250,
                  totalScore: 1250,
                  allPlayers: [{
                    address: 'test',
                    name: 'Test Player',
                    score: 1250,
                    tilesRemaining: 3,
                    isCurrentPlayer: false,
                    isYou: true
                  }],
                  nextPlayerName: 'Next Player',
                  gameComplete: false
                })
                setShowTurnSummary(true)
                console.log('🧪 TEST: Turn summary modal should be visible now')
              }}
            >
              🧪 Test Turn Summary Modal
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div css={errorStyle}>
            ❌ {error}
          </div>
        )}

        {/* Game Message Display */}
        {gameMessage && (
          <div css={gameMessageStyle}>
            {gameMessage}
          </div>
        )}

        {/* Turn Summary Modal */}
        {showTurnSummary && turnSummaryData && (
          <BlockchainTurnSummaryModal
            isOpen={showTurnSummary}
            onClose={() => {
              console.log('🎯 MODAL DEBUG: Closing turn summary modal')
              setShowTurnSummary(false)
            }}
            turnNumber={turnSummaryData.turnNumber}
            gameId={gameId}
            playerName={turnSummaryData.playerName}
            tilesPlaced={turnSummaryData.tilesPlaced}
            scoreGained={turnSummaryData.scoreGained}
            totalScore={turnSummaryData.totalScore}
            allPlayers={turnSummaryData.allPlayers}
            winningScore={2500} // TODO: Get from game config
            nextPlayerName={turnSummaryData.nextPlayerName}
            gameComplete={turnSummaryData.gameComplete}
          />
        )}

        {/* Turn Recap Modal (when it becomes your turn) */}
        {showTurnRecap && turnRecapData && (
          <TurnRecapModal
            isOpen={showTurnRecap}
            onClose={() => setShowTurnRecap(false)}
            previousPlayerName={turnRecapData.previousPlayerName}
            previousPlayerTiles={turnRecapData.previousPlayerTiles}
            previousPlayerScoreGained={turnRecapData.previousPlayerScoreGained}
            previousPlayerTotalScore={turnRecapData.previousPlayerTotalScore}
            turnNumber={turnRecapData.turnNumber}
            gameId={gameId}
            yourTurn={true}
            allPlayers={turnRecapData.allPlayers}
            winningScore={2500} // TODO: Get from game config
          />
        )}

        {/* Game Info */}
        <div css={gameInfoStyle}>
          <div css={infoItemStyle}>
            <span css={infoLabelStyle}>Turn:</span>
            <span css={infoValueStyle}>{currentGame?.turnNumber || 0}</span>
          </div>
          <div css={infoItemStyle}>
            <span css={infoLabelStyle}>Your Score:</span>
            <span css={infoValueStyle}>{currentGame?.playerScores?.[playerIndex] || 0}</span>
          </div>
          <div css={infoItemStyle}>
            <span css={infoLabelStyle}>Tiles on Board:</span>
            <span css={infoValueStyle}>{placedTiles.length}</span>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div css={infoItemStyle}>
              <span css={infoLabelStyle}>Debug Tiles:</span>
              <span css={infoValueStyle}>{placedTiles.map(t => `${t.number}@(${t.x},${t.y})`).join(', ') || 'None'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Styles
const containerStyle = css`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`

const boardContainerStyle = css`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`

const boardStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 40px);
  grid-template-rows: repeat(15, 40px);
  gap: 1px;
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
`

const cellStyle = css`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`

const centerCellStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
`

const clickableCellStyle = css`
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
`

const tileStyle = css`
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-weight: bold;
`

const pendingTileStyle = css`
  background: rgba(255, 215, 0, 0.8);
  border: 2px solid rgba(255, 215, 0, 0.9);
  animation: pulse 1s infinite;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 215, 0, 0.9);
    border-color: rgba(255, 215, 0, 1);
    transform: scale(1.05);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`

const recentTileStyle = css`
  animation: recentTileAppear 2s ease-out;
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.8);
  
  @keyframes recentTileAppear {
    0% { 
      transform: scale(0) rotate(180deg);
      opacity: 0;
      background: rgba(76, 175, 80, 0.9);
    }
    50% { 
      transform: scale(1.2) rotate(90deg);
      opacity: 1;
      background: rgba(76, 175, 80, 0.9);
    }
    100% { 
      transform: scale(1) rotate(0deg);
      opacity: 1;
      background: rgba(255, 255, 255, 0.9);
    }
  }
`

const tileNumberStyle = css`
  font-size: 1rem;
`

const centerMarkerStyle = css`
  color: #ffd700;
  font-size: 1.4rem;
`

const interfaceStyle = css`
  width: 400px;
  background: rgba(0, 0, 0, 0.2);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
`

const handSectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const sectionTitleStyle = css`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffd700;
`

const handStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const handTileStyle = css`
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
`

const clickableHandTileStyle = css`
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`

const selectedHandTileStyle = css`
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.8);
  transform: scale(1.1);
`

const selectedTileInfoStyle = css`
  font-size: 0.9rem;
  color: #ffd700;
  text-align: center;
`

const pendingSectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const pendingListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const pendingItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 215, 0, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
`

const removeButtonStyle = css`
  background: rgba(255, 0, 0, 0.3);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(255, 0, 0, 0.5);
  }
`

const actionsSectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const actionsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const actionButtonStyle = css`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const submitButtonStyle = css`
  background: #4CAF50;
  color: white;
  
  &:hover:not(:disabled) {
    background: #45a049;
    transform: translateY(-2px);
  }
`

const skipButtonStyle = css`
  background: #FF9800;
  color: white;
  
  &:hover:not(:disabled) {
    background: #e68900;
    transform: translateY(-2px);
  }
`

const clearButtonStyle = css`
  background: #f44336;
  color: white;
  
  &:hover:not(:disabled) {
    background: #da190b;
    transform: translateY(-2px);
  }
`

const startGameButtonStyle = css`
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  font-size: 1.1rem;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #45a049, #3d8b40);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
`

const setupInfoStyle = css`
  text-align: center;
  font-size: 0.9rem;
  color: #ffd700;
  margin-top: 0.5rem;
  opacity: 0.9;
`

const waitingStyle = css`
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  opacity: 0.7;
`

const errorStyle = css`
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.5);
  border-radius: 8px;
  padding: 1rem;
  color: #ffcccb;
`

const gameInfoStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
`

const infoItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const infoLabelStyle = css`
  font-size: 0.9rem;
  opacity: 0.8;
`

const infoValueStyle = css`
  font-weight: bold;
`

const debugSectionStyle = css`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
`

const debugButtonStyle = css`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
`

const processingStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  text-align: center;
`

const processingIconStyle = css`
  font-size: 2rem;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const processingTextStyle = css`
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 0.5rem;
`

const processingSubtextStyle = css`
  font-size: 0.9rem;
  opacity: 0.8;
  line-height: 1.4;
`

const gameMessageStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  color: #ffd700;
  font-size: 0.9rem;
  margin-top: 1rem;
`

const pendingIndicatorStyle = css`
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 0.8rem;
  color: #ffd700;
`

const pendingInfoStyle = css`
  text-align: center;
  font-size: 0.9rem;
  color: #ffd700;
  margin-top: 0.5rem;
  opacity: 0.9;
`