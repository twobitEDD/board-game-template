/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState, useEffect, useCallback } from 'react'
import { useBlockchainGame } from '../hooks/useBlockchainGame'

// Simple game state directly from contract
interface ContractGame {
  id: number
  state: number // 0=Setup, 1=InProgress, 2=Completed, 3=Cancelled
  creator: string
  maxPlayers: number
  currentPlayerIndex: number
  turnNumber: number
  playerAddresses: string[]
  playerScores: number[]
  tilesRemaining: number
  winningScore: number
}

interface ContractPlayer {
  name: string
  score: number
  hand: number[]
  hasJoined: boolean
  lastMoveTime: number
}

interface PlacedTile {
  x: number
  y: number
  number: number
  turnPlaced: number
}

export function FivesGameInterface() {
  // Blockchain connection
  const blockchainGame = useBlockchainGame()
  
  // UI State
  const [currentView, setCurrentView] = useState<'menu' | 'create' | 'join' | 'game'>('menu')
  const [gameId, setGameId] = useState<number | null>(null)
  
  // Game Data
  const [game, setGame] = useState<ContractGame | null>(null)
  const [playerInfo, setPlayerInfo] = useState<ContractPlayer | null>(null)
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Game Creation Form
  const [createForm, setCreateForm] = useState({
    maxPlayers: 2,
    allowIslands: false,
    winningScore: 1000,
    playerName: 'Player'
  })
  
  // Game Join Form
  const [joinForm, setJoinForm] = useState({
    gameId: '',
    playerName: 'Player'
  })
  
  // Game Play State
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [pendingMoves, setPendingMoves] = useState<{x: number, y: number, number: number}[]>([])

  // Load game data from contract
  const loadGame = useCallback(async (id: number) => {
    if (!blockchainGame.isConnected) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`🔄 Loading game ${id}...`)
      
      // Get game info
      const gameData = await blockchainGame.getGameState(id)
      if (!gameData) {
        throw new Error(`Game ${id} not found`)
      }
      
      setGame({
        id: gameData.id,
        state: gameData.state,
        creator: gameData.creator,
        maxPlayers: gameData.maxPlayers || 2,
        currentPlayerIndex: gameData.currentPlayerIndex || 0,
        turnNumber: gameData.turnNumber || 1,
        playerAddresses: gameData.playerAddresses || [],
        playerScores: gameData.playerScores || [],
        tilesRemaining: gameData.tilesRemaining || 0,
        winningScore: 1000 // Default winning score
      })
      
      // Get current player info
      const userAddress = blockchainGame.userAddress
      if (userAddress) {
        try {
          const playerData = await blockchainGame.getPlayerInfo(id, userAddress)
          if (playerData) {
            setPlayerInfo({
              name: playerData.name || 'Player',
              score: playerData.score || 0,
              hand: playerData.hand || [],
              hasJoined: playerData.hasJoined || false,
              lastMoveTime: playerData.lastMoveTime || 0
            })
          }
        } catch (playerError) {
          console.warn('Could not load player info:', playerError)
        }
      }
      
      // Get placed tiles
      try {
        const tilesData = await blockchainGame.getPlacedTiles(id)
        if (tilesData && Array.isArray(tilesData)) {
          setPlacedTiles(tilesData.map((tile: any, index: number) => ({
            x: tile.x || 0,
            y: tile.y || 0,
            number: tile.number || tile.displayNumber || 0,
            turnPlaced: tile.turnPlaced || 1
          })))
        }
      } catch (tilesError) {
        console.warn('Could not load placed tiles:', tilesError)
        setPlacedTiles([])
      }
      
      console.log(`✅ Game ${id} loaded successfully`)
      
    } catch (err) {
      console.error('Failed to load game:', err)
      setError(`Failed to load game: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [blockchainGame])

  // Create new game
  const createGame = async () => {
    if (!blockchainGame.isConnected || !blockchainGame.userAddress) {
      setError('Please connect your wallet first')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🎮 Creating new game...', createForm)
      
      const result = await blockchainGame.createGame(
        createForm.maxPlayers,
        createForm.allowIslands,
        createForm.winningScore,
        createForm.playerName
      )
      
      // Handle different return types from createGame
      const gameId = typeof result === 'number' ? result : result.gameId
      
      if (!gameId) {
        throw new Error('Game creation failed - no game ID returned')
      }
      
      console.log(`✅ Game created with ID: ${gameId}`)
      
      setGameId(gameId)
      setCurrentView('game')
      
      // Load the new game (gameId is guaranteed to be a number after null check)
      setTimeout(() => loadGame(gameId as number), 1000)
      
    } catch (err) {
      console.error('Failed to create game:', err)
      setError(`Failed to create game: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Join existing game
  const joinGame = async () => {
    if (!blockchainGame.isConnected || !blockchainGame.userAddress) {
      setError('Please connect your wallet first')
      return
    }
    
    const targetGameId = parseInt(joinForm.gameId)
    if (!targetGameId) {
      setError('Please enter a valid game ID')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`🎮 Joining game ${targetGameId}...`)
      
      await blockchainGame.joinGame(
        targetGameId,
        joinForm.playerName
      )
      
      console.log(`✅ Joined game ${targetGameId}`)
      
      setGameId(targetGameId)
      setCurrentView('game')
      
      // Load the joined game
      setTimeout(() => loadGame(targetGameId), 1000)
      
    } catch (err) {
      console.error('Failed to join game:', err)
      setError(`Failed to join game: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Start game (for creator)
  const startGame = async () => {
    if (!gameId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`🚀 Starting game ${gameId}...`)
      await blockchainGame.startGame(gameId)
      console.log(`✅ Game ${gameId} started`)
      
      // Reload game state
      setTimeout(() => loadGame(gameId), 1000)
      
    } catch (err) {
      console.error('Failed to start game:', err)
      setError(`Failed to start game: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Place tile on board
  const placeTile = (x: number, y: number) => {
    if (selectedTile === null) {
      setError('Please select a tile from your hand first')
      return
    }
    
    // Add to pending moves
    setPendingMoves(prev => [...prev, { x, y, number: selectedTile }])
    setSelectedTile(null)
  }

  // Submit turn with all pending moves
  const submitTurn = async () => {
    if (!gameId || pendingMoves.length === 0) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🎯 Submitting turn...', pendingMoves)
      
      await blockchainGame.playTurn(gameId, pendingMoves)
      
      console.log('✅ Turn submitted successfully')
      setPendingMoves([])
      
      // Reload game state
      setTimeout(() => loadGame(gameId), 2000)
      
    } catch (err) {
      console.error('Failed to submit turn:', err)
      setError(`Failed to submit turn: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Skip turn
  const skipTurn = async () => {
    if (!gameId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('⏭️ Skipping turn...')
      await blockchainGame.skipTurn(gameId)
      console.log('✅ Turn skipped')
      
      // Reload game state
      setTimeout(() => loadGame(gameId), 1000)
      
    } catch (err) {
      console.error('Failed to skip turn:', err)
      setError(`Failed to skip turn: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh game state
  useEffect(() => {
    if (gameId && currentView === 'game') {
      const interval = setInterval(() => {
        loadGame(gameId)
      }, 10000) // Refresh every 10 seconds
      
      return () => clearInterval(interval)
    }
  }, [gameId, currentView, loadGame])

  // Helper functions
  const isCurrentPlayer = () => {
    return game && playerInfo && blockchainGame.userAddress && 
           game.playerAddresses[game.currentPlayerIndex]?.toLowerCase() === blockchainGame.userAddress.toLowerCase()
  }

  const getStateText = (state: number) => {
    switch (state) {
      case 0: return 'Setup'
      case 1: return 'In Progress'
      case 2: return 'Completed'
      case 3: return 'Cancelled'
      default: return 'Unknown'
    }
  }

  // Render functions
  const renderMenu = () => (
    <div css={containerStyle}>
      <div css={headerStyle}>
        <h1>🎮 Fives Game</h1>
        <div css={walletInfoStyle}>
          {blockchainGame.isConnected ? (
            <div>
              <div>✅ Connected: {blockchainGame.userAddress?.slice(0, 6)}...{blockchainGame.userAddress?.slice(-4)}</div>
              <div>Network: {blockchainGame.networkName}</div>
            </div>
          ) : (
            <div>❌ Wallet not connected</div>
          )}
        </div>
      </div>
      
      <div css={menuStyle}>
        <button css={buttonStyle} onClick={() => setCurrentView('create')}>
          🎯 Create New Game
        </button>
        
        <button css={buttonStyle} onClick={() => setCurrentView('join')}>
          🎮 Join Existing Game
        </button>
        
        <button css={buttonStyle} onClick={() => {
          window.location.pathname = '/mystical-join'
        }}>
          🔮 Mystical Game Portal
        </button>
      </div>
      
      {error && <div css={errorStyle}>{error}</div>}
    </div>
  )

  const renderCreateForm = () => (
    <div css={containerStyle}>
      <div css={headerStyle}>
        <h2>🎯 Create New Game</h2>
        <button css={backButtonStyle} onClick={() => setCurrentView('menu')}>
          ← Back
        </button>
      </div>
      
      <div css={formStyle}>
        <div css={fieldStyle}>
          <label>Player Name:</label>
          <input 
            value={createForm.playerName}
            onChange={(e) => setCreateForm(prev => ({ ...prev, playerName: e.target.value }))}
            css={inputStyle}
          />
        </div>
        
        <div css={fieldStyle}>
          <label>Max Players:</label>
          <select 
            value={createForm.maxPlayers}
            onChange={(e) => setCreateForm(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
            css={inputStyle}
          >
            <option value={1}>1 Player</option>
            <option value={2}>2 Players</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players</option>
          </select>
        </div>
        
        <div css={fieldStyle}>
          <label>Winning Score:</label>
          <input 
            type="number"
            value={createForm.winningScore}
            onChange={(e) => setCreateForm(prev => ({ ...prev, winningScore: parseInt(e.target.value) }))}
            css={inputStyle}
          />
        </div>
        
        <div css={fieldStyle}>
          <label>
            <input 
              type="checkbox"
              checked={createForm.allowIslands}
              onChange={(e) => setCreateForm(prev => ({ ...prev, allowIslands: e.target.checked }))}
            />
            Allow Island Placements
          </label>
        </div>
        
        <button 
          css={buttonStyle} 
          onClick={createGame}
          disabled={isLoading}
        >
          {isLoading ? '⏳ Creating...' : '🎯 Create Game'}
        </button>
      </div>
      
      {error && <div css={errorStyle}>{error}</div>}
    </div>
  )

  const renderJoinForm = () => (
    <div css={containerStyle}>
      <div css={headerStyle}>
        <h2>🎮 Join Existing Game</h2>
        <button css={backButtonStyle} onClick={() => setCurrentView('menu')}>
          ← Back
        </button>
      </div>
      
      <div css={formStyle}>
        <div css={fieldStyle}>
          <label>Player Name:</label>
          <input 
            value={joinForm.playerName}
            onChange={(e) => setJoinForm(prev => ({ ...prev, playerName: e.target.value }))}
            css={inputStyle}
          />
        </div>
        
        <div css={fieldStyle}>
          <label>Game ID:</label>
          <input 
            value={joinForm.gameId}
            onChange={(e) => setJoinForm(prev => ({ ...prev, gameId: e.target.value }))}
            css={inputStyle}
            placeholder="Enter game ID number"
          />
        </div>
        
        <button 
          css={buttonStyle} 
          onClick={joinGame}
          disabled={isLoading}
        >
          {isLoading ? '⏳ Joining...' : '🎮 Join Game'}
        </button>
      </div>
      
      {error && <div css={errorStyle}>{error}</div>}
    </div>
  )

  const renderGame = () => {
    if (!game) {
      return (
        <div css={containerStyle}>
          <div css={loadingStyle}>
            {isLoading ? '⏳ Loading game...' : '❌ Game not found'}
          </div>
        </div>
      )
    }

    return (
      <div css={gameContainerStyle}>
        {/* Game Header */}
        <div css={gameHeaderStyle}>
          <div>
            <h2>🎮 Game {game.id}</h2>
            <div>State: {getStateText(game.state)} | Turn: {game.turnNumber}</div>
            <div>Players: {game.playerAddresses.length}/{game.maxPlayers}</div>
          </div>
          
          <div>
            <button css={refreshButtonStyle} onClick={() => loadGame(game.id)}>
              🔄 Refresh
            </button>
            <button css={backButtonStyle} onClick={() => setCurrentView('menu')}>
              ← Menu
            </button>
          </div>
        </div>

        {/* Game Controls */}
        {game.state === 0 && (
          <div css={controlsStyle}>
            <div>⏳ Game in setup phase</div>
            {blockchainGame.userAddress?.toLowerCase() === game.creator.toLowerCase() && (
              <button css={buttonStyle} onClick={startGame} disabled={isLoading}>
                {isLoading ? '⏳ Starting...' : '🚀 Start Game'}
              </button>
            )}
          </div>
        )}

        {game.state === 1 && playerInfo && (
          <div css={controlsStyle}>
            {isCurrentPlayer() ? (
              <div>
                <div css={yourTurnStyle}>🎯 Your Turn!</div>
                <div css={gameActionsStyle}>
                  {pendingMoves.length > 0 && (
                    <button css={submitButtonStyle} onClick={submitTurn} disabled={isLoading}>
                      {isLoading ? '⏳ Submitting...' : `🎯 Submit Turn (${pendingMoves.length} tiles)`}
                    </button>
                  )}
                  <button css={skipButtonStyle} onClick={skipTurn} disabled={isLoading}>
                    {isLoading ? '⏳ Skipping...' : '⏭️ Skip Turn'}
                  </button>
                </div>
              </div>
            ) : (
              <div css={waitingStyle}>⏳ Waiting for other player's turn...</div>
            )}
          </div>
        )}

        {/* Game Board */}
        <div css={boardContainerStyle}>
          <div css={boardStyle}>
            {Array.from({ length: 15 }, (_, row) =>
              Array.from({ length: 15 }, (_, col) => {
                const existingTile = placedTiles.find(t => t.x === col && t.y === row)
                const pendingTile = pendingMoves.find(m => m.x === col && m.y === row)
                
                return (
                  <div
                    key={`${row}-${col}`}
                    css={[
                      boardCellStyle,
                      (existingTile || pendingTile) && occupiedCellStyle,
                      pendingTile && pendingCellStyle
                    ]}
                    onClick={() => {
                      if (!existingTile && !pendingTile && isCurrentPlayer() && game.state === 1) {
                        placeTile(col, row)
                      }
                    }}
                  >
                    {existingTile && (
                      <div css={tileStyle}>
                        {existingTile.number}
                      </div>
                    )}
                    {pendingTile && (
                      <div css={[tileStyle, pendingTileStyle]}>
                        {pendingTile.number}
                      </div>
                    )}
                  </div>
                )
              })
            ).flat()}
          </div>
        </div>

        {/* Player Hand */}
        {playerInfo && game.state === 1 && (
          <div css={handContainerStyle}>
            <h3>Your Hand ({playerInfo.hand.length} tiles)</h3>
            <div css={handStyle}>
              {playerInfo.hand.map((tileNumber, index) => (
                <div
                  key={index}
                  css={[
                    handTileStyle,
                    selectedTile === tileNumber && selectedTileStyle
                  ]}
                  onClick={() => setSelectedTile(selectedTile === tileNumber ? null : tileNumber)}
                >
                  {tileNumber}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player Scores */}
        <div css={scoresContainerStyle}>
          <h3>Scores</h3>
          {game.playerAddresses.map((address, index) => (
            <div 
              key={address}
              css={[
                scoreItemStyle,
                index === game.currentPlayerIndex && currentPlayerScoreStyle
              ]}
            >
              <div>{address.slice(0, 6)}...{address.slice(-4)}</div>
              <div>{game.playerScores[index] || 0} pts</div>
              {index === game.currentPlayerIndex && <div css={currentPlayerIndicatorStyle}>👈</div>}
            </div>
          ))}
        </div>

        {error && <div css={errorStyle}>{error}</div>}
      </div>
    )
  }

  // Main render
  return (
    <div css={appStyle}>
      {currentView === 'menu' && renderMenu()}
      {currentView === 'create' && renderCreateForm()}
      {currentView === 'join' && renderJoinForm()}
      {currentView === 'game' && renderGame()}
    </div>
  )
}

// Styles
const appStyle = css`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

const containerStyle = css`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: white;
`

const gameContainerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: white;
`

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h1, h2 {
    margin: 0;
  }
`

const walletInfoStyle = css`
  text-align: right;
  font-size: 0.9rem;
  opacity: 0.9;
`

const menuStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
`

const formStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 400px;
  margin: 0 auto;
`

const fieldStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-weight: 500;
  }
`

const inputStyle = css`
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
`

const buttonStyle = css`
  padding: 15px 30px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const backButtonStyle = css`
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  cursor: pointer;
`

const gameHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
`

const controlsStyle = css`
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  text-align: center;
`

const yourTurnStyle = css`
  font-size: 1.2rem;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 10px;
`

const waitingStyle = css`
  font-size: 1.1rem;
  opacity: 0.8;
`

const gameActionsStyle = css`
  display: flex;
  gap: 15px;
  justify-content: center;
`

const submitButtonStyle = css`
  padding: 10px 20px;
  background: #4CAF50;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
`

const skipButtonStyle = css`
  padding: 10px 20px;
  background: #FF9800;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
`

const refreshButtonStyle = css`
  padding: 8px 16px;
  background: rgba(76, 175, 80, 0.3);
  border: 1px solid rgba(76, 175, 80, 0.5);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  margin-right: 10px;
`

const boardContainerStyle = css`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`

const boardStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 40px);
  grid-template-rows: repeat(15, 40px);
  gap: 2px;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 10px;
`

const boardCellStyle = css`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

const occupiedCellStyle = css`
  cursor: not-allowed;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

const pendingCellStyle = css`
  background: rgba(255, 193, 7, 0.3);
  border-color: rgba(255, 193, 7, 0.7);
`

const tileStyle = css`
  font-weight: bold;
  font-size: 1.2rem;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`

const pendingTileStyle = css`
  color: #FFC107;
`

const handContainerStyle = css`
  margin: 20px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  text-align: center;
`

const handStyle = css`
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
`

const handTileStyle = css`
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`

const selectedTileStyle = css`
  background: rgba(76, 175, 80, 0.5);
  border-color: #4CAF50;
  transform: translateY(-3px);
`

const scoresContainerStyle = css`
  margin: 20px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
`

const scoreItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const currentPlayerScoreStyle = css`
  background: rgba(76, 175, 80, 0.2);
  border-radius: 6px;
  padding: 8px;
  font-weight: bold;
`

const currentPlayerIndicatorStyle = css`
  font-size: 1.2rem;
`

const errorStyle = css`
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid rgba(244, 67, 54, 0.5);
  padding: 15px;
  border-radius: 8px;
  color: white;
  margin-top: 20px;
`

const loadingStyle = css`
  text-align: center;
  font-size: 1.2rem;
  padding: 50px;
` 