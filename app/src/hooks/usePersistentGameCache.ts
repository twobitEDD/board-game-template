import { useEffect, useState, useCallback } from 'react'
import { PersistentGameCache, createPersistentGameCache } from '../components/PersistentGameCache'
import { useBlockchainGame } from './useBlockchainGame'

// Import types from the cache file
type GameData = {
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

type TileData = {
  number: number
  x: number
  y: number
}

interface UsePersistentGameCacheParams {
  gameId?: number
  autoLoad?: boolean
}

export function usePersistentGameCache({ gameId, autoLoad = false }: UsePersistentGameCacheParams = {}) {
  const [cache, setCache] = useState<PersistentGameCache | null>(null)
  const [allGames, setAllGames] = useState<GameData[]>([])
  const [placedTiles, setPlacedTiles] = useState<TileData[]>([])
  const [playerInfo, setPlayerInfo] = useState<any | null>(null)
  const [tilePool, setTilePool] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const blockchainGame = useBlockchainGame()

  // Initialize cache when blockchain connection is ready
  useEffect(() => {
    if (!blockchainGame.contractAddress || !blockchainGame.networkName) return

    const cacheInstance = createPersistentGameCache({
      contractAddress: blockchainGame.contractAddress,
      networkName: blockchainGame.networkName,
      chainId: blockchainGame.currentNetwork || 84532,
      cacheVersion: 'v1',
      maxAge: 5 * 60 * 1000 // 5 minutes
    })

    setCache(cacheInstance)
    console.log('🎯 [usePersistentGameCache] Cache initialized for:', {
      contractAddress: blockchainGame.contractAddress,
      networkName: blockchainGame.networkName,
      chainId: blockchainGame.currentNetwork
    })
  }, [blockchainGame.contractAddress, blockchainGame.networkName, blockchainGame.currentNetwork])

  // Auto-load data if enabled
  useEffect(() => {
    if (autoLoad && cache) {
      loadAllGames()
    }
  }, [cache, autoLoad])

  const loadAllGames = useCallback(async () => {
    if (!cache) return

    setIsLoading(true)
    setError(null)

    try {
      const games = await cache.getAllGames()
      setAllGames(games)
      console.log(`✅ [usePersistentGameCache] Loaded ${games.length} games`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load games'
      setError(errorMessage)
      console.error('❌ [usePersistentGameCache] Error loading games:', err)
    } finally {
      setIsLoading(false)
    }
  }, [cache])

  const loadPlacedTiles = useCallback(async (targetGameId: number) => {
    if (!cache) return

    setIsLoading(true)
    setError(null)

    try {
      const tiles = await cache.getPlacedTiles(targetGameId)
      setPlacedTiles(tiles)
      console.log(`✅ [usePersistentGameCache] Loaded ${tiles.length} tiles for game ${targetGameId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tiles'
      setError(errorMessage)
      console.error('❌ [usePersistentGameCache] Error loading tiles:', err)
    } finally {
      setIsLoading(false)
    }
  }, [cache])

  const loadPlayerInfo = useCallback(async (targetGameId: number, playerAddress: string) => {
    if (!cache) return

    setIsLoading(true)
    setError(null)

    try {
      const info = await cache.getPlayerInfo(targetGameId, playerAddress)
      setPlayerInfo(info)
      console.log(`✅ [usePersistentGameCache] Loaded player info for game ${targetGameId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load player info'
      setError(errorMessage)
      console.error('❌ [usePersistentGameCache] Error loading player info:', err)
    } finally {
      setIsLoading(false)
    }
  }, [cache])

  const loadTilePool = useCallback(async (targetGameId: number) => {
    if (!cache) return

    setIsLoading(true)
    setError(null)

    try {
      const pool = await cache.getTilePoolStatus(targetGameId)
      setTilePool(pool)
      console.log(`✅ [usePersistentGameCache] Loaded tile pool for game ${targetGameId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tile pool'
      setError(errorMessage)
      console.error('❌ [usePersistentGameCache] Error loading tile pool:', err)
    } finally {
      setIsLoading(false)
    }
  }, [cache])

  const invalidateGame = useCallback((targetGameId: number) => {
    if (!cache) return

    cache.invalidateGame(targetGameId)
    console.log(`🗑️ [usePersistentGameCache] Invalidated cache for game ${targetGameId}`)
  }, [cache])

  const clearAllCache = useCallback(() => {
    if (!cache) return

    cache.clearAllCache()
    setAllGames([])
    setPlacedTiles([])
    setPlayerInfo(null)
    setTilePool([])
    console.log('🗑️ [usePersistentGameCache] Cleared all cache')
  }, [cache])

  const getCacheStats = useCallback(() => {
    if (!cache) return null
    return cache.getCacheStats()
  }, [cache])

  // Load all data for a specific game
  const loadGameData = useCallback(async (targetGameId: number, playerAddress?: string) => {
    if (!cache) return

    setIsLoading(true)
    setError(null)

    try {
      // Type the promises explicitly to fix type inference
      const tilesPromise = cache.getPlacedTiles(targetGameId)
      const poolPromise = cache.getTilePoolStatus(targetGameId)
      
      if (playerAddress) {
        const playerPromise = cache.getPlayerInfo(targetGameId, playerAddress)
        const [tiles, pool, player] = await Promise.all([tilesPromise, poolPromise, playerPromise])
        
        setPlacedTiles(tiles)
        setTilePool(pool)
        setPlayerInfo(player)
      } else {
        const [tiles, pool] = await Promise.all([tilesPromise, poolPromise])
        
        setPlacedTiles(tiles)
        setTilePool(pool)
      }

      console.log(`✅ [usePersistentGameCache] Loaded all data for game ${targetGameId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load game data'
      setError(errorMessage)
      console.error('❌ [usePersistentGameCache] Error loading game data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [cache])

  return {
    // Data
    allGames,
    placedTiles,
    playerInfo,
    tilePool,
    
    // State
    isLoading,
    error,
    isReady: !!cache,
    
    // Actions
    loadAllGames,
    loadPlacedTiles,
    loadPlayerInfo,
    loadTilePool,
    loadGameData,
    invalidateGame,
    clearAllCache,
    getCacheStats,
    
    // Cache instance (for advanced usage)
    cache
  }
}
