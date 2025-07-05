/**
 * Centralized cache for blockchain game data to prevent RPC abuse
 * Only refreshes data when explicitly requested or after very long intervals
 */

interface CachedGameData {
  // Core game state
  currentGame: any | null
  playerInfo: any | null
  allPlayersScores: {[address: string]: number}
  placedTiles: any[]
  tilePoolStatus: number[]
  
  // Cache metadata
  lastRefreshTime: number
  isRefreshing: boolean
  error: string | null
}

interface GameCacheConfig {
  // Very conservative refresh intervals
  maxCacheAgeMs: number // Maximum age before considering data stale (default: 60 seconds)
  minRefreshIntervalMs: number // Minimum time between refreshes (default: 10 seconds)
  contractAddress: string
  networkName: string
  blockchainGameId: number
  chainId?: number // Add chainId for better network detection
}

export class BlockchainGameCache {
  private cachedData: CachedGameData
  private config: GameCacheConfig
  private refreshPromise: Promise<void> | null = null
  private subscribers: Set<(data: CachedGameData) => void> = new Set()

  constructor(config: GameCacheConfig) {
    this.config = config
    this.cachedData = {
      currentGame: null,
      playerInfo: null,
      allPlayersScores: {},
      placedTiles: [],
      tilePoolStatus: Array(10).fill(0),
      lastRefreshTime: 0,
      isRefreshing: false,
      error: null
    }
  }

  /**
   * Subscribe to cache updates
   */
  subscribe(callback: (data: CachedGameData) => void): () => void {
    this.subscribers.add(callback)
    // Immediately provide current data
    callback(this.cachedData)
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Get current cached data (no RPC calls)
   */
  getData(): CachedGameData {
    return { ...this.cachedData }
  }

  /**
   * Check if cache is stale and needs refresh
   */
  isStale(): boolean {
    const age = Date.now() - this.cachedData.lastRefreshTime
    return age > this.config.maxCacheAgeMs
  }

  /**
   * Check if we can refresh (respects minimum interval)
   */
  canRefresh(): boolean {
    const timeSinceRefresh = Date.now() - this.cachedData.lastRefreshTime
    return timeSinceRefresh >= this.config.minRefreshIntervalMs && !this.cachedData.isRefreshing
  }

  /**
   * Force refresh all data (use sparingly!)
   */
  async forceRefresh(): Promise<void> {
    if (this.cachedData.isRefreshing) {
      // If already refreshing, wait for that to complete
      return this.refreshPromise || Promise.resolve()
    }

    console.log('🔄 [GameCache] Force refresh requested')
    return this.performRefresh()
  }

  /**
   * Refresh only if cache is stale and we can refresh
   */
  async refreshIfNeeded(): Promise<void> {
    if (!this.isStale() || !this.canRefresh()) {
      console.log('⏰ [GameCache] Refresh not needed or blocked', {
        isStale: this.isStale(),
        canRefresh: this.canRefresh(),
        age: Date.now() - this.cachedData.lastRefreshTime,
        maxAge: this.config.maxCacheAgeMs
      })
      return
    }

    console.log('🔄 [GameCache] Auto refresh triggered (cache is stale)')
    return this.performRefresh()
  }

  /**
   * Internal refresh implementation
   */
  private async performRefresh(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.doRefresh()
    try {
      await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  private async doRefresh(): Promise<void> {
    console.log('🔄 [GameCache] Starting data refresh...')
    
    // Mark as refreshing
    this.updateCache({ isRefreshing: true, error: null })

    try {
      // Import blockchain functions here to avoid circular dependencies
      const { createPublicClient, http } = await import('viem')
      const { base, hardhat } = await import('viem/chains')
      const FivesGameABI = await import('../contracts/FivesGame.json')
      
      // FIXED: Use centralized contract config instead of hard-coded networks
      const { getNetworkConfig, getRpcUrls } = await import('../config/contractConfig')

      // Determine chainId from network name or use provided chainId
      let chainId = this.config.chainId
      if (!chainId) {
        // Map network names to chain IDs
        const networkToChainId = {
          'Base Mainnet': 8453,
          'Base Sepolia': 84532,
          'Hardhat Local': 1337,
          'Local': 1337
        }
        chainId = networkToChainId[this.config.networkName] || 8453
      }

      // Ensure chainId is valid
      if (!chainId) {
        throw new Error(`Invalid chainId: ${chainId}`)
      }

      // Get network configuration from centralized config
      const networkConfig = getNetworkConfig(chainId)
      if (!networkConfig) {
        throw new Error(`Network configuration not found for chainId: ${chainId}`)
      }

      // Create chain config for viem
      const chainConfigs = {
        8453: base,
        84532: { ...base, id: 84532, name: 'Base Sepolia' },
        1337: { ...hardhat, id: 1337 }
      }

      const chain = chainConfigs[chainId as keyof typeof chainConfigs] || base
      const rpcUrls = getRpcUrls(chainId)
      
      console.log('🌐 [GameCache] Using network config:', {
        chainId,
        networkName: networkConfig.name,
        contractAddress: this.config.contractAddress,
        rpcCount: rpcUrls.length
      })

      const publicClient = createPublicClient({
        chain,
        transport: http(rpcUrls[0], {
          retryCount: 2,
          retryDelay: 1000,
          timeout: 10000
        })
      })

      console.log('📊 [GameCache] Fetching game data...')

      // Fetch game data
      const gameData = await publicClient.readContract({
        address: this.config.contractAddress as `0x${string}`,
        abi: FivesGameABI.abi,
        functionName: 'getGame',
        args: [this.config.blockchainGameId]
      }) as any[]

      // Get current player address (this should be passed in via config)
      const currentPlayerAddress = localStorage.getItem('currentPlayerAddress') // Temporary solution

      let playerData: any[] | null = null
      if (currentPlayerAddress) {
        try {
          playerData = await publicClient.readContract({
            address: this.config.contractAddress as `0x${string}`,
            abi: FivesGameABI.abi,
            functionName: 'getPlayer',
            args: [this.config.blockchainGameId, currentPlayerAddress as `0x${string}`]
          }) as any[]
        } catch (error) {
          console.warn('⚠️ [GameCache] Failed to get player data:', error)
        }
      }

      // Transform data
      const transformedGame = {
        id: this.config.blockchainGameId,
        state: Number(gameData[0]) || 0,
        creator: gameData[1] || '',
        maxPlayers: Number(gameData[2]) || 2,
        currentPlayerIndex: Number(gameData[3]) || 0,
        turnNumber: Number(gameData[4]) || 1,
        playerAddresses: Array.isArray(gameData[7]) ? gameData[7] : [],
        playerScores: Array.isArray(gameData[8]) ? (gameData[8] as any[]).map((score: any) => Number(score)) : [],
        createdAt: Number(gameData[5]) || Math.floor(Date.now() / 1000),
        allowIslands: gameData[6],
        tilesRemaining: Number(gameData[9]) || 50,
        winningScore: Number(gameData[10]) || 100
      }

      const transformedPlayerInfo = playerData ? {
        name: playerData[0] || 'Player',
        score: Number(playerData[1]) || 0,
        hand: Array.isArray(playerData[2]) ? playerData[2].map((tile: any) => Number(tile)) : [],
        hasJoined: playerData[3] !== undefined ? playerData[3] : false,
        lastMoveTime: Number(playerData[4]) || Math.floor(Date.now() / 1000)
      } : null

      // Get all players' scores (very conservatively)
      const allPlayersScores: {[address: string]: number} = {}
      if (transformedGame.playerAddresses.length > 0) {
        for (const playerAddress of transformedGame.playerAddresses.slice(0, 4)) { // Max 4 players
          try {
            const scoreData = await publicClient.readContract({
              address: this.config.contractAddress as `0x${string}`,
              abi: FivesGameABI.abi,
              functionName: 'getPlayer',
              args: [this.config.blockchainGameId, playerAddress as `0x${string}`]
            }) as any[]
            
            allPlayersScores[playerAddress] = Number(scoreData[1] || 0)
          } catch (error) {
            console.warn(`⚠️ [GameCache] Failed to get score for ${playerAddress}:`, error)
            allPlayersScores[playerAddress] = 0
          }
        }
      }

      console.log('🧩 [GameCache] Loading placed tiles using efficient method...')
      // Use the contract's efficient getPlacedTiles() method instead of 225 individual calls
      const placedTiles: any[] = []
      
      try {
        const placedTilesData = await publicClient.readContract({
          address: this.config.contractAddress as `0x${string}`,
          abi: FivesGameABI.abi,
          functionName: 'getPlacedTiles',
          args: [this.config.blockchainGameId]
        }) as [number[], number[], number[], number[]]

        const [xPositions, yPositions, numbers, turnNumbers] = placedTilesData
        
        // Transform the contract data to our format
        console.log('🔍 [GameCache] Raw contract data:', {
          xPositions,
          yPositions, 
          numbers,
          turnNumbers,
          lengths: {
            x: xPositions.length,
            y: yPositions.length,
            n: numbers.length,
            t: turnNumbers.length
          }
        })
        
        for (let i = 0; i < xPositions.length; i++) {
          const tile = {
            x: Number(xPositions[i]),
            y: Number(yPositions[i]),
            number: Number(numbers[i]),
            displayNumber: Number(numbers[i]),
            turnPlaced: Number(turnNumbers[i]),
            // Create stable ID for React key stability
            id: `tile-${Number(xPositions[i])}-${Number(yPositions[i])}-${Number(turnNumbers[i])}`
          }
          placedTiles.push(tile)
          console.log(`  Tile ${i}:`, tile)
        }

        console.log(`✅ [GameCache] Loaded ${placedTiles.length} placed tiles efficiently (single call instead of 225!)`)
        console.log('🎯 [GameCache] Final placed tiles array:', placedTiles)
      } catch (tilesError) {
        console.warn('⚠️ [GameCache] Could not load placed tiles:', tilesError)
        console.warn('⚠️ [GameCache] Error details:', tilesError)
        // Fall back to empty array instead of individual calls
      }

      // ADDED: Get tile pool status if current player
      let tilePoolStatus = Array(10).fill(0)
      if (currentPlayerAddress) {
        try {
          const poolData = await publicClient.readContract({
            address: this.config.contractAddress as `0x${string}`,
            abi: FivesGameABI.abi,
            functionName: 'getPlayerTilePool',
            args: [this.config.blockchainGameId, currentPlayerAddress as `0x${string}`]
          }) as number[]
          
          tilePoolStatus = Array.isArray(poolData) ? poolData.map(n => Number(n)) : Array(10).fill(0)
          console.log('🎯 [GameCache] Loaded tile pool status:', tilePoolStatus)
        } catch (poolError) {
          console.warn('⚠️ [GameCache] Could not load tile pool status:', poolError)
        }
      }

      // Update cache with new data
      this.updateCache({
        currentGame: transformedGame,
        playerInfo: transformedPlayerInfo,
        allPlayersScores,
        placedTiles,
        tilePoolStatus,
        lastRefreshTime: Date.now(),
        isRefreshing: false,
        error: null
      })

      console.log('✅ [GameCache] Data refresh completed successfully')

    } catch (error) {
      console.error('❌ [GameCache] Refresh failed:', error)
      this.updateCache({
        isRefreshing: false,
        error: error?.message || 'Unknown error'
      })
    }
  }

  /**
   * Update cache and notify subscribers
   */
  private updateCache(updates: Partial<CachedGameData>): void {
    this.cachedData = { ...this.cachedData, ...updates }
    
    // Notify all subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(this.cachedData)
      } catch (error) {
        console.error('❌ [GameCache] Subscriber callback failed:', error)
      }
    })
  }

  /**
   * Update config (e.g., when player address changes)
   */
  updateConfig(updates: Partial<GameCacheConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cachedData = {
      currentGame: null,
      playerInfo: null,
      allPlayersScores: {},
      placedTiles: [],
      tilePoolStatus: Array(10).fill(0),
      lastRefreshTime: 0,
      isRefreshing: false,
      error: null
    }
    this.updateCache({})
  }
} 