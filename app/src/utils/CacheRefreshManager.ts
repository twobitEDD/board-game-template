// Global cache refresh manager to prevent rate limiting
export class CacheRefreshManager {
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

  // Cancel all pending refreshes
  cancelAll(): void {
    this.refreshTimers.forEach(timer => clearTimeout(timer))
    this.refreshTimers.clear()
    this.refreshPromises.clear()
  }
}

// Global cache refresh manager instance
export const cacheRefreshManager = new CacheRefreshManager()
