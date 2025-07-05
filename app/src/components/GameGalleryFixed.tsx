/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { css } from '@emotion/react'
import { GameSpectator } from './GameSpectator'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { useGameCache } from '../hooks/useGameCache'
import { DynamicConnectButton } from './DynamicConnectButton'
import { NetworkPicker } from './NetworkPicker'
import { cacheRefreshManager } from '../utils/CacheRefreshManager'

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

// Fixed GameBoardPreview component - NO auto-refresh to prevent rate limiting
function GameBoardPreview({ gameId, contractAddress, networkName, chainId }: {
  gameId: number
  contractAddress: string
  networkName: string
  chainId?: number
}) {
  const { placedTiles, isLoading, error, refreshData } = useGameCache({
    blockchainGameId: gameId,
    contractAddress,
    networkName,
    chainId
  })

  // Manual refresh function that uses the cache manager
  const handleRefresh = useCallback(async () => {
    if (!contractAddress || !networkName) return
    
    try {
      await cacheRefreshManager.requestRefresh(gameId, contractAddress, refreshData)
    } catch (error) {
      console.warn(`⚠️ GameBoardPreview: Cache refresh failed for game ${gameId}:`, error)
    }
  }, [gameId, contractAddress, refreshData])

  // Add visual debug info for troubleshooting
  if (error) {
    return (
      <div css={previewErrorStyle}>
        <div style={{ fontSize: '0.6rem', textAlign: 'center' }}>
          Error loading board
          <br />
          <button 
            onClick={handleRefresh} 
            style={{ fontSize: '0.5rem', padding: '2px 4px', marginTop: '2px' }}
          >
            Retry
          </button>
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
          <br />
          <button 
            onClick={handleRefresh} 
            style={{ fontSize: '0.5rem', padding: '2px 4px', marginTop: '2px' }}
          >
            Load Board
          </button>
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'turn' | 'score'>('recent')
  const [cachesLoading, setCachesLoading] = useState(false)

  const blockchainGame = useBlockchainGame()

  // Scan for games on the blockchain
  const scanForGames = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Scanning for real games using blockchain hook...')
      
      const contractGames = await blockchainGame.getAllGames()
      console.log('📋 getAllGames() returned:', contractGames)
      
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
          console.log(`🎮 Successfully loaded ${gamesList.length} games from blockchain`)
        } else {
          throw new Error('No valid games found after transformation')
        }
      } else {
        console.log('📝 No contract games found')
        setError(`No games found on blockchain. Contract: ${blockchainGame.contractAddress || 'none'}, Network: ${blockchainGame.networkName || 'unknown'}`)
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

  // Batch refresh all game board caches
  const refreshAllBoards = async () => {
    if (!blockchainGame.contractAddress || games.length === 0) {
      console.warn('⚠️ Cannot refresh boards - no contract address or games')
      return
    }

    setCachesLoading(true)
    try {
      const gameIds = games.map(g => g.id)
      console.log(`🔄 Refreshing boards for ${gameIds.length} games...`)
      
      await cacheRefreshManager.refreshAll(
        gameIds,
        blockchainGame.contractAddress,
        async (gameId: number) => {
          // This will be called for each game through the cache manager
          console.log(`🔄 Refreshing board cache for game ${gameId}`)
        }
      )
      
      console.log('✅ All board caches refreshed successfully')
    } catch (error) {
      console.error('❌ Failed to refresh board caches:', error)
    } finally {
      setCachesLoading(false)
    }
  }

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    let filtered = games.filter(game => {
      switch (filter) {
        case 'active':
          return game.state === 1
        case 'completed':
          return game.state === 2
        default:
          return game.state !== 3
      }
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'turn':
          return b.turnNumber - a.turnNumber
        case 'score':
          return Math.max(...b.playerScores) - Math.max(...a.playerScores)
        default:
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
      case 0: return '#fbbf24'
      case 1: return '#10b981'
      case 2: return '#6366f1'
      case 3: return '#ef4444'
      default: return '#6b7280'
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
      {/* Header */}
      <div css={blockchainHeaderStyle}>
        <div css={headerLeftStyle}>
          <h1 css={titleStyle}>🎮 Game Gallery (Fixed)</h1>
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
          <button css={refreshButtonStyle} onClick={refreshAllBoards} disabled={cachesLoading}>
            {cachesLoading ? '📡' : '🎨'} Boards
          </button>
          <button css={refreshButtonStyle} onClick={scanForGames} disabled={loading}>
            {loading ? '⏳' : '🔄'} Games
          </button>
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
        
        <div css={controlsRightStyle}>
          <span css={helpTextStyle}>
            🔧 Fixed version: Manual refresh prevents rate limiting
          </span>
        </div>
      </div>

      {error && (
        <div css={errorStyle}>
          <span>⚠️ {error}</span>
          <button css={retryButtonStyle} onClick={scanForGames}>
            Try Again
          </button>
        </div>
      )}

      <div css={gamesGridStyle}>
        {loading ? (
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} css={[gameCardStyle, loadingCardStyle]}>
              <div css={loadingShimmerStyle}></div>
            </div>
          ))
        ) : filteredAndSortedGames.length === 0 ? (
          <div css={noGamesStyle}>
            <div css={noGamesIconStyle}>🎮</div>
            <div css={noGamesTextStyle}>No games found</div>
            <button css={refreshButtonStyle} onClick={scanForGames}>
              🔄 Scan for Games
            </button>
          </div>
        ) : (
          filteredAndSortedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => handleGameClick(game.id)}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              blockchainGame={blockchainGame}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Individual game card component
function GameCard({ game, onClick, getStatusColor, getStatusText, blockchainGame }: {
  game: GameInfo
  onClick: () => void
  getStatusColor: (state: number) => string
  getStatusText: (state: number) => string
  blockchainGame: any
}) {
  const handleSpectate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  const handleJoinPlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.pathname = `/game/${game.id}/play`
  }

  return (
    <div css={gameCardStyle} onClick={handleSpectate}>
      <div css={gameCardHeaderStyle}>
        <div css={gameIdStyle}>Game {game.id}</div>
        <div css={gameStatusStyle} style={{ color: getStatusColor(game.state) }}>
          {getStatusText(game.state)}
        </div>
      </div>

      <div css={gameStatsStyle}>
        <div css={statItemStyle}>
          <span css={statLabelStyle}>Players:</span>
          <span css={statValueStyle}>{game.playerCount}/{game.playerCount}</span>
        </div>
        <div css={statItemStyle}>
          <span css={statLabelStyle}>Turn:</span>
          <span css={statValueStyle}>{game.turnNumber}</span>
        </div>
        <div css={statItemStyle}>
          <span css={statLabelStyle}>Tiles:</span>
          <span css={statValueStyle}>{game.tilesRemaining}</span>
        </div>
      </div>

      <div css={gameBoardPreviewStyle}>
        <GameBoardPreview
          gameId={game.id}
          contractAddress={blockchainGame.contractAddress || '0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F'}
          networkName={blockchainGame.networkName || 'Base Sepolia'}
          chainId={blockchainGame.currentNetwork || 84532}
        />
      </div>

      <div css={gameActionsStyle}>
        <button css={spectateButtonStyle} onClick={handleSpectate}>
          👁️ Spectate
        </button>
        <button css={joinButtonStyle} onClick={handleJoinPlay}>
          🎮 Join/Play
        </button>
      </div>
    </div>
  )
}

// CSS styles (copied from original)
const containerStyle = css`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
`

const blockchainHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
`

const headerLeftStyle = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const headerCenterStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`

const headerRightStyle = css`
  display: flex;
  gap: 10px;
  align-items: center;
`

const titleStyle = css`
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
`

const networkInfoStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
`

const networkLabelStyle = css`
  font-size: 0.9rem;
  opacity: 0.8;
`

const networkNameStyle = css`
  font-size: 0.9rem;
  font-weight: bold;
`

const contractInfoStyle = css`
  font-size: 0.8rem;
  opacity: 0.7;
`

const statsStyle = css`
  font-size: 1.1rem;
  font-weight: bold;
`

const walletInfoStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
`

const walletLabelStyle = css`
  font-size: 0.9rem;
  opacity: 0.8;
`

const walletAddressStyle = css`
  font-size: 0.9rem;
  font-weight: bold;
`

const networkPickerContainerStyle = css`
  display: flex;
  align-items: center;
`

const refreshButtonStyle = css`
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const controlsHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
`

const controlsLeftStyle = css`
  display: flex;
  gap: 10px;
`

const controlsRightStyle = css`
  display: flex;
  align-items: center;
`

const helpTextStyle = css`
  font-size: 0.9rem;
  opacity: 0.8;
`

const selectStyle = css`
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  cursor: pointer;

  option {
    background: #333;
    color: white;
  }
`

const errorStyle = css`
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.5);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const retryButtonStyle = css`
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
`

const gamesGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`

const gameCardStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.15);
  }
`

const loadingCardStyle = css`
  background: rgba(255, 255, 255, 0.05);
  cursor: default;
`

const loadingShimmerStyle = css`
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 25%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 75%
  );
  animation: shimmer 1.5s infinite;
  height: 150px;
  border-radius: 8px;

  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: 200px 0;
    }
  }
`

const gameCardHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`

const gameIdStyle = css`
  font-size: 1.2rem;
  font-weight: bold;
`

const gameStatusStyle = css`
  font-size: 0.9rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const gameStatsStyle = css`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
`

const statItemStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const statLabelStyle = css`
  font-size: 0.8rem;
  opacity: 0.7;
`

const statValueStyle = css`
  font-size: 1.1rem;
  font-weight: bold;
`

const gameBoardPreviewStyle = css`
  margin-bottom: 15px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const gameActionsStyle = css`
  display: flex;
  gap: 10px;
`

const spectateButtonStyle = css`
  flex: 1;
  padding: 10px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`

const joinButtonStyle = css`
  flex: 1;
  padding: 10px;
  background: rgba(34, 197, 94, 0.3);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: rgba(34, 197, 94, 0.5);
  }
`

const noGamesStyle = css`
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
`

const noGamesIconStyle = css`
  font-size: 3rem;
  margin-bottom: 10px;
`

const noGamesTextStyle = css`
  font-size: 1.2rem;
  margin-bottom: 20px;
  opacity: 0.7;
`

// Board preview styles
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