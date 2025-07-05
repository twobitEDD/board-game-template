import { useEffect, useState, useRef } from 'react'
import { BlockchainGameCache } from '../components/BlockchainGameCache'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'

interface UseGameCacheParams {
  blockchainGameId: number
  contractAddress: string
  networkName: string
  chainId?: number // Add chainId for better network detection
}

interface CacheState {
  currentGame: any | null
  playerInfo: any | null
  allPlayersScores: {[address: string]: number}
  placedTiles: any[]
  tilePoolStatus: number[]
  lastRefreshTime: number
  isRefreshing: boolean
  error: string | null
}

export function useGameCache({ 
  blockchainGameId, 
  contractAddress, 
  networkName, 
  chainId 
}: UseGameCacheParams) {
  const { primaryWallet } = useDynamicContext()
  const [cacheData, setCacheData] = useState<CacheState>({
    currentGame: null,
    playerInfo: null,
    allPlayersScores: {},
    placedTiles: [],
    tilePoolStatus: Array(10).fill(0),
    lastRefreshTime: 0,
    isRefreshing: false,
    error: null
  })

  const cacheRef = useRef<BlockchainGameCache | null>(null)

  // Initialize cache when parameters change
  useEffect(() => {
    if (!blockchainGameId || !contractAddress) {
      console.warn('🎯 [useGameCache] Missing required parameters:', {
        blockchainGameId,
        contractAddress,
        networkName,
        chainId
      })
      return
    }

    console.log('🎯 [useGameCache] Initializing cache with:', {
      blockchainGameId,
      contractAddress,
      networkName,
      chainId
    })

    // Store current player address for cache
    if (primaryWallet?.address) {
      localStorage.setItem('currentPlayerAddress', primaryWallet.address)
    }

    // Create new cache instance with improved config
    const cache = new BlockchainGameCache({
      maxCacheAgeMs: 60000, // 60 seconds before considering stale
      minRefreshIntervalMs: 10000, // 10 seconds minimum between refreshes
      contractAddress,
      networkName,
      blockchainGameId,
      chainId // Pass chainId for better network detection
    })

    // Subscribe to cache updates
    const unsubscribe = cache.subscribe((data) => {
      console.log('📡 [useGameCache] Cache data updated:', {
        hasGame: !!data.currentGame,
        hasPlayer: !!data.playerInfo,
        scoresCount: Object.keys(data.allPlayersScores).length,
        placedTilesCount: data.placedTiles.length,
        tilePoolSum: data.tilePoolStatus.reduce((sum, count) => sum + count, 0),
        lastRefresh: data.lastRefreshTime,
        isRefreshing: data.isRefreshing,
        error: data.error
      })
      setCacheData(data)
    })

    cacheRef.current = cache

    // No automatic initial refresh - user must click refresh button

    return () => {
      unsubscribe()
      cacheRef.current = null
    }
  }, [blockchainGameId, contractAddress, networkName, chainId, primaryWallet?.address])

  // Update cache config when wallet address changes
  useEffect(() => {
    if (cacheRef.current && primaryWallet?.address) {
      localStorage.setItem('currentPlayerAddress', primaryWallet.address)
      // No automatic refresh - user must click refresh button after wallet change
      console.log('👤 [useGameCache] Player address changed - click refresh to update data')
    }
  }, [primaryWallet?.address])

  // Manual refresh function
  const refreshData = async () => {
    if (cacheRef.current) {
      console.log('🔄 [useGameCache] Manual refresh requested')
      await cacheRef.current.forceRefresh()
    }
  }

  // No automatic refresh - user controls all data loading

  return {
    // Data from cache (no RPC calls)
    currentGame: cacheData.currentGame,
    playerInfo: cacheData.playerInfo,
    allPlayersScores: cacheData.allPlayersScores,
    placedTiles: cacheData.placedTiles,
    tilePoolStatus: cacheData.tilePoolStatus,
    
    // Cache metadata
    isLoading: cacheData.isRefreshing,
    error: cacheData.error,
    lastRefreshTime: cacheData.lastRefreshTime,
    
    // Actions
    refreshData, // Manual refresh function
    
    // Utility
    isDataStale: () => cacheRef.current?.isStale() ?? true,
    canRefresh: () => cacheRef.current?.canRefresh() ?? true,
    
    // Debug info
    cacheStats: {
      hasCache: !!cacheRef.current,
      gameLoaded: !!cacheData.currentGame,
      playerLoaded: !!cacheData.playerInfo,
      tilesLoaded: cacheData.placedTiles.length,
      scoresLoaded: Object.keys(cacheData.allPlayersScores).length
    }
  }
} 