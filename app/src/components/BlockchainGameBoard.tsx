/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { css } from '@emotion/react'
import { createPublicClient, http } from 'viem'
import { base, hardhat } from 'viem/chains'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { NewAgeGameBoard } from './NewAgeGameBoard'
import type { GameConfig } from '../GameDisplay'
import type { TileItem } from '../types/GameTypes'
import { NumberTileId, GameParkUtils } from '../gamepark'
import FivesGameABI from '../contracts/FivesGame.json'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { BlockchainEndGameModal } from './BlockchainEndGameModal'

// Contract configuration - FIXED VERSION with proper duplicate position validation
// Contract address is now obtained dynamically from the hook

// Create public client for reading contract data
const getPublicClient = (networkName: string) => {
  const networkConfigs = {
    'Base Mainnet': { 
      chain: base, 
      rpcUrls: [
        'https://base.llamarpc.com',     // LlamaNodes (often more reliable)
        'https://base.meowrpc.com',      // MeowRPC (good for dApps)
        'https://base-rpc.publicnode.com', // PublicNode
        'https://1rpc.io/base',          // 1RPC
        'https://mainnet.base.org'       // Official (backup due to rate limits)
      ]
    },
    'Hardhat Local': { 
      chain: hardhat, 
      rpcUrls: ['http://127.0.0.1:8545'] 
    }
  }
  
  const config = networkConfigs[networkName] || networkConfigs['Base Mainnet']
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrls[0], {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 15000
    })
  })
}

interface BlockchainGameBoardProps {
  gameConfig: GameConfig
  blockchainGameId: number
  onBackToSetup: () => void
}

// Extended tile interface for blockchain with numeric values
interface BlockchainTile extends TileItem {
  number: number // Display number (0-9)
}

// Use GamePark utilities
const { getTileValue, getNumberTileId } = GameParkUtils

export function BlockchainGameBoard({ 
  gameConfig, 
  blockchainGameId, 
  onBackToSetup 
}: BlockchainGameBoardProps) {
  const {
    currentGame,
    playerInfo,
    playTurn,
    skipTurn,
    getTilePoolStatus,
    refreshGameData,
    loading: hookLoading,
    error: hookError,
    contractAddress,
    networkName
  } = useBlockchainGame()

  const { primaryWallet } = useDynamicContext()

  const [selectedTile, setSelectedTile] = useState<BlockchainTile | null>(null)
  const [gameMessage, setGameMessage] = useState('Loading blockchain game...')
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tilePoolStatus, setTilePoolStatus] = useState<number[]>([])
  const [placedTiles, setPlacedTiles] = useState<any[]>([])
  const [stagedPlacements, setStagedPlacements] = useState<Array<{x: number, y: number, number: number, tileUniqueId: string}>>([])
  const [isConfirming, setIsConfirming] = useState(false)
  const [lastSeenTurnNumber, setLastSeenTurnNumber] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastKnownGame, setLastKnownGame] = useState<any>(null)
  const [lastKnownPlayerInfo, setLastKnownPlayerInfo] = useState<any>(null)
  const [showEndGameModal, setShowEndGameModal] = useState(false)
  const [hasShownEndGameModal, setHasShownEndGameModal] = useState(false)

  // Load board tiles from blockchain
  const loadBoardTiles = useCallback(async () => {
    try {
      console.log('🔍 Loading board tiles from blockchain...')
      
      if (!currentGame || !contractAddress) {
        console.log('⚠️ No current game or contract address, skipping tile load')
        return
      }
      
      // Create network-aware public client with fallback URLs
      const networkConfigs = {
        'Base Mainnet': { 
          chain: base, 
          rpcUrls: [
            'https://base.llamarpc.com',
            'https://base.meowrpc.com',
            'https://base-rpc.publicnode.com',
            'https://1rpc.io/base',
            'https://mainnet.base.org'
          ]
        },
        'Hardhat Local': { 
          chain: hardhat, 
          rpcUrls: ['http://127.0.0.1:8545'] 
        }
      }
      
      const config = networkConfigs[networkName] || networkConfigs['Base Mainnet']
      
      // Use the first available RPC
      const publicClient = createPublicClient({
        chain: config.chain,
        transport: http(config.rpcUrls[0], {
          retryCount: 3,
          retryDelay: 1000,
          timeout: 15000
        })
      })
      
      console.log('📍 Using contract:', contractAddress, 'on network:', networkName)
      console.log('🔍 Game ID:', blockchainGameId)
      console.log('🔍 Current game state:', currentGame?.state)
      console.log('🔍 Turn number:', currentGame?.turnNumber)
      
      const loadedTiles: any[] = []
      
      // Optimize: Only check positions where tiles are likely to be placed
      // Start with center area and expand based on turn number
      const maxRadius = Math.min(7, currentGame.turnNumber + 2) // Expand search area gradually
      const centerX = 7, centerY = 7
      
      const positionsToCheck: Array<{ x: number; y: number }> = []
      
      // Add center area first (most likely to have tiles)
      for (let radius = 0; radius <= maxRadius; radius++) {
        for (let x = Math.max(0, centerX - radius); x <= Math.min(14, centerX + radius); x++) {
          for (let y = Math.max(0, centerY - radius); y <= Math.min(14, centerY + radius); y++) {
            if (Math.abs(x - centerX) === radius || Math.abs(y - centerY) === radius) {
              positionsToCheck.push({ x, y })
            }
          }
        }
      }
      
      console.log(`🔍 Checking ${positionsToCheck.length} positions (optimized from 225)`)
      
      // Batch tile checks to reduce RPC calls
      const batchSize = 10
      for (let i = 0; i < positionsToCheck.length; i += batchSize) {
        const batch = positionsToCheck.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async ({ x, y }) => {
          try {
            const tileResult = await publicClient.readContract({
              address: contractAddress,
              abi: FivesGameABI.abi,
              functionName: 'getTileAt',
              args: [blockchainGameId, x, y]
            }) as [boolean, number, number]
            
            const [exists, tileNumber] = tileResult
            
            if (exists) {
              return {
                id: getNumberTileId(tileNumber),
                uniqueId: `blockchain-${x}-${y}-${tileNumber}`,
                location: { type: 'board', x, y },
                number: tileNumber,
                x,
                y
              }
            }
            return null
          } catch (error) {
            // Position probably doesn't have a tile or rate limited
            return null
          }
        })
        
        const batchResults = await Promise.allSettled(batchPromises)
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            loadedTiles.push(result.value)
            const tile = result.value
            console.log(`🎯 Found tile at (${tile.x}, ${tile.y}): ${tile.number}`)
          }
        })
        
        // Small delay between batches to avoid overwhelming RPC
        if (i + batchSize < positionsToCheck.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      console.log(`✅ Loaded ${loadedTiles.length} tiles from blockchain`)
      console.log('  Loaded tiles:', loadedTiles.map(t => `(${t.x},${t.y}):${t.number}`))
      setPlacedTiles(loadedTiles)
      
    } catch (error) {
      console.warn('❌ Failed to load board tiles:', error)
      // Don't clear tiles on error - keep existing state
      // setPlacedTiles([]) 
    }
  }, [blockchainGameId, currentGame, contractAddress, networkName])

  // Load initial blockchain state - MANUAL REFRESH ONLY (no automatic polling)
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true)
        
        console.log('🔄 Manual load on mount...')
        
        await refreshGameData(blockchainGameId)
        
        // Load tile pool status
        const poolStatus = await getTilePoolStatus(blockchainGameId)
        setTilePoolStatus(poolStatus.remainingCounts)
        
        // Load placed tiles from board
        await loadBoardTiles()
        
        setError(null)
        setIsInitialLoad(false)
        
      } catch (error) {
        console.error('❌ Failed to load game data:', error)
        setError(`Error loading game: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    
    if (blockchainGameId) {
      // Only load once on mount - no automatic polling
      loadGameData()
    }
  }, [blockchainGameId, refreshGameData, getTilePoolStatus, loadBoardTiles])

  // Manual refresh function for user-triggered updates
  const handleManualRefresh = useCallback(async () => {
    if (!blockchainGameId) return
    
    try {
      setIsSyncing(true)
      console.log('🔄 Manual refresh triggered by user...')
      
      await refreshGameData(blockchainGameId)
      
      // Load tile pool status
      const poolStatus = await getTilePoolStatus(blockchainGameId)
      setTilePoolStatus(poolStatus.remainingCounts)
      
      // Load placed tiles from board
      await loadBoardTiles()
      
      setError(null)
      
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
      setError(`Refresh failed: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }, [blockchainGameId, refreshGameData, getTilePoolStatus, loadBoardTiles])

  // Update game message based on game state
  useEffect(() => {
    if (!currentGame || !playerInfo) return
    
    if (currentGame.state === 0) {
      setGameMessage('Game is in setup phase')
    } else if (currentGame.state === 1) {
      const currentPlayerAddr = currentGame.playerAddresses[currentGame.currentPlayerIndex]
      const myWalletAddr = primaryWallet?.address
      const isMyTurn = currentPlayerAddr?.toLowerCase() === myWalletAddr?.toLowerCase()
      
      console.log('🔍 TURN DETECTION DEBUG:')
      console.log('  Current Player Index:', currentGame.currentPlayerIndex)
      console.log('  Current Player Address:', currentPlayerAddr)
      console.log('  My Wallet Address:', myWalletAddr)
      console.log('  Is My Turn?:', isMyTurn)
      console.log('  All Player Addresses:', currentGame.playerAddresses)
      console.log('  Player 0 (First):', currentGame.playerAddresses[0])
      console.log('  Player 1 (Second):', currentGame.playerAddresses[1])
      console.log('  My Index in Array:', currentGame.playerAddresses.findIndex(addr => addr?.toLowerCase() === myWalletAddr?.toLowerCase()))
      
      if (isMyTurn) {
        // Special message for first turn
        if (placedTiles.length === 0 && stagedPlacements.length === 0) {
          setGameMessage(`Your turn! Place the first tile anywhere on the board to start the game.`)
        } else {
          setGameMessage(`Your turn! Place tiles from your hand or skip to draw new tiles.`)
        }
      } else {
        const currentPlayerAddr = currentGame.playerAddresses[currentGame.currentPlayerIndex]
        setGameMessage(`Waiting for ${currentPlayerAddr?.slice(0, 6)}...${currentPlayerAddr?.slice(-4)} to play`)
      }
    } else if (currentGame.state === 2) {
      setGameMessage('Game completed!')
      // Show endgame modal after a brief delay (only once)
      if (!hasShownEndGameModal) {
        setHasShownEndGameModal(true)
        setTimeout(() => setShowEndGameModal(true), 1500)
      }
    } else {
      setGameMessage('Game cancelled')
    }
  }, [currentGame, playerInfo, placedTiles, stagedPlacements, primaryWallet])

  // Validate placement (trusting the contract's comprehensive Quinto-style validation)
  const validatePlacement = (x: number, y: number, selectedTileNumber: number) => {
    console.log(`🔍 VALIDATION DEBUG - validatePlacement called:`)
    console.log(`  Position: (${x}, ${y})`)
    console.log(`  Tile Number: ${selectedTileNumber}`)
    console.log(`  Placed Tiles Count:`, placedTiles.length)
    console.log(`  Staged Placements Count:`, stagedPlacements.length)
    console.log(`  Total Tiles on Board:`, placedTiles.length + stagedPlacements.length)
    
    // Basic bounds check
    if (x < 0 || x >= 15 || y < 0 || y >= 15) {
      console.log(`❌ Bounds check failed: (${x}, ${y}) outside 0-14 range`)
      return { isValid: false, error: "Outside board boundaries" }
    }

    // Check if position is occupied  
    const existingPlacedTile = placedTiles.find(tile => tile.x === x && tile.y === y)
    const existingStagedTile = stagedPlacements.find(placement => placement.x === x && placement.y === y)
    
    if (existingPlacedTile || existingStagedTile) {
      console.log(`❌ Position occupied:`)
      console.log(`  Existing placed tile:`, existingPlacedTile)
      console.log(`  Existing staged tile:`, existingStagedTile)
      return { isValid: false, error: "Position already occupied" }
    }

    // Add helpful hints for Quinto-style rules
    // Consider BOTH placed tiles AND staged tiles when determining first move
    const totalTilesOnBoard = placedTiles.length + stagedPlacements.length
    
    if (totalTilesOnBoard === 0) {
      // True first move - must be on or adjacent to center (7,7)
      const distanceFromCenter = Math.abs(x - 7) + Math.abs(y - 7)
      if (distanceFromCenter > 1) {
        console.log(`⚠️ WARNING: First move should be on or adjacent to center (7,7). Current distance: ${distanceFromCenter}`)
        console.log(`  Suggested positions: (7,7), (6,7), (8,7), (7,6), (7,8)`)
        return { isValid: false, error: "First tile must be placed on or adjacent to center (7,7)" }
      }
    } else {
      // Subsequent moves - have placed or staged tiles already
      console.log(`ℹ️ Subsequent move - total tiles on board:`, totalTilesOnBoard, `(${placedTiles.length} placed + ${stagedPlacements.length} staged)`)
      
      // Allow broader placement - contract will validate Quinto rules
      console.log(`✅ Allowing placement anywhere - contract will validate Quinto rules`)
    }

    console.log(`✅ Validation passed for (${x}, ${y})`)
    return { isValid: true, error: null }
  }

  // Handle tile staging (local placement, no blockchain call yet)
  const handleTileStaging = useCallback((x: number, y: number) => {
    console.log(`🎯 TILE STAGING DEBUG - handleTileStaging called:`)
    console.log(`  Position: (${x}, ${y})`)
    console.log(`  Selected Tile:`, selectedTile)
    console.log(`  Current Game:`, currentGame)
    console.log(`  Player Info:`, playerInfo)
    
    if (!selectedTile || !currentGame || !playerInfo) {
      console.log(`❌ Missing required data:`)
      console.log(`  selectedTile:`, !!selectedTile)
      console.log(`  currentGame:`, !!currentGame)
      console.log(`  playerInfo:`, !!playerInfo)
      setGameMessage('Please select a tile first!')
      return
    }

    // Check if it's the player's turn with detailed logging
    const currentPlayerAddr = currentGame.playerAddresses[currentGame.currentPlayerIndex]
    const myWalletAddr = primaryWallet?.address
    
    console.log(`🔍 TURN VALIDATION:`)
    console.log(`  Current Player Index: ${currentGame.currentPlayerIndex}`)
    console.log(`  Current Player Address: ${currentPlayerAddr}`)
    console.log(`  My Wallet Address: ${myWalletAddr}`)
    console.log(`  Player Addresses Array:`, currentGame.playerAddresses)
    console.log(`  Player Info:`, playerInfo)
    
    const isMyTurn = currentPlayerAddr?.toLowerCase() === myWalletAddr?.toLowerCase()
    console.log(`  Is My Turn? ${isMyTurn}`)
    
    if (!isMyTurn) {
      console.log(`❌ Not my turn!`)
      setGameMessage('Not your turn!')
      return
    }

    console.log(`✅ Turn validation passed - proceeding with placement validation`)

    // Check if position is already occupied (by confirmed tiles or staged tiles)
    const isOccupiedByPlaced = placedTiles.some(tile => tile.x === x && tile.y === y)
    const isOccupiedByStaged = stagedPlacements.some(placement => placement.x === x && placement.y === y)
    
    if (isOccupiedByPlaced || isOccupiedByStaged) {
      console.log(`❌ Position occupied by placed (${isOccupiedByPlaced}) or staged (${isOccupiedByStaged})`)
      setGameMessage('Position already occupied!')
      return
    }

    // Check if this specific tile instance is already staged
    const tileAlreadyStaged = stagedPlacements.some(placement => placement.tileUniqueId === selectedTile.uniqueId)
    if (tileAlreadyStaged) {
      console.log(`❌ Tile already staged:`, selectedTile.uniqueId)
      setGameMessage('This tile is already staged for placement!')
      return
    }

    // Validate mathematical placement rules
    console.log(`🔍 Running placement validation...`)
    const validation = validatePlacement(x, y, selectedTile.number)
    if (!validation.isValid) {
      console.log(`❌ Placement validation failed:`, validation.error)
      setGameMessage(validation.error!)
      return
    }

    console.log(`✅ All validations passed - staging tile`)
    
    // Stage the placement
    setStagedPlacements(prev => [...prev, {
      x,
      y,
      number: selectedTile.number,
      tileUniqueId: selectedTile.uniqueId
    }])
    
    setSelectedTile(null)
    setGameMessage(`Tile ${selectedTile.number} staged at (${x}, ${y}). Add more tiles or confirm your turn.`)
  }, [selectedTile, currentGame, playerInfo, placedTiles, stagedPlacements, validatePlacement])

  // Confirm turn - send all staged placements to blockchain
  const handleConfirmTurn = useCallback(async () => {
    if (!currentGame || !playerInfo || stagedPlacements.length === 0) {
      setGameMessage('No tiles staged for placement!')
      return
    }

    // Check if it's the player's turn
    const isMyTurn = currentGame.playerAddresses[currentGame.currentPlayerIndex]?.toLowerCase() === 
                    primaryWallet?.address?.toLowerCase()
    
    if (!isMyTurn) {
      setGameMessage('Not your turn!')
      return
    }

    try {
      setIsConfirming(true)
      setGameMessage(`Confirming turn with ${stagedPlacements.length} tile(s)...`)
      
      // Send all staged placements to blockchain in one transaction
      const placements = stagedPlacements.map(({ x, y, number }) => ({ x, y, number }))
      
      // Add detailed debugging
      console.log('🔍 DETAILED DEBUG - Turn Confirmation:')
      console.log('  Game ID:', blockchainGameId)
      console.log('  Current Game State:', currentGame)
      console.log('  Player Info:', playerInfo)
      console.log('  Staged Placements:', stagedPlacements)
      console.log('  Placements to Send:', placements)
      console.log('  Board State (placed tiles):', placedTiles)
      console.log('  Is First Placement?:', placedTiles.length === 0 && stagedPlacements.length === 1)
      console.log('  Game allows islands?:', currentGame.allowIslands)
      
      // Validate each placement again before sending
      for (const placement of placements) {
        const validation = validatePlacement(placement.x, placement.y, placement.number)
        console.log(`  Placement (${placement.x}, ${placement.y}, ${placement.number}) validation:`, validation)
      }
      
      const txHash = await playTurn(blockchainGameId, placements)
      
      setGameMessage(`Turn confirmed! Transaction: ${txHash.slice(0, 10)}...`)
      
      // Clear staged placements first
      setStagedPlacements([])
      
      // Manual refresh only - no automatic reload
      console.log('✅ Turn confirmed. Use manual refresh to see updates.')
      
    } catch (error) {
      console.error('❌ Failed to confirm turn:', error)
      console.error('❌ Error details:', error.message, error.stack)
      setGameMessage(`Failed to confirm turn: ${error.message}`)
    } finally {
      setIsConfirming(false)
    }
  }, [currentGame, playerInfo, stagedPlacements, blockchainGameId, playTurn, validatePlacement])

  // Clear staged placements
  const handleClearStaged = useCallback(() => {
    setStagedPlacements([])
    setGameMessage('Staged placements cleared.')
  }, [])

  // Handle skip turn
  const handleSkipTurn = useCallback(async () => {
    if (!currentGame || !playerInfo) return
    
    const isMyTurn = currentGame.playerAddresses[currentGame.currentPlayerIndex]?.toLowerCase() === 
                    primaryWallet?.address?.toLowerCase()
    
    if (!isMyTurn) {
      setGameMessage('Not your turn!')
      return
    }

    // Clear any staged placements first
    setStagedPlacements([])

    try {
      setGameMessage('Skipping turn to draw tiles...')
      const txHash = await skipTurn(blockchainGameId)
      setGameMessage(`Turn skipped! Drawing new tiles... ${txHash.slice(0, 10)}...`)
    } catch (error) {
      console.error('❌ Failed to skip turn:', error)
      setGameMessage(`Failed to skip turn: ${error.message}`)
    }
  }, [currentGame, playerInfo, blockchainGameId, skipTurn])

  // Create hand tiles for the UI from the new contract format
  const handTiles = useMemo(() => {
    if (!playerInfo || !playerInfo.hand || !Array.isArray(playerInfo.hand)) {
      console.log('❌ No hand data - playerInfo:', !!playerInfo, 'hand:', playerInfo?.hand)
      return []
    }
    
    console.log('✅ Hand data found:', playerInfo.hand)
    console.log('🔍 Staged placements:', stagedPlacements.length, stagedPlacements.map(p => p.tileUniqueId))
    
    // New contract gives us tiles as display numbers (0-9) directly
    const allHandTiles = playerInfo.hand.map((tileNumber: number, index: number) => ({
      id: getNumberTileId(tileNumber),
      uniqueId: `hand-${blockchainGameId}-${playerInfo.lastMoveTime}-${index}`, // Stable unique ID based on game state
      location: { type: 'Hand' as const, player: 'current' },
      number: tileNumber // Display number (0-9)
    } as BlockchainTile))
    
    // Filter out tiles that have been staged
    const stagedTileIds = stagedPlacements.map(placement => placement.tileUniqueId)
    const availableHandTiles = allHandTiles.filter(tile => !stagedTileIds.includes(tile.uniqueId))
    
    console.log('🎯 Hand tiles debug:')
    console.log('  - All hand tiles:', allHandTiles.length, allHandTiles.map(t => `${t.number}(${t.uniqueId})`))
    console.log('  - Staged tile IDs:', stagedTileIds)
    console.log('  - Available hand tiles:', availableHandTiles.length, availableHandTiles.map(t => `${t.number}(${t.uniqueId})`))
    
    return availableHandTiles
  }, [playerInfo, stagedPlacements])

  // Keep track of last known good data to prevent flashing during refreshes
  // Update last known data whenever we get fresh data
  if (currentGame && currentGame !== lastKnownGame) {
    setLastKnownGame(currentGame)
  }
  if (playerInfo && playerInfo !== lastKnownPlayerInfo) {
    setLastKnownPlayerInfo(playerInfo)
  }
  
  // Use current data or fall back to last known data
  const displayGame = currentGame || lastKnownGame
  const displayPlayerInfo = playerInfo || lastKnownPlayerInfo

  // Prepare endgame modal data
  const endGameData = useMemo(() => {
    if (!displayGame || displayGame.state !== 2 || !displayPlayerInfo) return null

    // Create player data for the modal
    const allPlayers = displayGame.playerAddresses.map((address: string, index: number) => ({
      address,
      name: `Player ${index + 1}`,
      score: displayGame.playerScores[index] || 0,
      finalHandSize: address.toLowerCase() === primaryWallet?.address?.toLowerCase() 
        ? (displayPlayerInfo.hand?.length || 0) 
        : 0 // We don't have other players' hand info
    }))

    // Find winner (highest score)
    const winner = allPlayers.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    )

    const gameStats = {
      totalTurns: displayGame.turnNumber || 0,
      finalTilePool: displayGame.tilesRemaining || 0,
      gameTime: undefined // Could add game duration calculation if needed
    }

    return { winner, allPlayers, gameStats }
  }, [displayGame, displayPlayerInfo, primaryWallet])

  // Convert blockchain state to local game format
  const localGameConfig = useMemo(() => {
    if (!displayGame) return gameConfig
    
    return {
      ...gameConfig,
      playerCount: displayGame.playerAddresses.length,
      playerNames: displayGame.playerAddresses.map((addr: string, i: number) => 
        `Player ${i + 1} (${addr.slice(0, 6)}...${addr.slice(-4)})`
      )
    }
  }, [displayGame, gameConfig])

  if (error) {
    return (
      <div css={errorStyle}>
        <h2>Error Loading Blockchain Game</h2>
        <p>{error}</p>
        <button css={backButtonStyle} onClick={onBackToSetup}>
          Back to Setup
        </button>
      </div>
    )
  }

  // Only show loading during initial load when we haven't loaded any data yet
  if (loading || (!currentGame && !playerInfo && isInitialLoad)) {
    return (
      <div css={loadingStyle}>
        <div css={spinnerStyle}></div>
        <p>Loading blockchain game...</p>
      </div>
    )
  }

  // Only show loading if we have never successfully loaded any data
  if (!displayGame || !displayPlayerInfo) {
    console.log('⚠️ No game data available yet, showing loading...')
    return (
      <div css={loadingStyle}>
        <div css={spinnerStyle}></div>
        <p>Loading blockchain game...</p>
      </div>
    )
  }

  return (
    <div css={containerStyle}>
      {/* Main Game Area */}
      <div css={mainAreaStyle(false)}>
        {/* Header */}
        <div css={headerStyle}>
          <div css={headerLeftStyle}>
            <button css={backButtonStyle} onClick={onBackToSetup} title="Back to Setup">
              ↩
            </button>
            <h1 css={titleStyle}>SUMMON FIVES</h1>
            <div css={gameModeStyle}>
              🔗 Blockchain Game #{blockchainGameId} (50-Tile Pool)
            </div>
          </div>

          <div css={headerCenterStyle}>
            <div css={turnInfoStyle}>
              <span css={turnLabelStyle}>Turn</span>
              <span css={turnNumberStyle}>{displayGame.turnNumber}</span>
            </div>
            <div css={separatorStyle}>•</div>
            <div css={infoRowStyle}>
              <div css={scoreInfoStyle}>
                <span css={scoreNumberStyle}>{displayPlayerInfo.score}</span>
                <span css={scoreLabelStyle}>Points</span>
              </div>
              <div css={separatorStyle}>•</div>
              <div css={tilesInfoStyle}>
                <span css={tilesNumberStyle}>{handTiles.length}</span>
                <span css={tilesLabelStyle}>Hand</span>
              </div>
              <div css={separatorStyle}>•</div>
              <div css={tilesInfoStyle}>
                <span css={tilesNumberStyle}>{displayGame.tilesRemaining}</span>
                <span css={tilesLabelStyle}>Pool</span>
              </div>
              <div css={separatorStyle}>•</div>
              <div css={currentPlayerStyle}>
                {displayGame.playerAddresses[displayGame.currentPlayerIndex]?.toLowerCase() === 
                 primaryWallet?.address?.toLowerCase() 
                  ? 'Your Turn' 
                  : `Waiting for ${displayGame.playerAddresses[displayGame.currentPlayerIndex]?.slice(0, 6)}...${displayGame.playerAddresses[displayGame.currentPlayerIndex]?.slice(-4)}`}
              </div>
            </div>
          </div>

          <div css={headerRightStyle}>
            {isSyncing && (
              <div css={syncIndicatorStyle}>
                🔄 Syncing...
              </div>
            )}
            <div css={gameStateIndicatorStyle}>
              {displayGame.state === 0 ? '⏳ Setup' : 
               displayGame.state === 1 ? '✅ Playing' : 
               displayGame.state === 2 ? '🏁 Complete' : '❌ Cancelled'}
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div css={boardAreaStyle}>
          <div css={boardContainerStyle}>
            <div css={gameboardStyle}>
              {Array.from({ length: 15 }, (_, row) =>
                Array.from({ length: 15 }, (_, col) => {
                  // Convert grid coordinates to blockchain coordinates
                  const blockchainX = col
                  const blockchainY = row
                  
                  // Find if there's a tile at this position
                  const placedTile = placedTiles.find(
                    tile => tile.x === blockchainX && tile.y === blockchainY
                  )
                  const stagedTile = stagedPlacements.find(
                    placement => placement.x === blockchainX && placement.y === blockchainY
                  )
                  
                  // Check if this is a valid placement position for the selected tile
                  const isValidPosition = selectedTile && !placedTile && !stagedTile ? 
                    validatePlacement(blockchainX, blockchainY, selectedTile.number).isValid : false
                  
                  return (
                    <div
                      key={`${row}-${col}`}
                      css={boardSpaceStyle}
                      onClick={() => handleTileStaging(blockchainX, blockchainY)}
                    >
                      {placedTile ? (
                        <div css={placedTileStyle}>
                          <span css={tileNumberStyle}>{placedTile.number}</span>
                        </div>
                      ) : stagedTile ? (
                        <div css={stagedTileStyle}>
                          <span css={tileNumberStyle}>{stagedTile.number}</span>
                        </div>
                      ) : (
                        <div css={[emptySpaceStyle, isValidPosition && validPositionStyle]}>
                          {row === 7 && col === 7 ? '★' : ''}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
          
          {/* Game Message */}
          {gameMessage && (
            <div css={statusStyle}>
              {gameMessage}
            </div>
          )}
        </div>
      </div>
      
      {/* Sidebar */}
      <div css={sidebarStyle(false)}>
      {/* Player Hand */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Your Hand ({handTiles.length} tiles)</h3>
          <div css={handGridStyle}>
            {handTiles.map((tile) => (
            <div 
              key={tile.uniqueId}
              css={[
                handTileStyle, 
                selectedTile?.uniqueId === tile.uniqueId && selectedTileStyle
              ]}
                onClick={() => setSelectedTile(selectedTile?.uniqueId === tile.uniqueId ? null : tile)}
              >
                {tile.number}
            </div>
          ))}
        </div>
      </div>

        {/* Staged Placements */}
        {stagedPlacements.length > 0 && (
          <div css={sectionStyle}>
            <h3 css={sectionTitleStyle}>Staged Tiles ({stagedPlacements.length})</h3>
            <div css={stagedListStyle}>
              {stagedPlacements.map((placement, index) => (
                <div key={index} css={stagedItemStyle}>
                  <span css={stagedTileNumberStyle}>{placement.number}</span>
                  <span css={stagedPositionStyle}>({placement.x}, {placement.y})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Controls */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Actions</h3>
          <div css={controlsStyle}>
            {/* Manual Refresh Button (always available) */}
            <button 
              css={refreshButtonStyle}
              onClick={handleManualRefresh}
              disabled={isSyncing || hookLoading}
            >
              {isSyncing ? 'Refreshing...' : '🔄 Manual Refresh'}
            </button>
            
            {stagedPlacements.length > 0 ? (
              <>
                <button 
                  css={confirmButtonStyle}
                  onClick={handleConfirmTurn}
                  disabled={isConfirming || hookLoading}
                >
                  {isConfirming ? 'Confirming...' : `Confirm Turn (${stagedPlacements.length} tiles)`}
                </button>
                <button 
                  css={clearButtonStyle}
                  onClick={handleClearStaged}
                  disabled={isConfirming || hookLoading}
                >
                  Clear Staged
                </button>
              </>
            ) : (
              <button 
                css={skipButtonStyle}
                onClick={handleSkipTurn}
                disabled={hookLoading}
              >
                {hookLoading ? 'Processing...' : 'Skip Turn (Draw Tiles)'}
              </button>
            )}
          </div>
        </div>

        {/* Tile Pool Status */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Tile Pool ({displayGame.tilesRemaining} remaining)</h3>
          <div css={tilePoolStyle}>
            {tilePoolStatus.map((count, number) => (
              <div key={number} css={poolItemStyle}>
                <span css={poolNumberStyle}>{number}</span>
                <span css={poolCountStyle}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Rules */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Game Rules</h3>
          <div css={rulesStyle}>
            <div css={ruleItemStyle}>
              <strong>Placement:</strong> Tiles must be adjacent to existing tiles
            </div>
            <div css={ruleItemStyle}>
              <strong>Math Rule:</strong> Adjacent numbers must sum to 5 OR differ by 5
            </div>
            <div css={ruleItemStyle}>
              <strong>Examples:</strong>
              <div css={examplesStyle}>
                <span>Sum: 2+3=5, 1+4=5, 0+5=5</span>
                <span>Diff: 9-4=5, 8-3=5, 7-2=5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Game Info</h3>
          <div css={gameInfoStyle}>
            <div css={infoItemStyle}>
              <span>Players:</span>
              <span>{displayGame.playerAddresses.length}/{displayGame.maxPlayers}</span>
            </div>
            <div css={infoItemStyle}>
              <span>Turn:</span>
              <span>{displayGame.turnNumber}</span>
            </div>
            <div css={infoItemStyle}>
              <span>Score:</span>
              <span>{displayPlayerInfo.score}</span>
            </div>
            <div css={infoItemStyle}>
              <span>Status:</span>
              <span>{displayGame.state === 1 ? 'Playing' : 'Waiting'}</span>
            </div>
          </div>
        </div>

        {/* Turn Debug (always visible) */}
        <div css={sectionStyle}>
          <h3 css={sectionTitleStyle}>Turn Status</h3>
          <div css={debugContentStyle}>
            <div css={debugItemStyle}>
              Current Player Index: <strong>{displayGame.currentPlayerIndex}</strong>
            </div>
            <div css={debugItemStyle}>
              Current Player: <strong>{displayGame.playerAddresses[displayGame.currentPlayerIndex]?.slice(0, 8)}...</strong>
            </div>
            <div css={debugItemStyle}>
              Your Address: <strong>{primaryWallet?.address?.slice(0, 8)}...</strong>
            </div>
            <div css={debugItemStyle}>
              Is Your Turn: <strong style={{color: displayGame.playerAddresses[displayGame.currentPlayerIndex]?.toLowerCase() === primaryWallet?.address?.toLowerCase() ? '#10b981' : '#f87171'}}>
                {displayGame.playerAddresses[displayGame.currentPlayerIndex]?.toLowerCase() === primaryWallet?.address?.toLowerCase() ? 'YES' : 'NO'}
              </strong>
            </div>
          </div>
        </div>

        {/* Debug Info (compact) */}
        <div css={sectionStyle}>
          <details css={debugSectionStyle}>
            <summary css={debugTitleStyle}>Debug Info</summary>
            <div css={debugContentStyle}>
              <div css={debugItemStyle}>Game ID: {blockchainGameId}</div>
              <div css={debugItemStyle}>State: {displayGame.state}</div>
              <div css={debugItemStyle}>Current Player: {displayGame.currentPlayerIndex}</div>
              <div css={debugItemStyle}>Tiles in Pool: {displayGame.tilesRemaining}</div>
              <div css={debugItemStyle}>Hand Size: {handTiles.length}</div>
            </div>
          </details>
        </div>
      </div>
      
      {/* Endgame Modal */}
      {showEndGameModal && endGameData && (
        <BlockchainEndGameModal
          isOpen={showEndGameModal}
          onClose={() => setShowEndGameModal(false)}
          gameId={blockchainGameId}
          winner={endGameData.winner}
          allPlayers={endGameData.allPlayers}
          gameStats={endGameData.gameStats}
          onNewGame={() => {
            setShowEndGameModal(false)
            onBackToSetup()
          }}
        />
      )}
    </div>
  )
}

// Styles (keeping the existing ones and adding new ones)
const containerStyle = css`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  color: #e5e5e5;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`

const loadingStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  color: #e5e5e5;
`

const spinnerStyle = css`
  width: 40px;
  height: 40px;
  border: 4px solid #3a3a5c;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const errorStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  color: #e5e5e5;
  text-align: center;
  padding: 20px;
  
  h2 {
    color: #f87171;
    margin-bottom: 16px;
  }
  
  p {
    margin-bottom: 24px;
    max-width: 500px;
    line-height: 1.5;
  }
`

const backButtonStyle = css`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background: #4338ca;
  }
`

const mainAreaStyle = (collapsed: boolean) => css`
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
`

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`

const headerLeftStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const titleStyle = css`
  font-size: 20px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
`

const gameModeStyle = css`
  font-size: 12px;
  color: #a1a1aa;
  background: rgba(99, 102, 241, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
`

const headerCenterStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const turnInfoStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const turnLabelStyle = css`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const turnNumberStyle = css`
  font-size: 18px;
  font-weight: 700;
  color: #6366f1;
`

const separatorStyle = css`
  color: #4b5563;
  font-size: 12px;
`

const infoRowStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const scoreInfoStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const scoreNumberStyle = css`
  font-size: 16px;
  font-weight: 600;
  color: #10b981;
`

const scoreLabelStyle = css`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const tilesInfoStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const tilesNumberStyle = css`
  font-size: 16px;
  font-weight: 600;
  color: #f59e0b;
`

const tilesLabelStyle = css`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const currentPlayerStyle = css`
  font-size: 14px;
  font-weight: 500;
  color: #e5e5e5;
  background: rgba(99, 102, 241, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
`

const headerRightStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const gameStateIndicatorStyle = css`
  font-size: 12px;
  color: #10b981;
  background: rgba(16, 185, 129, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
`

const syncIndicatorStyle = css`
  font-size: 11px;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 8px;
  animation: pulse 1.5s ease-in-out infinite alternate;
  
  @keyframes pulse {
    from { opacity: 0.7; }
    to { opacity: 1; }
  }
`

const boardAreaStyle = css`
  flex: 1;
  padding: 20px;
  overflow: hidden;
`

const sidebarStyle = (collapsed: boolean) => css`
  width: ${collapsed ? '60px' : '320px'};
  background: rgba(0, 0, 0, 0.4);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  overflow-y: auto;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
`

const sectionStyle = css`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const sectionTitleStyle = css`
  font-size: 14px;
  font-weight: 600;
  color: #e5e5e5;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const handGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
`

const handTileStyle = css`
  width: 40px;
  height: 40px;
  background: rgba(99, 102, 241, 0.2);
  border: 2px solid rgba(99, 102, 241, 0.4);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #e5e5e5;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(99, 102, 241, 0.3);
    border-color: rgba(99, 102, 241, 0.6);
    transform: translateY(-2px);
  }
`

const selectedTileStyle = css`
  background: rgba(99, 102, 241, 0.4) !important;
  border-color: #6366f1 !important;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
`

const controlsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const skipButtonStyle = css`
  background: #f59e0b;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #d97706;
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
`

const tilePoolStyle = css`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
`

const poolItemStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const poolNumberStyle = css`
  font-size: 12px;
  font-weight: 600;
  color: #e5e5e5;
`

const poolCountStyle = css`
  font-size: 10px;
  color: #a1a1aa;
`

const gameInfoStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const infoItemStyle = css`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #a1a1aa;
  
  span:last-child {
    color: #e5e5e5;
    font-weight: 500;
  }
`

const debugSectionStyle = css`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
`

const debugTitleStyle = css`
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #a1a1aa;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`

const debugContentStyle = css`
  padding: 8px 12px;
  font-size: 11px;
  color: #6b7280;
`

const debugItemStyle = css`
  margin-bottom: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  
  &:last-child {
    margin-bottom: 0;
  }
`

// Board-specific styles
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
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(99, 102, 241, 0.3);
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
  background: rgba(99, 102, 241, 0.1);
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(99, 102, 241, 0.2);
    transform: scale(1.05);
  }
`

const emptySpaceStyle = css`
  width: 100%;
  height: 100%;
  border: 2px dashed rgba(99, 102, 241, 0.3);
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  font-size: 1.2rem;
  font-weight: 600;

  &:hover {
    border-color: rgba(99, 102, 241, 0.6);
    background: rgba(99, 102, 241, 0.1);
  }
`

const placedTileStyle = css`
  width: 100%;
  height: 100%;
  background: rgba(99, 102, 241, 0.4);
  border: 2px solid #6366f1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
`

const tileNumberStyle = css`
  color: white;
  font-weight: bold;
  font-size: 1rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`

const statusStyle = css`
  text-align: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #e5e5e5;
  font-size: 14px;
  font-weight: 500;
  margin-top: 16px;
  border-radius: 6px;
`

// Staged tile styles
const stagedTileStyle = css`
  width: 100%;
  height: 100%;
  background: rgba(251, 191, 36, 0.4);
  border: 2px solid #f59e0b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`

const stagedListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
`

const stagedItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 4px;
  font-size: 12px;
`

const stagedTileNumberStyle = css`
  background: #f59e0b;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
`

const stagedPositionStyle = css`
  color: #a1a1aa;
  font-size: 11px;
  font-family: 'Monaco', 'Menlo', monospace;
`

const confirmButtonStyle = css`
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
`

const clearButtonStyle = css`
  background: #6b7280;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #4b5563;
  }

  &:disabled {
    background: #374151;
    cursor: not-allowed;
  }
`

const validPositionStyle = css`
  border-color: rgba(16, 185, 129, 0.6) !important;
  background: rgba(16, 185, 129, 0.1) !important;
  
  &:hover {
    border-color: rgba(16, 185, 129, 0.8) !important;
    background: rgba(16, 185, 129, 0.2) !important;
    transform: scale(1.05);
  }
`

const rulesStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
  color: #a1a1aa;
`

const ruleItemStyle = css`
  line-height: 1.4;
  
  strong {
    color: #e5e5e5;
  }
`

const examplesStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
  padding-left: 8px;
  font-size: 10px;
  color: #6b7280;
`

const refreshButtonStyle = css`
  background: #f59e0b;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #d97706;
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
`


