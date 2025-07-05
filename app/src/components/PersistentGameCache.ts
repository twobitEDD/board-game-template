import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import FivesGameABI from '../contracts/FivesGame.json'

interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
}

interface PersistentCacheConfig {
  contractAddress: string
  networkName: string
  chainId: number
  cacheVersion: string
  maxAge: number
}

interface GameData {
  id: number
  state: number
  creator: string
  maxPlayers: number
  currentPlayerIndex: number
  turnNumber: number
  playerAddresses: string[]
  playerScores: number[]
  createdAt: number
  allowIslands: boolean
  tilesRemaining: number
}

interface TileData {
  number: number
  x: number
  y: number
}

export class PersistentGameCache {
  private config: PersistentCacheConfig
  private publicClient: any
  private readonly CACHE_PREFIX = 'fives_game_cache_'
  
  constructor(config: PersistentCacheConfig) {
    this.config = config
    
    const chain = config.chainId === 84532 ? baseSepolia : base
    this.publicClient = createPublicClient({
      chain,
      transport: http(config.chainId === 84532 ? 'https://sepolia.base.org' : 'https://mainnet.base.org')
    })
  }

  private getCacheKey(dataType: string, gameId?: number): string {
    const gameIdStr = gameId ? `_${gameId}` : ''
    return `${this.CACHE_PREFIX}${this.config.cacheVersion}_${dataType}${gameIdStr}`
  }

  private getFromCache<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key)
      if (!cached) return null
      
      const entry: CacheEntry = JSON.parse(cached)
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(key)
        return null
      }
      
      return entry.data
    } catch (error) {
      console.warn('Cache read error:', error)
      return null
    }
  }

  private setCache<T>(key: string, data: T): void {
    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.maxAge
      }
      localStorage.setItem(key, JSON.stringify(entry))
    } catch (error) {
      console.warn('Cache write error:', error)
    }
  }

  private async contractCall(functionName: string, args: any[] = []): Promise<any> {
    return await this.publicClient.readContract({
      address: this.config.contractAddress as `0x${string}`,
      abi: FivesGameABI.abi,
      functionName,
      args
    })
  }

  async getAllGames(): Promise<GameData[]> {
    const cacheKey = this.getCacheKey('all_games')
    const cached = this.getFromCache<GameData[]>(cacheKey)
    
    if (cached) {
      console.log('🎯 [PersistentCache] Using cached games data')
      return cached
    }

    try {
      console.log('🔄 [PersistentCache] Fetching games from blockchain...')
      
      const nextGameId = await this.contractCall('nextGameId')
      const totalGames = Number(nextGameId) - 1
      
      if (totalGames === 0) {
        this.setCache(cacheKey, [])
        return []
      }

      const games: GameData[] = []
      for (let i = 1; i <= totalGames; i++) {
        try {
          const gameData = await this.contractCall('getGame', [i])
          if (gameData) {
            const game: GameData = {
              id: i,
              state: Number(gameData[0]),
              creator: gameData[1],
              maxPlayers: Number(gameData[2]),
              currentPlayerIndex: Number(gameData[3]),
              turnNumber: Number(gameData[4]),
              playerAddresses: gameData[7],
              playerScores: gameData[8].map((score: bigint) => Number(score)),
              createdAt: Number(gameData[5]),
              allowIslands: gameData[6],
              tilesRemaining: Number(gameData[9])
            }
            games.push(game)
          }
        } catch (error) {
          console.warn(`Failed to fetch game ${i}:`, error)
        }
      }

      console.log(`✅ [PersistentCache] Cached ${games.length} games`)
      this.setCache(cacheKey, games)
      return games
    } catch (error) {
      console.error('❌ [PersistentCache] Failed to fetch games:', error)
      return []
    }
  }

  async getPlacedTiles(gameId: number): Promise<TileData[]> {
    const cacheKey = this.getCacheKey('placed_tiles', gameId)
    const cached = this.getFromCache<TileData[]>(cacheKey)
    
    if (cached) {
      console.log(`🎯 [PersistentCache] Using cached tiles for game ${gameId}`)
      return cached
    }

    try {
      console.log(`🔄 [PersistentCache] Fetching tiles for game ${gameId}...`)
      
      const tilesData = await this.contractCall('getPlacedTiles', [gameId])
      const [xPositions, yPositions, numbers] = tilesData
      
      const tiles: TileData[] = []
      for (let i = 0; i < numbers.length; i++) {
        tiles.push({
          number: Number(numbers[i]),
          x: Number(xPositions[i]),
          y: Number(yPositions[i])
        })
      }

      console.log(`✅ [PersistentCache] Cached ${tiles.length} tiles for game ${gameId}`)
      this.setCache(cacheKey, tiles)
      return tiles
    } catch (error) {
      console.error(`❌ [PersistentCache] Failed to fetch tiles for game ${gameId}:`, error)
      return []
    }
  }

  async getPlayerInfo(gameId: number, playerAddress: string): Promise<any | null> {
    const cacheKey = this.getCacheKey(`player_${playerAddress}`, gameId)
    const cached = this.getFromCache<any>(cacheKey)
    
    if (cached) {
      console.log(`🎯 [PersistentCache] Using cached player info for game ${gameId}`)
      return cached
    }

    try {
      console.log(`🔄 [PersistentCache] Fetching player info for game ${gameId}...`)
      
      const playerData = await this.contractCall('getPlayer', [gameId, playerAddress])
      const playerInfo = {
        name: playerData[0],
        score: Number(playerData[1]),
        hand: playerData[2].map((tile: bigint) => Number(tile)),
        hasJoined: playerData[3],
        lastMoveTime: Number(playerData[4])
      }

      console.log(`✅ [PersistentCache] Cached player info for game ${gameId}`)
      this.setCache(cacheKey, playerInfo)
      return playerInfo
    } catch (error) {
      console.error(`❌ [PersistentCache] Failed to fetch player info for game ${gameId}:`, error)
      return null
    }
  }

  async getTilePoolStatus(gameId: number): Promise<number[]> {
    const cacheKey = this.getCacheKey('tile_pool', gameId)
    const cached = this.getFromCache<number[]>(cacheKey)
    
    if (cached) {
      console.log(`🎯 [PersistentCache] Using cached tile pool for game ${gameId}`)
      return cached
    }

    try {
      console.log(`🔄 [PersistentCache] Fetching tile pool for game ${gameId}...`)
      
      const poolData = await this.contractCall('getTilePoolStatus', [gameId])
      const tilePool = poolData.map((count: bigint) => Number(count))

      console.log(`✅ [PersistentCache] Cached tile pool for game ${gameId}`)
      this.setCache(cacheKey, tilePool)
      return tilePool
    } catch (error) {
      console.error(`❌ [PersistentCache] Failed to fetch tile pool for game ${gameId}:`, error)
      return Array(10).fill(0)
    }
  }

  invalidateGame(gameId: number): void {
    const keysToRemove = [
      this.getCacheKey('placed_tiles', gameId),
      this.getCacheKey('tile_pool', gameId),
      this.getCacheKey('all_games')
    ]

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes(`player_`) && key.includes(`_${gameId}`)) {
        localStorage.removeItem(key)
      }
    }
    
    console.log(`🗑️ [PersistentCache] Invalidated cache for game ${gameId}`)
  }

  clearAllCache(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
    console.log('🗑️ [PersistentCache] Cleared all cache')
  }

  getCacheStats(): any {
    const stats = {
      totalCacheItems: 0,
      cacheSize: 0,
      oldestEntry: null as number | null,
      newestEntry: null as number | null
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        stats.totalCacheItems++
        try {
          const value = localStorage.getItem(key)
          if (value) {
            stats.cacheSize += value.length
            const entry: CacheEntry = JSON.parse(value)
            if (!stats.oldestEntry || entry.timestamp < stats.oldestEntry) {
              stats.oldestEntry = entry.timestamp
            }
            if (!stats.newestEntry || entry.timestamp > stats.newestEntry) {
              stats.newestEntry = entry.timestamp
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }

    return {
      ...stats,
      cacheSizeKB: Math.round(stats.cacheSize / 1024),
      oldestEntryAge: stats.oldestEntry ? Date.now() - stats.oldestEntry : null,
      newestEntryAge: stats.newestEntry ? Date.now() - stats.newestEntry : null
    }
  }
}

export function createPersistentGameCache(config: Partial<PersistentCacheConfig>): PersistentGameCache {
  const fullConfig: PersistentCacheConfig = {
    contractAddress: config.contractAddress || '0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F',
    networkName: config.networkName || 'Base Sepolia',
    chainId: config.chainId || 84532,
    cacheVersion: config.cacheVersion || 'v1',
    maxAge: config.maxAge || 5 * 60 * 1000
  }

  return new PersistentGameCache(fullConfig)
}
