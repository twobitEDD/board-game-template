/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { css } from '@emotion/react'
import { GameSpectator } from './GameSpectator'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { useGameCache } from '../hooks/useGameCache'
import { usePersistentGameCache } from '../hooks/usePersistentGameCache'
import { DynamicConnectButton } from './DynamicConnectButton'
import { NetworkPicker } from './NetworkPicker'

interface GameInfo {
  id: number
  playerCount: number
  playerAddresses: string[]
  playerScores: number[]
  state: number // 0=setup, 1=playing, 2=completed, 3=cancelled
  turnNumber: number
  tilesRemaining: number
  currentPlayerIndex: number
  lastUpdate: number
}

interface GameGalleryProps {
  maxGames?: number
  onSelectGame?: (gameId: number) => void
}

// Global cache refresh manager to prevent rate limiting
class CacheRefreshManager {
  private refreshPromises: Map<string, Promise<void>> = new Map()
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map()
  private readonly BATCH_DELAY = 2000 // 2 seconds
  private readonly MIN_INTERVAL = 5000 // 5 seconds minimum between refreshes

  private getCacheKey(gameId: number, contractAddress: string): string {
    return `${gameId}-${contractAddress}`
  }

  async requestRefresh(gameId: number, contractAddress: string, refreshCallback: () => Promise<void>): Promise<void> {
    const cacheKey = this.getCacheKey(gameId, contractAddress)
    
    // If already refreshing, return existing promise
    if (this.refreshPromises.has(cacheKey)) {
      return this.refreshPromises.get(cacheKey)!
    }

    // Clear existing timer
    if (this.refreshTimers.has(cacheKey)) {
      clearTimeout(this.refreshTimers.get(cacheKey)!)
    }

    // Create new refresh promise
    const refreshPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          console.log(`🔄 [CacheRefreshManager] Refreshing cache for game ${gameId}`)
          await refreshCallback()
          resolve()
        } catch (error) {
          console.error(`❌ [CacheRefreshManager] Cache refresh failed for game ${gameId}:`, error)
          reject(error)
        } finally {
          // Clean up
          this.refreshPromises.delete(cacheKey)
          this.refreshTimers.delete(cacheKey)
        }
      }, this.BATCH_DELAY)

      this.refreshTimers.set(cacheKey, timer)
    })

    this.refreshPromises.set(cacheKey, refreshPromise)
    return refreshPromise
  }

  async refreshAll(gameIds: number[], contractAddress: string, refreshCallback: (gameId: number) => Promise<void>): Promise<void> {
    console.log(`🔄 [CacheRefreshManager] Batch refreshing ${gameIds.length} games`)
    
    // Refresh games in batches to prevent rate limiting
    const batchSize = 3
    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batch = gameIds.slice(i, i + batchSize)
      
      // Wait for current batch to complete
      await Promise.all(batch.map(gameId => 
        this.requestRefresh(gameId, contractAddress, () => refreshCallback(gameId))
      ))
      
      // Wait between batches
      if (i + batchSize < gameIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
}

// Global cache refresh manager instance
const cacheRefreshManager = new CacheRefreshManager()

// Direct RPC test component to bypass cache
function DirectRPCTest() {
  const [testResult, setTestResult] = React.useState<string>('Testing...')
  
  React.useEffect(() => {
    async function testDirectRPC() {
      try {
        const { createPublicClient, http } = await import('viem')
        const { baseSepolia } = await import('viem/chains')
        const FivesGameABI = await import('../contracts/FivesGame.json')
        
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http('https://sepolia.base.org')
        })
        
        console.log('🧪 [DirectRPCTest] Testing direct contract call...')
        
        const result = await publicClient.readContract({
          address: '0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F' as `0x${string}`,
          abi: FivesGameABI.abi,
          functionName: 'getPlacedTiles',
          args: [2]
        }) as [number[], number[], number[], number[]]
        
        const [xPositions, yPositions, numbers, turnNumbers] = result
        console.log('🧪 [DirectRPCTest] Raw result:', result)
        
        if (xPositions.length > 0) {
          setTestResult(`SUCCESS: Found ${xPositions.length} tiles. First tile: (${xPositions[0]}, ${yPositions[0]}) = ${numbers[0]}`)
        } else {
          setTestResult('SUCCESS: Contract call worked but no tiles found')
        }
        
      } catch (error) {
        console.error('🧪 [DirectRPCTest] Failed:', error)
        setTestResult(`FAILED: ${error.message}`)
      }
    }
    
    testDirectRPC()
  }, [])
  
  return (
    <div style={{ padding: '1rem', background: 'rgba(0,255,0,0.2)', margin: '1rem', color: 'white', fontSize: '12px' }}>
      <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>🧪 Direct RPC Test (Bypass Cache)</h3>
      <div>Result: {testResult}</div>
    </div>
  )
}

// Test component to debug cache issues
function DebugCacheTest() {
  const blockchainGame = useBlockchainGame()
  
  // Calculate actual values that will be passed to cache
  const actualContractAddress = blockchainGame.contractAddress || '0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F'
  const actualNetworkName = blockchainGame.networkName || 'Base Sepolia'  
  const actualChainId = blockchainGame.currentNetwork || 84532
  
  const { placedTiles, isLoading, error, cacheStats } = useGameCache({
    blockchainGameId: 2, // Game 2 which has tiles
    contractAddress: actualContractAddress,
    networkName: actualNetworkName,
    chainId: actualChainId
  })

  console.log('🧪 [DebugCacheTest] Cache debug:', {
    placedTiles,
    isLoading,
    error,
    cacheStats,
    blockchainGameState: {
      contractAddress: blockchainGame.contractAddress,
      networkName: blockchainGame.networkName,
      currentNetwork: blockchainGame.currentNetwork
    },
    actualCacheParams: {
      contractAddress: actualContractAddress,
      networkName: actualNetworkName,
      chainId: actualChainId
    }
  })

  return (
    <div style={{ padding: '1rem', background: 'rgba(255,0,0,0.2)', margin: '1rem', color: 'white', fontSize: '12px' }}>
      <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>🧪 Cache Debug Test (Game 2)</h3>
      
             <div style={{ marginBottom: '5px' }}>
         <strong>Blockchain Context:</strong>
         <div>• Contract: {blockchainGame.contractAddress || 'None'}</div>
         <div>• Network: {blockchainGame.networkName || 'None'}</div>
         <div>• ChainId: {blockchainGame.currentNetwork || 'None'}</div>
         <div>• Connected: {blockchainGame.isConnected ? 'Yes' : 'No'}</div>
       </div>
       
       <div style={{ marginBottom: '5px' }}>
         <strong>Cache Parameters (with fallbacks):</strong>
         <div>• Contract: {actualContractAddress}</div>
         <div>• Network: {actualNetworkName}</div>
         <div>• ChainId: {actualChainId}</div>
       </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Cache State:</strong>
        <div>• Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>• Error: {error || 'None'}</div>
        <div>• Tiles Count: {placedTiles?.length || 0}</div>
        <div>• Cache Stats: {JSON.stringify(cacheStats, null, 2)}</div>
      </div>
      
      {placedTiles && placedTiles.length > 0 && (
        <div>
          <strong>Tiles Found:</strong>
          {placedTiles.map((tile, i) => (
            <div key={i}>• Tile {i}: ({tile.x}, {tile.y}) = {tile.number || tile.displayNumber}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// New component for board previews in gallery cards - using persistent cache
function GameBoardPreview({ gameId, contractAddress, networkName, chainId }: {
  gameId: number
  contractAddress: string
  networkName: string
  chainId?: number
}) {
  const [placedTiles, setPlacedTiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use persistent cache instead of useGameCache to prevent rate limiting
  const persistentCache = usePersistentGameCache()

  // Auto-load cached data when component mounts and cache is ready
  useEffect(() => {
    if (!persistentCache.isReady) return
    
    // Try to load from cache first (this will use cached data if available)
    const loadCachedData = async () => {
      try {
        await persistentCache.loadPlacedTiles(gameId)
        const tiles = persistentCache.placedTiles
        if (tiles && tiles.length > 0) {
          setPlacedTiles(tiles)
          console.log(`🎨 [GameBoardPreview] Auto-loaded ${tiles.length} cached tiles for game ${gameId}`)
        }
      } catch (error) {
        // Silently fail for auto-loading - user can still manually refresh
        console.log(`🎨 [GameBoardPreview] No cached data for game ${gameId}`)
      }
    }
    
    loadCachedData()
  }, [gameId, persistentCache.isReady, persistentCache])

  // Listen for changes in the cached tiles to update the display
  useEffect(() => {
    if (persistentCache.placedTiles && persistentCache.placedTiles.length > 0) {
      setPlacedTiles(persistentCache.placedTiles)
    }
  }, [persistentCache.placedTiles])

  // Manual refresh function that uses the persistent cache
  const handleRefresh = useCallback(async () => {
    if (!persistentCache.isReady) {
      setError('Cache not ready')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      await persistentCache.loadPlacedTiles(gameId)
      const tiles = persistentCache.placedTiles
      setPlacedTiles(tiles)
      console.log(`🎨 [GameBoardPreview] Manually refreshed ${tiles.length} tiles for game ${gameId}`)
    } catch (error) {
      console.warn(`⚠️ GameBoardPreview: Cache refresh failed for game ${gameId}:`, error)
      setError(error instanceof Error ? error.message : 'Failed to load tiles')
    } finally {
      setIsLoading(false)
    }
  }, [gameId, persistentCache])

  // Add visual debug info for troubleshooting
  if (error) {
    return (
      <div css={previewErrorStyle}>
        <div style={{ fontSize: '0.6rem', textAlign: 'center' }}>
          Failed to load board
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div css={previewLoadingStyle}>
        <div css={loadingDotStyle}>⏳</div>
        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Loading board...</div>
      </div>
    )
  }

  if (!placedTiles || placedTiles.length === 0) {
    return (
      <div css={previewEmptyStyle}>
        <div css={emptyBoardIconStyle}>◯</div>
        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
          No tiles placed
        </div>
      </div>
    )
  }

  return (
    <div css={compactBoardContainerStyle}>
      <div css={compactBoardGridStyle}>
        {Array.from({ length: 15 }, (_, row) =>
          Array.from({ length: 15 }, (_, col) => {
            const tile = placedTiles.find(t => t.x === col && t.y === row)
            const isCenter = row === 7 && col === 7
            
            return (
              <div
                key={`${row}-${col}`}
                css={[compactCellStyle, isCenter && compactCenterCellStyle]}
              >
                {tile ? (
                  <div 
                    css={compactTileStyle}
                    title={`Tile ${tile.number || tile.displayNumber} at (${col}, ${row})`}
                  >
                    <span css={compactTileNumberStyle}>{tile.number || tile.displayNumber}</span>
                  </div>
                ) : isCenter ? (
                  <div css={compactCenterMarkerStyle} title="Center position">★</div>
                ) : null}
              </div>
            )
          })
        ).flat()}
      </div>
      <div css={tileCountStyle}>
        {placedTiles.length} tiles placed
      </div>
    </div>
  )
}

export function GameGallery({ maxGames = 50, onSelectGame }: GameGalleryProps) {
  const [games, setGames] = useState<GameInfo[]>([])
  const [loading, setLoading] = useState(false) // Start with false since no auto-loading
  const [error, setError] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'turn' | 'score'>('recent')
  const [showCacheStats, setShowCacheStats] = useState(false)

  const blockchainGame = useBlockchainGame()
  
  // Use persistent cache for better performance
  const persistentCache = usePersistentGameCache()

  // Scan for games using either persistent cache or blockchain hook
  const scanForGames = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Scanning for games using persistent cache...')
      
             let contractGames: any[] = []
      
      // Try persistent cache first
      if (persistentCache.isReady) {
        console.log('📦 Using persistent cache for games...')
        await persistentCache.loadAllGames()
        contractGames = persistentCache.allGames
        
        if (contractGames.length === 0) {
          console.log('📦 Cache returned no games, might be first load')
        }
      } else {
        console.log('⚠️ Persistent cache not ready, falling back to blockchain hook...')
        contractGames = await blockchainGame.getAllGames()
      }
      
      console.log('📋 Games loaded:', contractGames)
      
      if (contractGames && contractGames.length > 0) {
        const gamesList: GameInfo[] = contractGames.map((contractGame, index) => ({
          id: contractGame.id || (index + 1),
          playerCount: Math.max(1, contractGame.playerAddresses?.length || 1),
          playerAddresses: Array.isArray(contractGame.playerAddresses) ? contractGame.playerAddresses : ['0x0000000000000000000000000000000000000000'],
          playerScores: Array.isArray(contractGame.playerScores) ? contractGame.playerScores : [0],
          state: (contractGame.state >= 0 && contractGame.state <= 3) ? contractGame.state : 1,
          turnNumber: Math.max(1, contractGame.turnNumber || 1),
          tilesRemaining: Math.max(0, contractGame.tilesRemaining || 50),
          currentPlayerIndex: Math.max(0, contractGame.currentPlayerIndex || 0),
          lastUpdate: Date.now() - Math.random() * 3600000
        })).filter(game => game.id > 0)
        
        if (gamesList.length > 0) {
          setGames(gamesList)
          console.log(`🎮 Successfully loaded ${gamesList.length} games`)
        } else {
          throw new Error('No valid games found after transformation')
        }
      } else {
        console.log('📝 No games found')
        setError(`No games found. Using cache: ${persistentCache.isReady ? 'Yes' : 'No'}`)
        setGames([])
      }
    } catch (error) {
      console.error('❌ Failed to scan for games:', error)
      setError(`Failed to load games: ${error?.message || 'Unknown error'}`)
      setGames([])
    } finally {
      setLoading(false)
    }
  }

  // Batch refresh board caches using persistent cache
  const refreshAllBoards = async () => {
    if (!persistentCache.isReady || games.length === 0) {
      console.warn('⚠️ Cannot refresh boards - persistent cache not ready or no games')
      return
    }

    setLoading(true)
    try {
      console.log(`🔄 Refreshing board data for ${games.length} games using persistent cache...`)
      
      // Load board data for all games
      const promises = games.map(game => 
        persistentCache.loadPlacedTiles(game.id).catch(err => {
          console.warn(`Failed to load tiles for game ${game.id}:`, err)
        })
      )
      
      await Promise.all(promises)
      console.log('✅ All board data refreshed successfully using persistent cache')
    } catch (error) {
      console.error('❌ Failed to refresh board data:', error)
      setError(`Failed to refresh boards: ${error?.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Clear cache and force refresh
  const clearCacheAndRefresh = async () => {
    if (!persistentCache.isReady) return
    
    persistentCache.clearAllCache()
    await scanForGames()
  }

  // Show cache statistics
  const getCacheStatsDisplay = () => {
    if (!persistentCache.isReady) return null
    
    const stats = persistentCache.getCacheStats()
    if (!stats) return null
    
    return (
      <div css={cacheStatsStyle}>
        <h4>📊 Cache Statistics</h4>
        <div>Items: {stats.totalCacheItems}</div>
        <div>Size: {stats.cacheSizeKB} KB</div>
        <div>Oldest: {stats.oldestEntryAge ? Math.round(stats.oldestEntryAge / 1000) + 's ago' : 'None'}</div>
        <div>Newest: {stats.newestEntryAge ? Math.round(stats.newestEntryAge / 1000) + 's ago' : 'None'}</div>
      </div>
    )
  }

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    let filtered = games.filter(game => {
      switch (filter) {
        case 'active':
          return game.state === 1 // Only games in progress
        case 'completed':
          return game.state === 2 // Only completed games
        default:
          return game.state !== 3 // All except cancelled
      }
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'turn':
          return b.turnNumber - a.turnNumber
        case 'score':
          return Math.max(...b.playerScores) - Math.max(...a.playerScores)
        default: // 'recent'
          return b.lastUpdate - a.lastUpdate
      }
    })
  }, [games, filter, sortBy])

  const handleGameClick = (gameId: number) => {
    if (onSelectGame) {
      onSelectGame(gameId)
    } else {
      setSelectedGameId(gameId)
    }
  }

  const handleCloseSpectator = () => {
    setSelectedGameId(null)
  }

  const getStatusColor = (state: number) => {
    switch (state) {
      case 0: return '#fbbf24' // Setup - yellow
      case 1: return '#10b981' // Playing - green
      case 2: return '#6366f1' // Completed - blue
      case 3: return '#ef4444' // Cancelled - red
      default: return '#6b7280' // Unknown - gray
    }
  }

  const getStatusText = (state: number) => {
    switch (state) {
      case 0: return 'Setup'
      case 1: return 'Playing'
      case 2: return 'Completed'
      case 3: return 'Cancelled'
      default: return 'Unknown'
    }
  }

  if (selectedGameId) {
    return <GameSpectator gameId={selectedGameId} onClose={handleCloseSpectator} />
  }

  return (
    <div css={containerStyle}>
      {/* Blockchain Header */}
      <div css={blockchainHeaderStyle}>
        <div css={headerLeftStyle}>
          <h1 css={titleStyle}>🎮 Game Gallery</h1>
          <div css={networkInfoStyle}>
            <span css={networkLabelStyle}>Network:</span>
            <span css={networkNameStyle}>{blockchainGame.networkName || 'Unknown'}</span>
            {blockchainGame.contractAddress && (
              <span css={contractInfoStyle}>
                📄 {blockchainGame.contractAddress.slice(0, 6)}...{blockchainGame.contractAddress.slice(-4)}
              </span>
            )}
          </div>
        </div>
        
        <div css={headerCenterStyle}>
          <div css={statsStyle}>
            {loading ? 'Loading games...' : `${filteredAndSortedGames.length} games found`}
          </div>
          {blockchainGame.isConnected && (
            <div css={walletInfoStyle}>
              <span css={walletLabelStyle}>Connected:</span>
              <span css={walletAddressStyle}>
                {blockchainGame.userAddress?.slice(0, 6)}...{blockchainGame.userAddress?.slice(-4)}
              </span>
            </div>
          )}
          <div css={networkPickerContainerStyle}>
            <NetworkPicker />
          </div>
        </div>
        
        <div css={headerRightStyle}>
          <DynamicConnectButton />
          <button css={refreshButtonStyle} onClick={refreshAllBoards} disabled={loading}>
            {loading ? '📡' : '🎨'} Boards
          </button>
          <button css={refreshButtonStyle} onClick={scanForGames} disabled={loading}>
            {loading ? '⏳' : '🔄'} Games
          </button>
          <button css={refreshButtonStyle} onClick={clearCacheAndRefresh} disabled={loading || !persistentCache.isReady}>
            🗑️ Clear Cache
          </button>
          <button css={refreshButtonStyle} onClick={() => setShowCacheStats(!showCacheStats)}>
            📊 Stats
          </button>
          <a href="/" css={linkStyle} title="Back to Game">
            🏠
          </a>
          <a href="/new-age" css={linkStyle} title="New Age Testing">
            🔮
          </a>
        </div>
      </div>

      {/* Controls */}
      <div css={controlsHeaderStyle}>
        <div css={controlsLeftStyle}>
          <select
            css={selectStyle}
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Games</option>
            <option value="active">Active Games</option>
            <option value="completed">Completed Games</option>
          </select>
          
          <select
            css={selectStyle}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="recent">Recent</option>
            <option value="turn">Most Turns</option>
            <option value="score">Highest Score</option>
          </select>
        </div>
      </div>

      {/* Cache Stats Display */}
      {showCacheStats && (
        <div css={cacheStatsContainerStyle}>
          {getCacheStatsDisplay()}
          <div css={cacheActionsStyle}>
            <span css={cacheInfoStyle}>
              💾 Persistent cache stores data locally to reduce blockchain queries and prevent rate limiting.
              <br />
              ⏱️ Data expires after 5 minutes. Board data is cached per game.
              <br />
              🔄 Cache status: {persistentCache.isReady ? '✅ Ready' : '❌ Not Ready'}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div css={errorStyle}>
          <span>⚠️ {error}</span>
          <button css={retryButtonStyle} onClick={scanForGames}>
            Try Again
          </button>
        </div>
      )}

      {/* Debug components disabled to prevent automatic RPC calls */}
      {/* <DirectRPCTest /> */}
      {/* <DebugCacheTest /> */}
      
      {/* Games Grid Section with Refresh Controls */}
      <div css={gamesGridHeaderStyle}>
        <div css={gamesGridTitleStyle}>
          <h2 css={gridSectionTitleStyle}>
            {filteredAndSortedGames.length > 0 
              ? `${filteredAndSortedGames.length} Games` 
              : 'No Games Found'
            }
          </h2>
          {games.length > 0 && (
            <span css={gridSubtitleStyle}>
              Showing {filteredAndSortedGames.length} of {games.length} games
            </span>
          )}
        </div>
        
        <div css={gamesGridActionsStyle}>
          <button css={gridRefreshButtonStyle} onClick={scanForGames} disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh Games'}
          </button>
          <button css={gridRefreshButtonStyle} onClick={refreshAllBoards} disabled={loading || games.length === 0}>
            {loading ? '📡 Loading...' : '🎨 Load Boards'}
          </button>
          {persistentCache.isReady && (
            <button css={gridClearButtonStyle} onClick={clearCacheAndRefresh} disabled={loading}>
              🗑️ Clear Cache
            </button>
          )}
        </div>
      </div>
      
      <div css={gamesGridStyle}>
        {loading ? (
          // Loading placeholders
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} css={[gameCardStyle, loadingCardStyle]}>
              <div css={loadingShimmerStyle}></div>
            </div>
          ))
        ) : filteredAndSortedGames.length === 0 ? (
          <div css={emptyStateStyle}>
            <button css={bigRefreshButtonStyle} onClick={scanForGames} disabled={loading}>
              {loading ? '⏳' : '🔄'}
            </button>
            <h3>{games.length === 0 ? 'No games loaded yet' : 'No games match your filters'}</h3>
            <p>
              {games.length === 0 
                ? 'Click the refresh button to load games from the blockchain' 
                : 'Try changing your filter settings or refresh to check for new games'
              }
            </p>
            {games.length === 0 && persistentCache.isReady && (
              <button css={emptyClearCacheButtonStyle} onClick={clearCacheAndRefresh} disabled={loading}>
                🗑️ Clear Cache & Refresh
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => handleGameClick(game.id)}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          ))
        )}
      </div>
    </div>
  )
}

// GameCard component
interface GameCardProps {
  game: GameInfo
  onClick: () => void
  getStatusColor: (state: number) => string
  getStatusText: (state: number) => string
}

function GameCard({ game, onClick, getStatusColor, getStatusText }: GameCardProps) {
  const maxScore = Math.max(...game.playerScores)
  const winner = game.playerScores.indexOf(maxScore)
  const blockchainGame = useBlockchainGame() // Get blockchain context for contract info
  const persistentCache = usePersistentGameCache() // For refreshing board preview
  
  // Calculate actual values that will be passed to cache
  const actualContractAddress = blockchainGame.contractAddress || '0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F'
  const actualNetworkName = blockchainGame.networkName || 'Base Sepolia'  
  const actualChainId = blockchainGame.currentNetwork || 84532
  
  // Debug logging removed to prevent console spam
  
  const handleSpectate = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log(`🎮 Spectating game ${game.id}`)
    // Use replace instead of direct assignment for better React compatibility
    window.location.replace(`/game/${game.id}`)
  }

  const handleJoinPlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log(`🚀 Joining game ${game.id} as player`)
    window.location.replace(`/game/${game.id}/play`)
  }

  const handleRefreshBoard = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation to game
    
    if (!persistentCache.isReady) return
    
    try {
      console.log(`🔄 Refreshing board for game ${game.id}`)
      await persistentCache.loadPlacedTiles(game.id)
      // The GameBoardPreview component will automatically update via useEffect
    } catch (error) {
      console.warn(`⚠️ Failed to refresh board for game ${game.id}:`, error)
    }
  }

  return (
    <div css={gameCardStyle}>
      <div css={cardHeaderStyle}>
        <div css={gameIdStyle}>Game #{game.id}</div>
        <div css={cardHeaderActionsStyle}>
          <button css={cardRefreshButtonStyle} onClick={handleRefreshBoard} title="Refresh board preview">
            🔄
          </button>
          <div 
            css={statusBadgeStyle}
            style={{ backgroundColor: getStatusColor(game.state) }}
          >
            {getStatusText(game.state)}
          </div>
        </div>
      </div>

      <div css={boardPreviewStyle} onClick={handleSpectate}>
        <GameBoardPreview 
          gameId={game.id} 
          contractAddress={actualContractAddress} 
          networkName={actualNetworkName}
          chainId={actualChainId} 
        />
      </div>

      <div css={gameInfoCardStyle}>
        <div css={infoRowStyle}>
          <span css={infoLabelStyle}>Players:</span>
          <span css={infoValueStyle}>{game.playerCount}</span>
        </div>
        <div css={infoRowStyle}>
          <span css={infoLabelStyle}>Turn:</span>
          <span css={infoValueStyle}>{game.turnNumber}</span>
        </div>
        <div css={infoRowStyle}>
          <span css={infoLabelStyle}>Pool:</span>
          <span css={infoValueStyle}>{game.tilesRemaining}</span>
        </div>
      </div>

      {game.state === 2 && (
        <div css={winnerStyle}>
          🏆 Player {winner + 1} wins with {maxScore} points!
        </div>
      )}

      {game.state === 1 && (
        <div css={currentTurnStyle}>
          ⏰ Player {game.currentPlayerIndex + 1}'s turn
        </div>
      )}

      <div css={playersPreviewStyle}>
        {game.playerAddresses.slice(0, 3).map((addr, index) => (
          <div key={addr} css={playerPreviewStyle}>
            <div css={playerAvatarStyle}>{index + 1}</div>
            <div css={playerScorePreviewStyle}>{game.playerScores[index] || 0}</div>
          </div>
        ))}
        {game.playerAddresses.length > 3 && (
          <div css={morePlayersStyle}>+{game.playerAddresses.length - 3}</div>
        )}
      </div>

      {/* Action Buttons */}
      <div css={cardActionsStyle}>
        <button css={spectateButtonStyle} onClick={handleSpectate}>
          👁️ Spectate
        </button>
        
        {(game.state === 0 || game.state === 1) && (
          <button css={joinPlayButtonStyle} onClick={handleJoinPlay}>
            {game.state === 0 ? '🎮 Join Game' : '⚡ Play Now'}
          </button>
        )}
      </div>
    </div>
  )
}

// Styles
const containerStyle = css`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 0;
`

// New blockchain header styles
const blockchainHeaderStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(139, 69, 19, 0.12);
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
  min-height: 80px;
  z-index: 50;
  position: relative;
`

const headerLeftStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`

const titleStyle = css`
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(45deg, #ffd700, #ffeb3b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
`

const networkInfoStyle = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 215, 0, 0.8);
`

const networkLabelStyle = css`
  opacity: 0.7;
`

const networkNameStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 4px;
  padding: 2px 6px;
  color: #ffd700;
  font-weight: 600;
`

const contractInfoStyle = css`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 4px;
  padding: 2px 6px;
  color: #10b981;
  font-size: 0.75rem;
  font-family: monospace;
`

const headerCenterStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
`

const statsStyle = css`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffd700;
  text-align: center;
`

const walletInfoStyle = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 215, 0, 0.8);
`

const walletLabelStyle = css`
  opacity: 0.7;
`

const walletAddressStyle = css`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 4px;
  padding: 2px 6px;
  color: #10b981;
  font-family: monospace;
  font-size: 0.75rem;
`

const headerRightStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: flex-end;
`

const networkPickerContainerStyle = css`
  margin-top: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const linkStyle = css`
  color: rgba(255, 215, 0, 0.8);
  text-decoration: none;
  font-size: 1.2rem;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #FFD700;
    background: rgba(255, 215, 0, 0.1);
    transform: scale(1.1);
  }
`

const refreshButtonStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  padding: 8px 12px;
  color: #FFD700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 215, 0, 0.3);
    border-color: #FFD700;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

// Controls header
const controlsHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const controlsLeftStyle = css`
  display: flex;
  gap: 1rem;
  align-items: center;
`

const selectStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  option {
    background: #333;
    color: white;
  }
`

const errorStyle = css`
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const retryButtonStyle = css`
  background: rgba(239, 68, 68, 0.3);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(239, 68, 68, 0.4);
  }
`

const gamesGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const gameCardStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.4);
  }
`

const loadingCardStyle = css`
  cursor: default;
  &:hover {
    transform: none;
    box-shadow: none;
  }
`

const loadingShimmerStyle = css`
  height: 300px;
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  border-radius: 8px;
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`

const cardHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`

const gameIdStyle = css`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffd700;
`

const cardHeaderActionsStyle = css`
  display: flex;
  gap: 8px;
  align-items: center;
`

const cardRefreshButtonStyle = css`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #FFD700;
    background: rgba(255, 215, 0, 0.1);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const statusBadgeStyle = css`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const boardPreviewStyle = css`
  height: 120px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`

const gameInfoCardStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
`

const infoRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const infoLabelStyle = css`
  font-size: 0.85rem;
  opacity: 0.8;
`

const infoValueStyle = css`
  font-weight: bold;
  color: #10b981;
`

const winnerStyle = css`
  background: rgba(255, 215, 0, 0.2);
  padding: 8px;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 10px;
`

const currentTurnStyle = css`
  background: rgba(34, 197, 94, 0.2);
  padding: 8px;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  color: #22c55e;
  margin-bottom: 10px;
`

const playersPreviewStyle = css`
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  align-items: center;
`

const playerPreviewStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`

const playerAvatarStyle = css`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
`

const playerScorePreviewStyle = css`
  font-size: 0.8rem;
  font-weight: bold;
  color: #10b981;
`

const morePlayersStyle = css`
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 0.7rem;
  opacity: 0.7;
`

const cardActionsStyle = css`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`

const spectateButtonStyle = css`
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`

const joinPlayButtonStyle = css`
  flex: 1;
  padding: 8px 12px;
  background: rgba(34, 197, 94, 0.3);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: rgba(34, 197, 94, 0.5);
  }
`

const emptyStateStyle = css`
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
`

const emptyIconStyle = css`
  font-size: 3rem;
  margin-bottom: 10px;
`

// Missing CSS styles for GameBoardPreview
const previewErrorStyle = css`
  width: 100%;
  height: 100px;
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`

const previewLoadingStyle = css`
  width: 100%;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
`

const previewEmptyStyle = css`
  width: 100%;
  height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
`

const loadingDotStyle = css`
  font-size: 1.5rem;
  margin-bottom: 5px;
`

const emptyBoardIconStyle = css`
  font-size: 2rem;
  margin-bottom: 5px;
  opacity: 0.5;
`

const compactBoardContainerStyle = css`
  width: 100%;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const compactBoardGridStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(15, 1fr);
  gap: 1px;
  width: 75px;
  height: 75px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 2px;
`

const compactCellStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3px;
  position: relative;
`

const compactCenterCellStyle = css`
  background: rgba(255, 255, 0, 0.3);
`

const compactTileStyle = css`
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  border-radius: 1px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`

const compactTileNumberStyle = css`
  font-size: 3px;
  line-height: 1;
`

const compactCenterMarkerStyle = css`
  color: #ffeb3b;
  font-size: 3px;
  font-weight: bold;
`

const tileCountStyle = css`
  font-size: 0.7rem;
  opacity: 0.7;
  margin-top: 5px;
`

const cacheStatsStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`

const cacheStatsContainerStyle = css`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 2rem;
`

const cacheActionsStyle = css`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const cacheInfoStyle = css`
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1.4;
`

const gamesGridHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const gamesGridTitleStyle = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const gridSectionTitleStyle = css`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #ffd700, #ffeb3b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
`

const gridSubtitleStyle = css`
  font-size: 0.8rem;
  opacity: 0.7;
`

const gamesGridActionsStyle = css`
  display: flex;
  gap: 1rem;
  align-items: center;
`

const gridRefreshButtonStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  padding: 8px 12px;
  color: #FFD700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 215, 0, 0.3);
    border-color: #FFD700;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const gridClearButtonStyle = css`
  background: rgba(239, 68, 68, 0.3);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(239, 68, 68, 0.4);
  }
`

const emptyActionsStyle = css`
  display: flex;
  gap: 1rem;
  align-items: center;
`

const emptyRefreshButtonStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  padding: 8px 12px;
  color: #FFD700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 215, 0, 0.3);
    border-color: #FFD700;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const emptyClearCacheButtonStyle = css`
  background: rgba(239, 68, 68, 0.3);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(239, 68, 68, 0.4);
  }
`

const bigRefreshButtonStyle = css`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 215, 0, 0.2);
  border: 3px solid rgba(255, 215, 0, 0.4);
  color: #FFD700;
  font-size: 4rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  
  &:hover:not(:disabled) {
    background: rgba(255, 215, 0, 0.3);
    border-color: #FFD700;
    transform: scale(1.1);
    box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  &:active:not(:disabled) {
    transform: scale(1.05);
  }
`