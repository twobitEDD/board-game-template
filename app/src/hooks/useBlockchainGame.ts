import { useCallback, useState, useEffect } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { createPublicClient, createWalletClient, http, parseEther, formatEther, custom, encodeFunctionData } from 'viem'
import { writeContract } from 'viem/actions'
import { base, hardhat } from 'viem/chains'
import FivesGameABI from '../contracts/FivesGame.json'
import type { TileItem } from '../types/GameTypes'

// Network-specific contract configurations
const NETWORK_CONFIGS = {
  8453: { // Base Mainnet
    contractAddress: '0x80f80B22D1839F2216F7f7814398e7039Fc17546' as `0x${string}`,
    chain: base,
    rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/demo', // Alchemy has higher rate limits
    name: 'Base Mainnet'
  },
  1337: { // Hardhat Local
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`, // Default Hardhat first deployment
    chain: hardhat,
    rpcUrl: 'http://127.0.0.1:8545',
    name: 'Hardhat Local'
  }
}

interface BlockchainGame {
  id: number
  state: number // 0=Setup, 1=InProgress, 2=Completed, 3=Cancelled
  creator: string
  maxPlayers: number
  currentPlayerIndex: number
  turnNumber: number
  playerAddresses: string[]
  playerScores: number[]
  createdAt: number
  allowIslands: boolean
  tilesRemaining: number // New field for tile pool status
}

interface PlayerInfo {
  name: string
  score: number
  hand: number[]
  hasJoined: boolean
  lastMoveTime: number
}

interface TilePlacement {
  number: number
  x: number
  y: number
}

interface TilePoolStatus {
  remainingCounts: number[] // Array of 10 numbers showing remaining tiles for each number 0-9
}

export function useBlockchainGame() {
  const { primaryWallet, user } = useDynamicContext()
  const [loading, setLoading] = useState(false)
  const [currentGame, setCurrentGame] = useState<BlockchainGame | null>(null)
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentNetwork, setCurrentNetwork] = useState<number | null>(null)

  // Get current network configuration
  const getNetworkConfig = useCallback((chainId?: number) => {
    const networkId = chainId || currentNetwork
    if (!networkId || !NETWORK_CONFIGS[networkId]) {
      console.warn('⚠️ Unknown network, defaulting to Base mainnet')
      return NETWORK_CONFIGS[8453] // Default to Base mainnet
    }
    return NETWORK_CONFIGS[networkId]
  }, [currentNetwork])

  // Create dynamic public client based on current network
  const getPublicClient = useCallback((chainId?: number) => {
    const config = getNetworkConfig(chainId)
    return createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl)
    })
  }, [getNetworkConfig])

  // Update current network when wallet changes
  useEffect(() => {
    const updateNetwork = async () => {
      if (primaryWallet) {
        try {
          const chainId = await primaryWallet.getNetwork()
          const networkId = Number(chainId)
          setCurrentNetwork(networkId)
          console.log('🌐 Network updated:', networkId, getNetworkConfig(networkId).name)
        } catch (error) {
          console.warn('⚠️ Could not get network:', error)
        }
      } else {
        setCurrentNetwork(null)
      }
    }
    
    updateNetwork()
  }, [primaryWallet, getNetworkConfig])

  // Reduced debug logging to prevent console spam
  useEffect(() => {
    if (error) {
      console.log('🔍 useBlockchainGame error:', error)
    }
  }, [error])

  // Helper to check if wallet is connected and get network info
  const ensureConnection = useCallback(async () => {
    console.log('🔌 Checking wallet connection...', { primaryWallet: !!primaryWallet })
    
    if (!primaryWallet) {
      throw new Error('Please connect your wallet first')
    }

    // Get current network
    const chainId = await primaryWallet.getNetwork()
    const networkId = Number(chainId)
    setCurrentNetwork(networkId)
    
    const config = getNetworkConfig(networkId)
    console.log('🌐 Connected to network:', config.name, 'Chain ID:', networkId)
    console.log('📄 Using contract:', config.contractAddress)

    // Check wallet balance
    try {
      const publicClient = getPublicClient(networkId)
      const balance = await publicClient.getBalance({
        address: primaryWallet.address as `0x${string}`
      })
      
      console.log('💰 Wallet balance:', formatEther(balance), 'ETH')
      
      // Warn if balance is very low
      if (balance < parseEther('0.001')) {
        console.warn('⚠️ Low wallet balance detected. You may need more ETH for transactions.')
      }
    } catch (balanceError) {
      console.warn('⚠️ Could not check balance:', balanceError)
    }

    return { networkId, config }
  }, [primaryWallet, getNetworkConfig, getPublicClient])

  // Create a new game on the blockchain with new parameters
  const createGame = useCallback(async (maxPlayers: number, allowIslands: boolean, winningScore: number, playerName: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { networkId, config } = await ensureConnection()
      const publicClient = getPublicClient(networkId)
      
      console.log('🎮 Creating blockchain game...', { maxPlayers, allowIslands, winningScore, playerName })
      console.log('📄 Using contract address:', config.contractAddress)
      
      if (!primaryWallet) {
        throw new Error('Wallet not available')
      }

      // Use Dynamic's recommended approach to get the wallet client
      const walletClient = await primaryWallet.getWalletClient()
      
      console.log('📋 Wallet client obtained:', !!walletClient)
      
      // Test wallet connectivity before attempting the transaction
      try {
        console.log('🧪 Testing wallet connectivity...')
        
        // Test 1: Check if we can get the current chain ID
        const currentChainId = await walletClient.getChainId()
        console.log('🔗 Current chain ID:', currentChainId)
        
        // Test 2: Check if we can get account balance
        const balance = await publicClient.getBalance({
          address: primaryWallet.address as `0x${string}`
        })
        console.log('💰 Account balance:', formatEther(balance), 'ETH')
        
        // Test 3: Try a simple contract call (view function)
        const nextGameId = await publicClient.readContract({
          address: config.contractAddress,
          abi: FivesGameABI.abi,
          functionName: 'nextGameId'
        })
        console.log('🎯 Next game ID from contract:', nextGameId)
        
        console.log('✅ All connectivity tests passed')
        
      } catch (testError) {
        console.error('❌ Connectivity test failed:', testError)
        throw new Error(`Wallet connectivity test failed: ${testError.message}. Please check your wallet connection and network settings.`)
      }
      
      // Call the createGame function with new parameters - ensure proper types
      const contractMaxPlayers = Math.max(2, Math.min(4, Math.floor(maxPlayers))) // Ensure uint8 range
      const contractWinningScore = Math.max(50, Math.min(500, Math.floor(winningScore))) // Ensure valid range
      const contractPlayerName = String(playerName).trim() // Ensure string
      const contractAllowIslands = Boolean(allowIslands) // Ensure boolean
      
      console.log('📞 Calling createGame with args:', {
        address: config.contractAddress,
        functionName: 'createGame',
        args: [contractMaxPlayers, contractAllowIslands, contractWinningScore, contractPlayerName],
        account: primaryWallet.address
      })
      
      // Add timeout handling and better error context
      const createGamePromise = writeContract(walletClient, {
        address: config.contractAddress,
        abi: FivesGameABI.abi,
        functionName: 'createGame',
        args: [contractMaxPlayers, contractAllowIslands, contractWinningScore, contractPlayerName],
        chain: config.chain,
        account: primaryWallet.address as `0x${string}`,
        gas: 1000000n // Set explicit gas limit
      })
      
      // Set a timeout for the transaction
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Transaction timed out after 30 seconds. This may be a wallet connection issue.'))
        }, 30000)
      })
      
      const txHash = await Promise.race([createGamePromise, timeoutPromise]) as `0x${string}`

      console.log('📝 Create game transaction sent:', txHash)
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      console.log('✅ Transaction confirmed:', receipt)

      // Parse the GameCreated event from the transaction logs to get the game ID
      let gameId: number
      try {
        // Look for the GameCreated event in the logs
        const gameCreatedEvent = receipt.logs.find(log => 
          log.address.toLowerCase() === config.contractAddress.toLowerCase()
        )
        
        if (gameCreatedEvent && gameCreatedEvent.topics.length > 1 && gameCreatedEvent.topics[1]) {
          // The game ID should be in the first topic after the event signature
          gameId = parseInt(gameCreatedEvent.topics[1], 16)
          console.log('🎯 Parsed game ID from event:', gameId)
        } else {
          // Fallback: use a counter from the last game
          console.log('⚠️ Could not parse game ID from event, using fallback')
          gameId = Math.floor(Date.now() / 1000) % 10000 // Simple fallback
        }
      } catch (parseError) {
        console.warn('⚠️ Event parsing failed, using fallback:', parseError)
        gameId = Math.floor(Date.now() / 1000) % 10000
      }

      console.log('🎮 Using game ID:', gameId)

      // Try to fetch the game state from the contract
      let newGame: BlockchainGame
      let playerData: any[] | null = null
      
      try {
        const gameData = await publicClient.readContract({
          address: config.contractAddress,
          abi: FivesGameABI.abi,
          functionName: 'getGame',
          args: [gameId]
        }) as any[]

        console.log('📊 Raw game data from contract:', gameData)

        newGame = {
          id: gameId,
          state: gameData[0] || 0,
          creator: gameData[1] || primaryWallet!.address,
          maxPlayers: gameData[2] || maxPlayers,
          currentPlayerIndex: gameData[3] || 0,
          turnNumber: Number(gameData[4]) || 1,
          playerAddresses: Array.isArray(gameData[7]) ? gameData[7] : [primaryWallet!.address],
          playerScores: Array.isArray(gameData[8]) ? gameData[8].map((score: bigint) => Number(score)) : [0],
          createdAt: Number(gameData[5]) || Math.floor(Date.now() / 1000),
          allowIslands: gameData[6] !== undefined ? gameData[6] : allowIslands,
          tilesRemaining: Number(gameData[9]) || 50 // New field for tile pool
        }
        
        // Fetch player info from contract
        try {
          playerData = await publicClient.readContract({
            address: config.contractAddress,
            abi: FivesGameABI.abi,
            functionName: 'getPlayer',
            args: [gameId, primaryWallet!.address]
          }) as any[]
          
          console.log('👤 Raw player data from contract:', playerData)
        } catch (playerError) {
          console.warn('⚠️ Could not fetch player data:', playerError)
        }
        
      } catch (contractError) {
        console.warn('⚠️ Could not fetch game data from contract, using defaults:', contractError)
        
        // Create a minimal game object with safe defaults
        newGame = {
          id: gameId,
          state: 0, // Setup
          creator: primaryWallet!.address,
          maxPlayers,
          currentPlayerIndex: 0,
          turnNumber: 1,
          playerAddresses: [primaryWallet!.address],
          playerScores: [0],
          createdAt: Math.floor(Date.now() / 1000),
          allowIslands,
          tilesRemaining: 50
        }
      }
      
      setCurrentGame(newGame)

      // Set player info with safe defaults
      if (playerData && Array.isArray(playerData)) {
        setPlayerInfo({
          name: playerData[0] || playerName,
          score: Number(playerData[1]) || 0,
          hand: Array.isArray(playerData[2]) ? playerData[2].map((tile: any) => Number(tile)) : [],
          hasJoined: playerData[3] !== undefined ? playerData[3] : true,
          lastMoveTime: Number(playerData[4]) || Math.floor(Date.now() / 1000)
        })
      } else {
        setPlayerInfo({
          name: playerName,
          score: 0,
          hand: [],
          hasJoined: true,
          lastMoveTime: Math.floor(Date.now() / 1000)
        })
      }

      console.log('✅ Game created successfully!', { gameId, txHash })
      return { gameId, txHash }
      
    } catch (err: any) {
      console.error('❌ Failed to create game:', err)
      setError(err.message || 'Failed to create game')
      throw err
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, ensureConnection, getPublicClient])

  // Helper function to refresh game data
  const refreshGameData = useCallback(async (gameId: number) => {
    if (!primaryWallet) return
    
    try {
      const { networkId, config } = await ensureConnection()
      const publicClient = getPublicClient(networkId)
      
      const gameData = await publicClient.readContract({
        address: config.contractAddress,
        abi: FivesGameABI.abi,
        functionName: 'getGame',
        args: [gameId]
      }) as any[]

      const updatedGame: BlockchainGame = {
        id: gameId,
        state: gameData[0],
        creator: gameData[1],
        maxPlayers: gameData[2],
        currentPlayerIndex: gameData[3],
        turnNumber: Number(gameData[4]),
        playerAddresses: gameData[7],
        playerScores: gameData[8].map((score: bigint) => Number(score)),
        createdAt: Number(gameData[5]),
        allowIslands: gameData[6],
        tilesRemaining: Number(gameData[9])
      }
      
      setCurrentGame(updatedGame)

      const playerData = await publicClient.readContract({
        address: config.contractAddress,
        abi: FivesGameABI.abi,
        functionName: 'getPlayer',
        args: [gameId, primaryWallet!.address]
      }) as any[]

      setPlayerInfo({
        name: playerData[0],
        score: Number(playerData[1]),
        hand: playerData[2].map((tile: any) => Number(tile)),
        hasJoined: playerData[3],
        lastMoveTime: Number(playerData[4])
      })
      
    } catch (error) {
      console.warn('⚠️ Failed to refresh game data:', error)
    }
  }, [primaryWallet, ensureConnection, getPublicClient])

  // Place multiple tiles in a single turn (batch placement)
  const playTurn = useCallback(async (gameId: number, placements: TilePlacement[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const { networkId, config } = await ensureConnection()
      const publicClient = getPublicClient(networkId)
      
      console.log('🎲 Playing turn with batch placement...', { gameId, placements })
      
      if (!primaryWallet) {
        throw new Error('Wallet not available')
      }

      // Use Dynamic's recommended approach to get the wallet client
      const walletClient = await primaryWallet.getWalletClient()

      const txHash = await writeContract(walletClient, {
        address: config.contractAddress,
        abi: FivesGameABI.abi,
        functionName: 'playTurn',
        args: [gameId, placements],
        chain: config.chain,
        account: primaryWallet.address as `0x${string}`
      })

      console.log('📝 Turn placement transaction sent:', txHash)
      
      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      console.log('✅ Turn placement confirmed:', receipt)
      
      // Refresh game and player data
      await refreshGameData(gameId)
      
      console.log('✅ Turn played successfully!', { placements, txHash })
      return txHash
      
    } catch (err: any) {
      console.error('❌ Failed to play turn:', err)
      setError(err.message || 'Failed to play turn')
      throw err
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, ensureConnection, getPublicClient, refreshGameData])

  // Legacy single tile placement (wraps the new batch system)
  const placeTile = useCallback(async (gameId: number, tileNumber: number, x: number, y: number) => {
    const placements: TilePlacement[] = [{ number: tileNumber, x, y }]
    return await playTurn(gameId, placements)
  }, [playTurn])

  // Skip turn to draw new tiles
  const skipTurn = useCallback(async (gameId: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const { networkId, config } = await ensureConnection()
      const publicClient = getPublicClient(networkId)
      
      console.log('⏭️ Skipping turn to draw tiles...', { gameId })
      
      if (!primaryWallet) {
        throw new Error('Wallet not available')
      }

      const walletClient = await primaryWallet.getWalletClient()

      const txHash = await writeContract(walletClient, {
        address: config.contractAddress,
        abi: FivesGameABI.abi,
        functionName: 'skipTurn',
        args: [gameId],
        chain: config.chain,
        account: primaryWallet.address as `0x${string}`
      })

      console.log('📝 Skip turn transaction sent:', txHash)
      
      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      console.log('✅ Skip turn confirmed:', receipt)
      
      // Refresh game and player data
      await refreshGameData(gameId)
      
      console.log('✅ Turn skipped successfully!', { txHash })
      return txHash
      
    } catch (err: any) {
      console.error('❌ Failed to skip turn:', err)
      setError(err.message || 'Failed to skip turn')
      throw err
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, ensureConnection, getPublicClient, refreshGameData])

  // Get tile pool status
  const getTilePoolStatus = useCallback(async (gameId: number): Promise<TilePoolStatus> => {
    try {
      const { networkId, config } = await ensureConnection()
      const publicClient = getPublicClient(networkId)
      
      console.log('🎲 Fetching tile pool status...', { gameId })
      
      const poolStatus = await publicClient.readContract({
        address: config.contractAddress,
        abi: FivesGameABI.abi,
        functionName: 'getTilePoolStatus',
        args: [gameId]
      }) as any[]

      const remainingCounts = poolStatus.map((count: bigint) => Number(count))
      
      console.log('📊 Tile pool status:', remainingCounts)
      
      return { remainingCounts }
      
    } catch (error) {
      console.error('❌ Failed to fetch tile pool status:', error)
      return { remainingCounts: Array(10).fill(0) }
    }
  }, [ensureConnection, getPublicClient])

  // Get all available games
  const getAllGames = useCallback(async (): Promise<BlockchainGame[]> => {
    try {
      if (!primaryWallet) {
        console.log('⚠️ Not connected to blockchain')
        return []
      }

      const { networkId, config } = await ensureConnection()
      const publicClient = getPublicClient(networkId)

      console.log('📋 Fetching all available games...')
      console.log('🔍 Contract address:', config.contractAddress)
      console.log('🔍 Network:', config.name)
      console.log('🔍 Wallet address:', primaryWallet.address)
      
      // Get the next game ID to determine how many games have been created
      console.log('🔍 Calling nextGameId...')
      const nextGameId = await publicClient.readContract({
        address: config.contractAddress,
        abi: FivesGameABI.abi,
        functionName: 'nextGameId',
        args: []
      }) as bigint

      const gameCount = Number(nextGameId) - 1 // nextGameId starts at 1, so subtract 1 for count
      console.log('🎮 Next Game ID from contract:', nextGameId.toString())
      console.log('🎮 Total games to fetch:', gameCount)

      if (gameCount <= 0) {
        console.log('📋 No games found to fetch')
        return []
      }

      const games: BlockchainGame[] = []
      
      // Fetch each game (starting from game ID 1, assuming 0 is not used)
      for (let gameId = 1; gameId <= gameCount; gameId++) {
        try {
          console.log(`🔍 Fetching game ${gameId}...`)
          const gameData = await publicClient.readContract({
            address: config.contractAddress,
            abi: FivesGameABI.abi,
            functionName: 'getGame',
            args: [gameId]
          }) as any[]

          console.log(`📊 Raw game data for game ${gameId}:`, gameData)

          const game: BlockchainGame = {
            id: gameId,
            state: gameData[0],
            creator: gameData[1],
            maxPlayers: gameData[2],
            currentPlayerIndex: gameData[3],
            turnNumber: Number(gameData[4]),
            playerAddresses: Array.isArray(gameData[7]) ? gameData[7] : [],
            playerScores: Array.isArray(gameData[8]) ? gameData[8].map((score: bigint) => Number(score)) : [],
            createdAt: Number(gameData[5]),
            allowIslands: gameData[6],
            tilesRemaining: Number(gameData[9]) || 50
          }

          console.log(`🎯 Processed game ${gameId}:`, game)

          // Only include games that are in setup or in progress (not completed/cancelled)
          if (game.state === 0 || game.state === 1) {
            games.push(game)
            console.log(`✅ Added game ${gameId} to list (state: ${game.state})`)
          } else {
            console.log(`⚠️ Skipped game ${gameId} (state: ${game.state} - not active)`)
          }
        } catch (gameError) {
          console.warn(`⚠️ Could not fetch game ${gameId}:`, gameError)
        }
      }

      console.log('📋 Final available games list:', games)
      return games

    } catch (error) {
      console.error('❌ Failed to fetch all games:', error)
      console.error('❌ Error details:', error.message, error.stack)
      return []
    }
  }, [primaryWallet, ensureConnection, getPublicClient])

  // Join an existing game
  const joinGame = useCallback(async (gameId: number, playerName: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { networkId, config } = await ensureConnection()
      const publicClient = getPublicClient(networkId)
      
      console.log('👥 Joining blockchain game...', { gameId, playerName })
      
      if (!primaryWallet) {
        throw new Error('Wallet not available')
      }

      const walletClient = await primaryWallet.getWalletClient()

      const txHash = await writeContract(walletClient, {
        address: config.contractAddress,
        abi: FivesGameABI.abi,
        functionName: 'joinGame',
        args: [gameId, playerName],
        chain: config.chain,
        account: primaryWallet.address as `0x${string}`
      })

      console.log('📝 Join game transaction sent:', txHash)
      
      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      console.log('✅ Join game confirmed:', receipt)
      
      // Refresh game data
      await refreshGameData(gameId)
      
      console.log('✅ Joined game successfully!', { gameId, txHash })
      return txHash
      
    } catch (err: any) {
      console.error('❌ Failed to join game:', err)
      setError(err.message || 'Failed to join game')
      throw err
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, ensureConnection, getPublicClient, refreshGameData])

  return {
    // State
    loading,
    currentGame,
    playerInfo,
    error,
    isConnected: !!primaryWallet,
    userAddress: primaryWallet?.address,
    contractAddress: getNetworkConfig().contractAddress,
    currentNetwork,
    networkName: getNetworkConfig().name,
    
    // Functions
    createGame,
    joinGame,
    playTurn,     // New batch placement function
    placeTile,    // Legacy single tile placement
    skipTurn,     // New skip turn function
    getTilePoolStatus, // New tile pool status function
    getAllGames,
    refreshGameData,
    clearGame: () => {}, // Placeholder for compatibility
    
    // Helper functions
    ensureConnection
  }
} 