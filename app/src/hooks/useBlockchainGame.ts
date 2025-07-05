import { useCallback, useState, useEffect } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { createPublicClient, createWalletClient, http, parseEther, formatEther, custom, encodeFunctionData } from 'viem'
import { writeContract } from 'viem/actions'
import { base, hardhat } from 'viem/chains'
import FivesGameABI from '../contracts/FivesGame.json'
import type { TileItem } from '../types/GameTypes'
import { getContractAddress, getNetworkConfig, getRpcUrls, isNetworkSupported, getConfigSummary, CONTRACT_CONFIG } from '../config/contractConfig'

// Network chain mapping for viem
const CHAIN_CONFIGS = {
  8453: base,
  1337: { ...hardhat, id: 1337 },
  84532: { ...base, id: 84532, name: 'Base Sepolia Testnet' }
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

  // Helper to check if wallet supports ZeroDev sponsored transactions
  const canUseSponsorship = useCallback(() => {
    if (!primaryWallet) {
      console.log('💰 SPONSORSHIP: No primary wallet available')
      return false
    }
    
    const connector = primaryWallet.connector
    const hasAAProvider = !!(connector as any).getAccountAbstractionProvider
    
    console.log('💰 SPONSORSHIP: Checking sponsorship capability:', {
      walletType: connector?.name || 'Unknown',
      hasGetAccountAbstractionProvider: hasAAProvider,
      connectorDetails: {
        name: connector?.name,
        type: connector?.type,
        id: connector?.id
      },
      walletAddress: primaryWallet.address,
      isConnected: primaryWallet.connected
    })
    
    return hasAAProvider
  }, [primaryWallet])

  // Auto-fund wallet helper (only for local development)
  const autoFundWallet = useCallback(async (walletAddress: string) => {
    try {
      console.log('🏦 Auto-funding wallet from Hardhat account...')
      console.log('  From: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Hardhat Account #0)')
      console.log('  To:', walletAddress)
      console.log('  Amount: 100 ETH')
      
      // Call the Hardhat node to transfer ETH from the first pre-funded account
      const response = await fetch('http://127.0.0.1:8545', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [{
            from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // First Hardhat account with 10,000 ETH
            to: walletAddress,
            value: '0x56BC75E2D630E0000' // 100 ETH in hex (100 * 10^18)
          }],
          id: Date.now()
        })
      })
      
      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      console.log('✅ Auto-funding transaction sent:', result.result)
      
      // Wait a moment for the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return result.result
    } catch (error) {
      console.error('❌ Auto-funding failed:', error)
      throw error
    }
  }, [])

  // Network detection and setup with improved fallbacks
  useEffect(() => {
    const updateNetwork = async () => {
      // Allow network detection even without wallet for public data reading
      if (!primaryWallet) {
        // For spectator mode, default to Base Sepolia to allow reading public data
        console.log('🌐 NETWORK: No wallet connected, using Base Sepolia for public data reading')
        setCurrentNetwork(84532) // Base Sepolia
        return
      }
      
      try {
        console.log('🌐 NETWORK: Starting network detection...')
        
        // Method 1: Try to get network from wallet
        let networkId: number | null = null
        try {
          networkId = await primaryWallet.getNetwork()
          console.log('🌐 NETWORK: Got network from wallet.getNetwork():', networkId)
        } catch (error) {
          console.log('🌐 NETWORK: wallet.getNetwork() failed:', error.message)
        }
        
        // Method 2: Fallback to chainId from connector
        if (!networkId && primaryWallet.connector) {
          try {
            const chainId = (primaryWallet.connector as any).chainId
            if (chainId) {
              networkId = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId
              console.log('🌐 NETWORK: Got network from connector.chainId:', networkId)
            }
          } catch (error) {
            console.log('🌐 NETWORK: connector.chainId failed:', error.message)
          }
        }
        
        // Method 3: Fallback to default Base Sepolia for development
        if (!networkId) {
          networkId = 84532 // Base Sepolia default
          console.log('🌐 NETWORK: Using fallback network (Base Sepolia):', networkId)
        }
        
        // Validate network is supported
        if (networkId && isNetworkSupported(networkId)) {
          setCurrentNetwork(networkId)
          console.log('✅ NETWORK: Network updated successfully:', networkId)
        } else {
          console.warn('⚠️ NETWORK: Unsupported network, using Base Sepolia fallback:', networkId)
          setCurrentNetwork(84532) // Force Base Sepolia as fallback
        }
        
      } catch (error) {
        console.error('❌ NETWORK: Failed to update network:', error)
        // Fallback to Base Sepolia
        setCurrentNetwork(84532)
      }
    }

    updateNetwork()

    // Listen for network changes
    const handleNetworkSwitched = (event: CustomEvent) => {
      console.log('🔄 NETWORK: Network switched event:', event.detail)
      updateNetwork()
    }

    const handleReadOnlyNetworkChanged = (event: CustomEvent) => {
      console.log('🔄 NETWORK: Read-only network changed event:', event.detail)
      updateNetwork()
    }

    // Add event listeners
    window.addEventListener('dynamic_network_switched', handleNetworkSwitched as EventListener)
    window.addEventListener('dynamic_readonly_network_changed', handleReadOnlyNetworkChanged as EventListener)

    return () => {
      window.removeEventListener('dynamic_network_switched', handleNetworkSwitched as EventListener)
      window.removeEventListener('dynamic_readonly_network_changed', handleReadOnlyNetworkChanged as EventListener)
    }
  }, [primaryWallet])

  // Get contract configuration for current network
  const getContractConfig = useCallback(() => {
    if (!currentNetwork) return null
    
    const config = getNetworkConfig(currentNetwork)
    if (!config) {
      console.warn(`⚠️ No contract configuration found for network ${currentNetwork}`)
      return null
    }
    
    return config
  }, [currentNetwork])

  // Get current network's public client for reading
  const getPublicClient = useCallback(() => {
    if (!currentNetwork) return null
    
    const rpcUrls = getRpcUrls(currentNetwork)
    if (!rpcUrls.length) return null
    
    const chain = CHAIN_CONFIGS[currentNetwork]
    if (!chain) return null
    
    return createPublicClient({
      chain,
      transport: http(rpcUrls[0])
    })
  }, [currentNetwork])

  // Calculate derived properties for backward compatibility (MOVED UP)
  const contractAddress = getContractConfig()?.contractAddress || null
  const networkName = getContractConfig()?.name || null
  const isConnected = !!currentNetwork // Allow connection for public data reading even without wallet
  const contractInteractionAddress = primaryWallet?.address || null

  // Send transaction with automatic sponsorship detection
  const sendTransaction = useCallback(async (functionName: string, args: any[]) => {
    if (!primaryWallet) throw new Error('Wallet not connected')
    
    const config = getContractConfig()
    if (!config) throw new Error('Contract not configured for current network')
    
    const chain = CHAIN_CONFIGS[currentNetwork!]
    if (!chain) throw new Error('Chain configuration not found')
    
    // Check if we can use sponsored transactions
    const canUseSponsor = canUseSponsorship()
    
    console.log('🎮 SIMPLIFIED: Sending transaction with player address approach', {
      functionName,
      args,
      config: config.contractAddress,
      network: currentNetwork,
      userDisplayAddress: primaryWallet.address,
      canUseSponsoredTransactions: canUseSponsor
    })

    try {
      // For functions that require player address parameter, add the user's display address
      let finalArgs = args
      if (functionName === 'createGame' || functionName === 'joinGame') {
        // Add the user's display address as the last parameter
        const playerDisplayAddress = primaryWallet.address
        finalArgs = [...args, playerDisplayAddress]
        
        console.log('🎮 SIMPLIFIED: Added player address parameter:', {
          originalArgs: args,
          finalArgs: finalArgs,
          playerDisplayAddress: playerDisplayAddress
        })
      }

      // Try sponsored transactions first if available
      if (canUseSponsor) {
        try {
          console.log('💰 SPONSORED: Attempting sponsored transaction...')
          console.log('💰 SPONSORED: Function:', functionName, 'Args:', finalArgs)
          
          const connector = primaryWallet.connector as any
          console.log('💰 SPONSORED: Connector details:', {
            name: connector?.name,
            key: connector?.key,
            hasAAProvider: !!connector?.getAccountAbstractionProvider
          })
          
          // Try different methods to get AA provider
          let aaProvider = null
          
          // Method 1: Direct call
          if (connector?.getAccountAbstractionProvider) {
            console.log('💰 SPONSORED: Trying direct getAccountAbstractionProvider...')
            aaProvider = await connector.getAccountAbstractionProvider()
          }
          
          // Method 2: With options
          if (!aaProvider && connector?.getAccountAbstractionProvider) {
            console.log('💰 SPONSORED: Trying with withSponsorship option...')
            aaProvider = await connector.getAccountAbstractionProvider({
              withSponsorship: true
            })
          }
          
          console.log('💰 SPONSORED: AA Provider result:', {
            hasProvider: !!aaProvider,
            providerType: aaProvider ? (aaProvider as any).constructor?.name : 'None',
            methods: aaProvider ? Object.keys(aaProvider) : []
          })
          
          if (aaProvider) {
            // Encode the function call
            const data = encodeFunctionData({
              abi: FivesGameABI.abi,
              functionName,
              args: finalArgs
            })
            
            console.log('💰 SPONSORED: Encoded data:', data)
            console.log('💰 SPONSORED: Contract address:', config.contractAddress)
            
            // Send sponsored transaction
            const txHash = await (aaProvider as any).sendTransaction({
              to: config.contractAddress as `0x${string}`,
              data,
              value: '0x0' // No ETH value needed
            })
            
            console.log('✅ SPONSORED: Transaction sent successfully:', txHash)
            return txHash
          } else {
            console.log('⚠️ SPONSORED: No AA provider available')
          }
        } catch (sponsorError) {
          console.error('❌ SPONSORED: Sponsored transaction failed:', sponsorError)
          console.error('❌ SPONSORED: Error details:', {
            message: sponsorError.message,
            cause: sponsorError.cause,
            stack: sponsorError.stack?.slice(0, 200)
          })
          console.warn('⚠️ SPONSORED: Falling back to regular transaction')
        }
      } else {
        console.log('⚠️ SPONSORED: Sponsorship not available - wallet does not support it')
      }

      // Fall back to regular transaction
      console.log('💳 REGULAR: Sending regular transaction...')
      const walletClient = await primaryWallet.getWalletClient()
      
      const txHash = await writeContract(walletClient, {
        address: config.contractAddress as `0x${string}`,
        abi: FivesGameABI.abi,
        functionName,
        args: finalArgs,
        chain,
        account: primaryWallet.address as `0x${string}`
      })

      console.log('✅ REGULAR: Transaction sent successfully:', txHash)
      return txHash
    } catch (error) {
      console.error('❌ Transaction failed:', error)
      throw error
    }
  }, [primaryWallet, currentNetwork, getContractConfig, canUseSponsorship])

  // Create a new game
  const createGame = useCallback(async (maxPlayers: number, allowIslands: boolean, winningScore: number, playerName: string) => {
    if (!primaryWallet) throw new Error('Wallet not connected')
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🎮 SIMPLIFIED: Creating game with simplified approach...')
      
      // Convert parameters to contract format
      const contractMaxPlayers = maxPlayers
      const contractAllowIslands = allowIslands
      const contractWinningScore = winningScore
      const contractPlayerName = playerName || 'Player'
      
      console.log('🎮 SIMPLIFIED: Game creation parameters:', {
        maxPlayers: contractMaxPlayers,
        allowIslands: contractAllowIslands,
        winningScore: contractWinningScore,
        playerName: contractPlayerName,
        userDisplayAddress: primaryWallet.address
      })
      
      // Send transaction - the sendTransaction function will add playerAddress parameter
      const txHash = await sendTransaction('createGame', [
        contractMaxPlayers,
        contractAllowIslands, 
        contractWinningScore,
        contractPlayerName
      ])
      
      console.log('✅ SIMPLIFIED: Game creation transaction sent:', txHash)
      
      // Wait for transaction confirmation
      const publicClient = getPublicClient()
      if (publicClient) {
        console.log('⏳ SIMPLIFIED: Waiting for transaction confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        console.log('✅ SIMPLIFIED: Transaction confirmed:', receipt)
        
        // Try to extract game ID from logs
        let gameId: number | null = null
        if (receipt.logs && receipt.logs.length > 0) {
          // Look for GameCreated event logs
          for (const log of receipt.logs) {
            try {
              // The first log topic should contain the game ID for GameCreated event
              if (log.topics && log.topics.length >= 2) {
                gameId = parseInt(log.topics[1], 16) // Convert hex to decimal
                console.log('🎮 SIMPLIFIED: Extracted game ID from logs:', gameId)
                break
              }
            } catch (e) {
              console.log('Could not parse log for game ID')
            }
          }
        }
        
        // Return object with both txHash and gameId for compatibility
        return { gameId, txHash }
      }
      
      return { gameId: null, txHash }
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to create game:', error)
      setError(error instanceof Error ? error.message : 'Failed to create game')
      throw error
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, sendTransaction, getPublicClient])

  // Join an existing game
  const joinGame = useCallback(async (gameId: number, playerName: string) => {
    if (!primaryWallet) throw new Error('Wallet not connected')
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🎮 SIMPLIFIED: Joining game with simplified approach...', {
        gameId,
        playerName,
        userDisplayAddress: primaryWallet.address
      })
      
      // Send transaction - the sendTransaction function will add playerAddress parameter
      const txHash = await sendTransaction('joinGame', [gameId, playerName || 'Player'])
      
      console.log('✅ SIMPLIFIED: Join game transaction sent:', txHash)
      
      // Wait for transaction confirmation
      const publicClient = getPublicClient()
      if (publicClient) {
        console.log('⏳ SIMPLIFIED: Waiting for transaction confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        console.log('✅ SIMPLIFIED: Transaction confirmed:', receipt)
      }
      
      return txHash
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to join game:', error)
      setError(error instanceof Error ? error.message : 'Failed to join game')
      throw error
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, sendTransaction, getPublicClient])

  // Start a game (only game creator)
  const startGame = useCallback(async (gameId: number) => {
    if (!primaryWallet) throw new Error('Wallet not connected')
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🎮 SIMPLIFIED: Starting game...', { gameId })
      
      const txHash = await sendTransaction('startGame', [gameId])
      
      console.log('✅ SIMPLIFIED: Start game transaction sent:', txHash)
      
      // Wait for transaction confirmation
      const publicClient = getPublicClient()
      if (publicClient) {
        console.log('⏳ SIMPLIFIED: Waiting for transaction confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        console.log('✅ SIMPLIFIED: Transaction confirmed:', receipt)
      }
      
      return txHash
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to start game:', error)
      setError(error instanceof Error ? error.message : 'Failed to start game')
      throw error
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, sendTransaction, getPublicClient])

  // Make a game move (alias for makeMove to support playTurn)
  const makeMove = useCallback(async (gameId: number, tileNumber: number, x: number, y: number) => {
    if (!primaryWallet) throw new Error('Wallet not connected')
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🎮 SIMPLIFIED: Making move...', { gameId, tileNumber, x, y })
      
      const txHash = await sendTransaction('makeMove', [gameId, tileNumber, x, y])
      
      console.log('✅ SIMPLIFIED: Move transaction sent:', txHash)
      
      // Wait for transaction confirmation
      const publicClient = getPublicClient()
      if (publicClient) {
        console.log('⏳ SIMPLIFIED: Waiting for transaction confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        console.log('✅ SIMPLIFIED: Transaction confirmed:', receipt)
      }
      
      return txHash
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to make move:', error)
      setError(error instanceof Error ? error.message : 'Failed to make move')
      throw error
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, sendTransaction, getPublicClient])

  // Play turn (batch moves) - properly calls contract's playTurn function
  const playTurn = useCallback(async (gameId: number, placements: TilePlacement[]) => {
    if (!primaryWallet) throw new Error('Wallet not connected')
    if (!placements || placements.length === 0) {
      throw new Error('No tile placements provided')
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🎮 SIMPLIFIED: Playing turn with batch placements...', { gameId, placements })
      
      // Format placements for contract (array of structs)
      const formattedPlacements = placements.map(p => ({
        number: p.number,
        x: p.x,
        y: p.y
      }))
      
      const txHash = await sendTransaction('playTurn', [gameId, formattedPlacements])
      
      console.log('✅ SIMPLIFIED: Play turn transaction sent:', txHash)
      
      // Wait for transaction confirmation
      const publicClient = getPublicClient()
      if (publicClient) {
        console.log('⏳ SIMPLIFIED: Waiting for transaction confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        console.log('✅ SIMPLIFIED: Transaction confirmed:', receipt)
        
        // 🔄 REFRESH PLAYER HAND after successful transaction
        console.log('🔄 SIMPLIFIED: Refreshing player hand after successful turn...')
        try {
          // Call getPlayerInfo directly to get fresh data
          const config = getContractConfig()
          if (publicClient && config) {
            const playerData = await publicClient.readContract({
              address: config.contractAddress as `0x${string}`,
              abi: FivesGameABI.abi,
              functionName: 'getPlayer',
              args: [gameId, primaryWallet.address]
            }) as any[]
            
            const updatedPlayerInfo: PlayerInfo = {
              name: playerData[0] as string,
              score: Number(playerData[1]),
              hand: (playerData[2] as bigint[]).map(tile => Number(tile)),
              hasJoined: playerData[3] as boolean,
              lastMoveTime: Number(playerData[4])
            }
            
            setPlayerInfo(updatedPlayerInfo)
            console.log('✅ SIMPLIFIED: Player hand refreshed:', updatedPlayerInfo.hand)
          }
        } catch (refreshError) {
          console.warn('⚠️ SIMPLIFIED: Could not refresh player hand:', refreshError.message)
        }
      }
      
      return txHash
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to play turn:', error)
      setError(error instanceof Error ? error.message : 'Failed to play turn')
      throw error
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, sendTransaction, getPublicClient, getContractConfig])

  // Draw a tile
  const drawTile = useCallback(async (gameId: number) => {
    if (!primaryWallet) throw new Error('Wallet not connected')
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🎮 SIMPLIFIED: Drawing tile...', { gameId })
      
      const txHash = await sendTransaction('drawTile', [gameId])
      
      console.log('✅ SIMPLIFIED: Draw tile transaction sent:', txHash)
      
      // Wait for transaction confirmation
      const publicClient = getPublicClient()
      if (publicClient) {
        console.log('⏳ SIMPLIFIED: Waiting for transaction confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        console.log('✅ SIMPLIFIED: Transaction confirmed:', receipt)
      }
      
      return txHash
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to draw tile:', error)
      setError(error instanceof Error ? error.message : 'Failed to draw tile')
      throw error
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, sendTransaction, getPublicClient])

  // Skip turn - properly calls contract's skipTurn function
  const skipTurn = useCallback(async (gameId: number): Promise<string> => {
    if (!primaryWallet) throw new Error('Wallet not connected')
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🎮 SIMPLIFIED: Skipping turn...', { gameId })
      
      const txHash = await sendTransaction('skipTurn', [gameId])
      
      console.log('✅ SIMPLIFIED: Skip turn transaction sent:', txHash)
      
      // Wait for transaction confirmation
      const publicClient = getPublicClient()
      if (publicClient) {
        console.log('⏳ SIMPLIFIED: Waiting for transaction confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        console.log('✅ SIMPLIFIED: Transaction confirmed:', receipt)
      }
      
      return txHash
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to skip turn:', error)
      setError(error instanceof Error ? error.message : 'Failed to skip turn')
      throw error
    } finally {
      setLoading(false)
    }
  }, [primaryWallet, sendTransaction, getPublicClient])

  // Read game state from contract
  const getGameState = useCallback(async (gameId: number): Promise<BlockchainGame | null> => {
    const publicClient = getPublicClient()
    const config = getContractConfig()
    
    if (!publicClient || !config) {
      console.log(`❌ SIMPLIFIED: getGameState(${gameId}) - No publicClient or config`, {
        hasPublicClient: !!publicClient,
        hasConfig: !!config
      })
      return null
    }
    
    try {
      console.log(`🔍 SIMPLIFIED: Reading game state for game: ${gameId}`)
      console.log(`🔍 SIMPLIFIED: Using contract: ${config.contractAddress}`)
      
      const gameData = await publicClient.readContract({
        address: config.contractAddress as `0x${string}`,
        abi: FivesGameABI.abi,
        functionName: 'getGame',
        args: [gameId]
      }) as any[]
      
      console.log(`📊 SIMPLIFIED: Raw game data from getGame(${gameId}):`, gameData)
      
      // Validate the data structure
      if (!Array.isArray(gameData) || gameData.length < 10) {
        console.error(`❌ SIMPLIFIED: Invalid game data structure for game ${gameId}:`, gameData)
        return null
      }
      
      // getGame() returns: (state, creator, maxPlayers, currentPlayerIndex, turnNumber, createdAt, allowIslands, playerAddresses, playerScores, tilesRemaining, winningScore)
      const game: BlockchainGame = {
        id: gameId,
        state: Number(gameData[0]),           // GameState
        creator: gameData[1] as string,       // address creator
        maxPlayers: Number(gameData[2]),      // uint8 maxPlayers
        currentPlayerIndex: Number(gameData[3]), // uint8 currentPlayerIndex
        turnNumber: Number(gameData[4]),      // uint256 turnNumber
        playerAddresses: gameData[7] as string[], // address[] playerAddresses
        playerScores: (gameData[8] as bigint[]).map(score => Number(score)), // uint256[] playerScores
        createdAt: Number(gameData[5]),       // uint256 createdAt
        allowIslands: gameData[6] as boolean, // bool allowIslands
        tilesRemaining: Number(gameData[9])   // uint256 tilesRemaining
      }
      
      console.log(`🎮 SIMPLIFIED: Parsed game state for game ${gameId}:`, {
        id: game.id,
        state: game.state,
        creator: game.creator,
        maxPlayers: game.maxPlayers,
        playerCount: game.playerAddresses.length,
        turnNumber: game.turnNumber
      })
      
      return game
    } catch (error) {
      console.error(`❌ SIMPLIFIED: Failed to read game state for game ${gameId}:`, error)
      console.error(`❌ SIMPLIFIED: Error details:`, {
        message: error.message,
        cause: error.cause,
        stack: error.stack?.slice(0, 200)
      })
      return null
    }
  }, [getPublicClient, getContractConfig])

  // Get all games - for backward compatibility
  const getAllGames = useCallback(async (): Promise<BlockchainGame[]> => {
    console.log('🔍 SIMPLIFIED: getAllGames() called, checking prerequisites...')
    
    const publicClient = getPublicClient()
    const config = getContractConfig()
    
    console.log('🔍 SIMPLIFIED: Prerequisites check:', {
      hasPublicClient: !!publicClient,
      hasConfig: !!config,
      currentNetwork,
      walletAddress: primaryWallet?.address,
      contractAddress: config?.contractAddress,
      networkName: config?.name
    })
    
    if (!publicClient || !config) {
      console.log('❌ SIMPLIFIED: No publicClient or config available', { 
        hasPublicClient: !!publicClient, 
        hasConfig: !!config,
        currentNetwork,
        configDetails: config,
        walletConnected: !!primaryWallet,
        supportedNetworks: Object.keys(CONTRACT_CONFIG.networks)
      })
      return []
    }
    
    try {
      console.log('🔍 SIMPLIFIED: Reading all games...')
      console.log('🔍 SIMPLIFIED: Using config:', {
        contractAddress: config.contractAddress,
        networkName: config.name,
        currentNetwork: currentNetwork
      })
      
      // Test basic connectivity first
      try {
        console.log('🧪 SIMPLIFIED: Testing basic contract connectivity...')
        const blockNumber = await publicClient.getBlockNumber()
        console.log('✅ SIMPLIFIED: RPC connection working, latest block:', blockNumber.toString())
      } catch (connectError) {
        console.error('❌ SIMPLIFIED: RPC connection failed:', connectError)
        throw new Error(`RPC connection failed: ${connectError.message}`)
      }
      
      // Try to get total number of games first
      let totalGames = 0
      try {
        console.log('🧪 SIMPLIFIED: Calling nextGameId...')
        const nextGameId = await publicClient.readContract({
          address: config.contractAddress as `0x${string}`,
          abi: FivesGameABI.abi,
          functionName: 'nextGameId',
          args: []
        }) as bigint
        totalGames = Number(nextGameId) - 1 // nextGameId is the next ID to use, so subtract 1 for current count
        console.log('📊 SIMPLIFIED: nextGameId from contract:', nextGameId.toString(), 'totalGames:', totalGames)
      } catch (e) {
        console.error('❌ SIMPLIFIED: Could not get nextGameId:', e)
        console.log('🔄 SIMPLIFIED: Falling back to manual game detection...')
        totalGames = 10 // fallback - try first 10 games
      }
      
      console.log('📊 SIMPLIFIED: Total games to fetch:', totalGames)
      
      if (totalGames === 0) {
        console.log('📝 SIMPLIFIED: No games found (nextGameId indicates 0 games)')
        return []
      }
      
      const games: BlockchainGame[] = []
      
      // Fetch each game individually with detailed logging
      for (let i = 1; i <= totalGames; i++) {
        try {
          console.log(`🔍 SIMPLIFIED: Fetching game ${i}...`)
          const game = await getGameState(i)
          if (game) {
            console.log(`✅ SIMPLIFIED: Game ${i} fetched successfully:`, {
              id: game.id,
              state: game.state,
              creator: game.creator.slice(0, 8) + '...',
              players: game.playerAddresses.length,
              maxPlayers: game.maxPlayers
            })
            games.push(game)
          } else {
            console.log(`⚠️ SIMPLIFIED: Game ${i} returned null from getGameState`)
          }
        } catch (error) {
          console.log(`❌ SIMPLIFIED: Game ${i} error:`, error.message)
          // Don't break - continue trying other games to see full picture
        }
      }
      
      console.log(`🎮 SIMPLIFIED: Final fetched games array (${games.length} games):`, games.map(g => ({
        id: g.id,
        state: ['Setup', 'InProgress', 'Completed', 'Cancelled'][g.state] || g.state,
        playerCount: g.playerAddresses.length,
        creator: g.creator.slice(0, 8) + '...'
      })))
      
      return games
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to read all games:', error)
      console.error('❌ SIMPLIFIED: Error details:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack?.slice(0, 300)
      })
      return []
    }
  }, [getPublicClient, getContractConfig, getGameState, currentNetwork, primaryWallet])

  // Get player information
  const getPlayerInfo = useCallback(async (gameId: number, playerAddress: string): Promise<PlayerInfo | null> => {
    const publicClient = getPublicClient()
    const config = getContractConfig()
    
    if (!publicClient || !config) return null
    
    try {
      console.log('🔍 SIMPLIFIED: Reading player info for:', { gameId, playerAddress })
      
      const playerData = await publicClient.readContract({
        address: config.contractAddress as `0x${string}`,
        abi: FivesGameABI.abi,
        functionName: 'getPlayer',
        args: [gameId, playerAddress]
      }) as any[]
      
      console.log('📊 SIMPLIFIED: Raw player data:', playerData)
      
      // getPlayer() returns: (name, score, hand, hasJoined, lastMoveTime)
      const playerInfo: PlayerInfo = {
        name: playerData[0] as string,
        score: Number(playerData[1]),
        hand: (playerData[2] as bigint[]).map(tile => Number(tile)),
        hasJoined: playerData[3] as boolean,
        lastMoveTime: Number(playerData[4])
      }
      
      console.log('👤 SIMPLIFIED: Parsed player info:', playerInfo)
      
      return playerInfo
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to read player info:', error)
      return null
    }
  }, [getPublicClient, getContractConfig])

  // Get tile pool status
  const getTilePoolStatus = useCallback(async (gameId: number): Promise<TilePoolStatus | null> => {
    const publicClient = getPublicClient()
    const config = getContractConfig()
    
    if (!publicClient || !config) return null
    
    try {
      console.log('🔍 SIMPLIFIED: Reading tile pool status for game:', gameId)
      
      const poolData = await publicClient.readContract({
        address: config.contractAddress as `0x${string}`,
        abi: FivesGameABI.abi,
        functionName: 'getTilePoolStatus',
        args: [gameId]
      }) as bigint[]
      
      console.log('📊 SIMPLIFIED: Raw pool data:', poolData)
      
      const tilePoolStatus: TilePoolStatus = {
        remainingCounts: poolData.map(count => Number(count))
      }
      
      console.log('🎲 SIMPLIFIED: Parsed tile pool status:', tilePoolStatus)
      
      return tilePoolStatus
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to read tile pool status:', error)
      return null
    }
  }, [getPublicClient, getContractConfig])

  // Get placed tiles on the board
  const getPlacedTiles = useCallback(async (gameId: number): Promise<TilePlacement[]> => {
    const publicClient = getPublicClient()
    const config = getContractConfig()
    
    if (!publicClient || !config) return []
    
    try {
      console.log('🔍 SIMPLIFIED: Reading placed tiles for game:', gameId)
      
      const tilesData = await publicClient.readContract({
        address: config.contractAddress as `0x${string}`,
        abi: FivesGameABI.abi,
        functionName: 'getPlacedTiles',
        args: [gameId]
      }) as any[]
      
      console.log('📊 SIMPLIFIED: Raw tiles data:', tilesData)
      
      // getPlacedTiles() returns: (xPositions[], yPositions[], numbers[], turnNumbers[])
      const xPositions = tilesData[0] as bigint[]
      const yPositions = tilesData[1] as bigint[]
      const numbers = tilesData[2] as bigint[]
      
      const placedTiles: TilePlacement[] = []
      for (let i = 0; i < numbers.length; i++) {
        placedTiles.push({
          number: Number(numbers[i]),
          x: Number(xPositions[i]),
          y: Number(yPositions[i])
        })
      }
      
      console.log('🎲 SIMPLIFIED: Parsed placed tiles:', placedTiles)
      
      return placedTiles
    } catch (error) {
      console.error('❌ SIMPLIFIED: Failed to read placed tiles:', error)
      return []
    }
  }, [getPublicClient, getContractConfig])

  // Get the latest contract address for the current network
  const getLatestContractAddress = async (): Promise<string | null> => {
    const config = getContractConfig()
    return config?.contractAddress || null
  }

  // Helper methods for backward compatibility
  const refreshNetworkState = useCallback(async () => {
    // This would refresh network state, for now just log
    console.log('🔄 SIMPLIFIED: refreshNetworkState called')
  }, [])

  // Get the contract address method (for backward compatibility)
  const getContractAddressMethod = useCallback(async (): Promise<string | null> => {
    const config = getContractConfig()
    return config?.contractAddress || null
  }, [getContractConfig])

  // Debug wallet connection for sponsorship
  useEffect(() => {
    if (primaryWallet) {
      console.log('🔍 WALLET DEBUG: Primary wallet connected:', {
        address: primaryWallet.address,
        connected: primaryWallet.connected,
        connector: {
          name: primaryWallet.connector?.name,
          type: primaryWallet.connector?.type,
          id: primaryWallet.connector?.id
        },
        canUseSponsorship: canUseSponsorship()
      })
    } else {
      console.log('🔍 WALLET DEBUG: No primary wallet')
    }
  }, [primaryWallet, canUseSponsorship])

  // Test sponsored transactions (for debugging)
  const testSponsoredTransaction = useCallback(async () => {
    if (!primaryWallet) {
      console.log('❌ No wallet connected')
      return false
    }

    console.log('🧪 TESTING SPONSORED TRANSACTIONS')
    console.log('=' .repeat(50))
    
    // Step 1: Check basic wallet info
    console.log('📊 WALLET INFO:')
    console.log('  Address:', primaryWallet.address)
    console.log('  Connected:', primaryWallet.connected)
    console.log('  Connector:', primaryWallet.connector?.name || 'Unknown')
    console.log('  Connector Key:', primaryWallet.connector?.key || 'Unknown')
    
    // Step 2: Check sponsorship capability
    const canSponsor = canUseSponsorship()
    console.log('💰 SPONSORSHIP CHECK:', canSponsor)
    
    if (!canSponsor) {
      console.log('❌ Sponsorship not available - need ZeroDev smart wallet')
      return false
    }
    
    // Step 3: Test AA provider access
    try {
      const connector = primaryWallet.connector as any
      console.log('🔍 CONNECTOR METHODS:', Object.keys(connector || {}))
      
      const aaProvider = await connector.getAccountAbstractionProvider?.()
      console.log('🔧 AA PROVIDER:', {
        hasProvider: !!aaProvider,
        type: aaProvider ? (aaProvider as any).constructor?.name : 'None',
        methods: aaProvider ? Object.keys(aaProvider) : []
      })
      
      if (aaProvider) {
        console.log('✅ AA Provider available - sponsored transactions should work!')
        return true
      } else {
        console.log('❌ AA Provider not available')
        return false
      }
    } catch (error) {
      console.error('❌ Error testing AA provider:', error)
      return false
    }
  }, [primaryWallet, canUseSponsorship])

  return {
    // State
    loading,
    error,
    currentGame,
    playerInfo: playerInfo,
    currentNetwork,
    userAddress: primaryWallet?.address || null,
    contractAddress,
    networkName,
    isConnected,
    contractInteractionAddress,
    
    // Game actions
    createGame,
    joinGame,
    startGame,
    makeMove,
    drawTile,
    playTurn,
    skipTurn,
    
    // Data reading
    getGameState,
    getPlayerInfo,
    getTilePoolStatus,
    getPlacedTiles,
    getAllGames,
    
    // Utilities
    canUseSponsorship,
    autoFundWallet,
    getLatestContractAddress,
    getContractConfig,
    getPublicClient,
    refreshNetworkState,
    getContractAddress: getContractAddressMethod,
    
    // Config
    isNetworkSupported,
    getConfigSummary,
    
    // Debugging
    testSponsoredTransaction
  }
} 