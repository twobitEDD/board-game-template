import { CONTRACT_CONFIG, listActiveNetworks } from '../config/contractConfig'

export interface LiveGameActivity {
  gameId: number
  action: string
  player: string
  timestamp: number
  network: string
  contractAddress: string
  chainId: number
}

export interface GameEvent {
  gameId: number
  eventType: 'GameCreated' | 'PlayerJoined' | 'TilePlaced' | 'GameCompleted' | 'TurnAdvanced'
  player: string
  blockNumber: number
  timestamp: number
  network: string
  contractAddress: string
  chainId: number
}

class LiveActivityService {
  private activityCache: Map<string, LiveGameActivity[]> = new Map()
  private lastUpdate: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 30000 // 30 seconds
  private readonly MAX_ACTIVITIES = 50

  /**
   * Get live activity from all active networks
   */
  async getLiveActivity(): Promise<LiveGameActivity[]> {
    const activeNetworks = listActiveNetworks()
    const allActivities: LiveGameActivity[] = []

    try {
      // Fetch from all active networks in parallel
      const networkPromises = activeNetworks.map(network => 
        this.getNetworkActivity(network.chainId, network.contractAddress, network.name)
      )

      const networkActivities = await Promise.allSettled(networkPromises)
      
      // Combine all activities
      networkActivities.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allActivities.push(...result.value)
        } else {
          console.error(`Failed to fetch activity from network ${activeNetworks[index].name}:`, result.reason)
        }
      })

      // Sort by timestamp (newest first) and limit
      return allActivities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.MAX_ACTIVITIES)

    } catch (error) {
      console.error('Failed to fetch live activity:', error)
      return this.getMockActivity() // Fallback to mock data
    }
  }

  /**
   * Get activity for a specific network
   */
  private async getNetworkActivity(chainId: number, contractAddress: string, networkName: string): Promise<LiveGameActivity[]> {
    const cacheKey = `${chainId}-${contractAddress}`
    const now = Date.now()
    
    // Check cache first
    if (this.activityCache.has(cacheKey)) {
      const lastUpdate = this.lastUpdate.get(cacheKey) || 0
      if (now - lastUpdate < this.CACHE_DURATION) {
        return this.activityCache.get(cacheKey) || []
      }
    }

    try {
      // Try to fetch real blockchain events
      const events = await this.fetchBlockchainEvents(chainId, contractAddress, networkName)
      const activities = this.convertEventsToActivities(events)
      
      // Cache the results
      this.activityCache.set(cacheKey, activities)
      this.lastUpdate.set(cacheKey, now)
      
      return activities
    } catch (error) {
      console.error(`Failed to fetch blockchain events for ${networkName}:`, error)
      return this.getMockActivityForNetwork(networkName, contractAddress, chainId)
    }
  }

  /**
   * Fetch blockchain events (placeholder for real implementation)
   */
  private async fetchBlockchainEvents(chainId: number, contractAddress: string, networkName: string): Promise<GameEvent[]> {
    // This is a placeholder - in a real implementation, you would:
    // 1. Connect to the blockchain using viem or ethers
    // 2. Query contract events (GameCreated, PlayerJoined, TilePlaced, etc.)
    // 3. Parse the events and return them
    
    try {
      // For now, return empty array to trigger mock data
      return []
    } catch (error) {
      console.error(`Error fetching blockchain events for ${networkName}:`, error)
      throw error
    }
  }

  /**
   * Convert blockchain events to activity format
   */
  private convertEventsToActivities(events: GameEvent[]): LiveGameActivity[] {
    return events.map(event => ({
      gameId: event.gameId,
      action: this.getActionText(event.eventType),
      player: this.shortenAddress(event.player),
      timestamp: event.timestamp,
      network: event.network,
      contractAddress: event.contractAddress,
      chainId: event.chainId
    }))
  }

  /**
   * Get human-readable action text
   */
  private getActionText(eventType: GameEvent['eventType']): string {
    switch (eventType) {
      case 'GameCreated': return 'Game Created'
      case 'PlayerJoined': return 'Player Joined'
      case 'TilePlaced': return 'Tile Placed'
      case 'GameCompleted': return 'Game Completed'
      case 'TurnAdvanced': return 'Turn Advanced'
      default: return 'Action'
    }
  }

  /**
   * Shorten wallet address for display
   */
  private shortenAddress(address: string): string {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * Get mock activity for development/testing
   */
  private getMockActivity(): LiveGameActivity[] {
    const now = Date.now()
    return [
      {
        gameId: 1,
        action: "Game Created",
        player: "0x1234...5678",
        timestamp: now - 300000, // 5 minutes ago
        network: "Base Sepolia",
        contractAddress: "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75",
        chainId: 84532
      },
      {
        gameId: 2,
        action: "Tile Placed",
        player: "0xabcd...efgh",
        timestamp: now - 180000, // 3 minutes ago
        network: "Base Sepolia",
        contractAddress: "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75",
        chainId: 84532
      },
      {
        gameId: 1,
        action: "Player Joined",
        player: "0x9876...4321",
        timestamp: now - 120000, // 2 minutes ago
        network: "Base Sepolia",
        contractAddress: "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75",
        chainId: 84532
      },
      {
        gameId: 3,
        action: "Game Completed",
        player: "0x5678...1234",
        timestamp: now - 60000, // 1 minute ago
        network: "Base Mainnet",
        contractAddress: "0x80f80B22D1839F2216F7f7814398e7039Fc17546",
        chainId: 8453
      },
      {
        gameId: 4,
        action: "Tile Placed",
        player: "0x9abc...def0",
        timestamp: now - 45000, // 45 seconds ago
        network: "Base Sepolia",
        contractAddress: "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75",
        chainId: 84532
      }
    ]
  }

  /**
   * Get mock activity for a specific network
   */
  private getMockActivityForNetwork(networkName: string, contractAddress: string, chainId: number): LiveGameActivity[] {
    const now = Date.now()
    const baseTime = now - Math.random() * 300000 // Random time within last 5 minutes
    
    return [
      {
        gameId: Math.floor(Math.random() * 10) + 1,
        action: "Game Created",
        player: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
        timestamp: baseTime,
        network: networkName,
        contractAddress,
        chainId
      }
    ]
  }

  /**
   * Clear cache for a specific network
   */
  clearCache(chainId?: number, contractAddress?: string) {
    if (chainId && contractAddress) {
      const cacheKey = `${chainId}-${contractAddress}`
      this.activityCache.delete(cacheKey)
      this.lastUpdate.delete(cacheKey)
    } else {
      this.activityCache.clear()
      this.lastUpdate.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedNetworks: this.activityCache.size,
      lastUpdates: Object.fromEntries(this.lastUpdate.entries())
    }
  }
}

// Export singleton instance
export const liveActivityService = new LiveActivityService()
export default liveActivityService 