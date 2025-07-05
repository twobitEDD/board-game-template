/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useCallback } from 'react'
import { css, keyframes } from '@emotion/react'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { GameSpectator } from './GameSpectator'
import { GamePlayer } from './GamePlayer'
import { NewAgeGameBoard } from './NewAgeGameBoard'
import { Navigation } from './Navigation'

interface GameControllerProps {
  gameId: number
  onExit?: () => void
  autoJoin?: boolean // Auto-join as player if possible, otherwise spectate
}

interface GameState {
  id: number
  state: number // 0=setup, 1=playing, 2=completed, 3=cancelled
  playerAddresses: string[]
  playerScores: number[]
  playerNames: string[]
  currentPlayerIndex: number
  turnNumber: number
  maxPlayers: number
  creator: string
  isLoading: boolean
  error: string | null
  tilesRemaining: number
  lastUpdate: number
}

interface PlayerRole {
  isPlayer: boolean
  isSpectator: boolean
  canMakeMove: boolean
  playerIndex: number | null
  address: string | null
}

export function GameController({ gameId, onExit, autoJoin = false }: GameControllerProps) {
  const [gameState, setGameState] = useState<GameState>({
    id: gameId,
    state: 0,
    playerAddresses: [],
    playerScores: [],
    playerNames: [],
    currentPlayerIndex: 0,
    turnNumber: 1,
    maxPlayers: 2,
    creator: '',
    isLoading: true,
    error: null,
    tilesRemaining: 100,
    lastUpdate: Date.now()
  })
  
  const [playerRole, setPlayerRole] = useState<PlayerRole>({
    isPlayer: false,
    isSpectator: true,
    canMakeMove: false,
    playerIndex: null,
    address: null
  })

  // Hook usage
  const blockchainGame = useBlockchainGame()

  // Real-time sync configuration
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState(Date.now())

  // Auto-join state
  const [isJoining, setIsJoining] = useState(false)
  const [joinAttempted, setJoinAttempted] = useState(false)
  
  // Force refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // NewAgeGameBoard configuration
  const [showNewAgeBoard, setShowNewAgeBoard] = useState(false)
  const [gameConfig, setGameConfig] = useState({
    playerCount: 1,
    playerNames: ['Player 1'],
    tilesPerPlayer: 50,
    allowIslands: false,
    winningScore: 500
  })

  // Create game config from blockchain game state
  const createGameConfigFromState = (state: GameState) => {
    return {
      playerCount: state.maxPlayers,
      playerNames: state.playerNames,
      tilesPerPlayer: 50, // Default
      allowIslands: false, // Default
      winningScore: 500 // Default
    }
  }

  // Update game config when game state changes
  useEffect(() => {
    if (gameState && gameState.id) {
      setGameConfig(createGameConfigFromState(gameState))
    }
  }, [gameState])

  // 🔄 NEW: Re-evaluate player role when game state changes
  useEffect(() => {
    if (gameState && gameState.id && !gameState.isLoading) {
      console.log('🔄 GameController: Re-evaluating player role after game state change:', {
        currentPlayerIndex: gameState.currentPlayerIndex,
        turnNumber: gameState.turnNumber,
        playerAddresses: gameState.playerAddresses
      })
      updatePlayerRole(gameState)
    }
  }, [gameState.currentPlayerIndex, gameState.turnNumber, gameState.playerAddresses])

  // Handle game state change callback from child components
  const handleGameStateChange = useCallback(() => {
    console.log(`🔄 GameController: Game state change requested, triggering refresh...`)
    setRefreshTrigger(prev => prev + 1)
  }, [])

  /**
   * Auto-join game when conditions are met
   */
  const attemptAutoJoin = useCallback(async (game: GameState) => {
    if (!autoJoin || joinAttempted || isJoining) return
    if (game.state !== 0 || game.playerAddresses.length >= game.maxPlayers) return
    if (!blockchainGame.userAddress) return

    // Check if user is already a player
    const walletAddress = blockchainGame.userAddress.toLowerCase()
    const isAlreadyPlayer = game.playerAddresses.some(addr => addr.toLowerCase() === walletAddress)
    if (isAlreadyPlayer) return

    setIsJoining(true)
    setJoinAttempted(true)
    
    try {
      console.log(`🚀 GameController: Auto-joining game ${game.id}...`)
      
      // Use a default player name
      const playerName = `Player ${game.playerAddresses.length + 1}`
      
      await blockchainGame.joinGame(game.id, playerName)
      
      console.log(`✅ GameController: Successfully auto-joined game ${game.id}`)
      
      // Reload game state after joining
      setTimeout(() => {
        console.log(`🔄 GameController: Reloading game state after auto-join...`)
        // This will trigger useEffect and reload the game
        setJoinAttempted(false) // Reset so we can check role again
      }, 2000)
      
    } catch (error) {
      console.error(`❌ GameController: Auto-join failed:`, error)
      setGameState(prev => ({
        ...prev,
        error: `Failed to join game: ${error.message}`
      }))
    } finally {
      setIsJoining(false)
    }
  }, [autoJoin, joinAttempted, isJoining, blockchainGame, gameId])

  /**
   * Fetch complete game state from blockchain using the blockchain hook
   */
  const fetchGameState = useCallback(async (): Promise<GameState | null> => {
    try {
      console.log(`🔍 Fetching game ${gameId} from blockchain...`)
      
      // Use the blockchain hook to get all games, then find ours
      const allGames = await blockchainGame.getAllGames()
      const game = allGames.find(g => g.id === gameId)
      
      if (!game) {
        console.warn(`⚠️ Game ${gameId} not found in blockchain games`)
        return null
      }
      
      console.log(`✅ Found game ${gameId}:`, {
        state: game.state,
        players: game.playerAddresses.length,
        maxPlayers: game.maxPlayers,
        turnNumber: game.turnNumber,
        scores: game.playerScores
      })

      return {
        id: game.id,
        state: game.state,
        playerAddresses: game.playerAddresses,
        playerScores: game.playerScores,
        playerNames: game.playerAddresses.map((addr, i) => `Player ${i + 1}`), // Generate display names
        currentPlayerIndex: game.currentPlayerIndex,
        turnNumber: game.turnNumber,
        maxPlayers: game.maxPlayers,
        creator: game.creator,
        isLoading: false,
        error: null,
        tilesRemaining: game.tilesRemaining,
        lastUpdate: Date.now()
      }
      
    } catch (error) {
      console.error('Failed to fetch game state:', error)
      return null
    }
  }, [gameId, blockchainGame])

  /**
   * Determine player role and permissions
   */
  const updatePlayerRole = useCallback((game: GameState) => {
    const walletAddress = blockchainGame.userAddress?.toLowerCase()
    
    console.log('🔍 === PLAYER ROLE DEBUG ===')
    console.log('  User wallet address:', walletAddress)
    console.log('  Game player addresses:', game.playerAddresses.map(addr => addr.toLowerCase()))
    console.log('  Address comparison:', game.playerAddresses.map(addr => ({
      gameAddr: addr.toLowerCase(),
      userAddr: walletAddress,
      matches: addr.toLowerCase() === walletAddress
    })))
    console.log('🔍 === END PLAYER ROLE DEBUG ===')
    
    if (!walletAddress) {
      // No wallet connected - spectator only
      setPlayerRole({
        isPlayer: false,
        isSpectator: true,
        canMakeMove: false,
        playerIndex: null,
        address: null
      })
      return
    }

    // Check if wallet address is in the game
    const playerIndex = game.playerAddresses.findIndex(
      addr => addr.toLowerCase() === walletAddress
    )

    if (playerIndex >= 0) {
      // User is a player in this game
      const canMakeMove = game.currentPlayerIndex === playerIndex && game.state === 1
      
      console.log('✅ User is Player', playerIndex + 1, canMakeMove ? '(Your Turn!)' : '(Waiting)')
      
      setPlayerRole({
        isPlayer: true,
        isSpectator: false,
        canMakeMove,
        playerIndex,
        address: walletAddress
      })
    } else {
      // User is not a player - spectate
      console.log('👁️ User is Spectator')
      setPlayerRole({
        isPlayer: false,
        isSpectator: true,
        canMakeMove: false,
        playerIndex: null,
        address: walletAddress
      })
    }
  }, [blockchainGame.userAddress])

  /**
   * Initial game state load - Wait for blockchain connection
   */
  useEffect(() => {
    let mounted = true // Prevent state updates if component unmounts
    
    const loadGame = async () => {
      if (!mounted) return
      
      console.log(`🔍 GameController: Loading game ${gameId}...`)
      console.log(`🔍 GameController: autoJoin flag is: ${autoJoin}`)
      console.log(`🔍 GameController: URL path: ${window.location.pathname}`)
      console.log(`🔍 GameController: Blockchain connection state:`, {
        isConnected: blockchainGame.isConnected,
        contractAddress: blockchainGame.contractAddress,
        currentNetwork: blockchainGame.currentNetwork,
        userAddress: blockchainGame.userAddress
      })
      
      // Wait for blockchain connection to be ready
      if (!blockchainGame.isConnected || !blockchainGame.contractAddress) {
        console.log(`⏳ GameController: Waiting for blockchain connection...`)
        setGameState(prev => ({ 
          ...prev, 
          isLoading: true, 
          error: null 
        }))
        return // Will retry when connection state changes
      }
      
      setGameState(prev => ({ ...prev, isLoading: true, error: null }))
      
      try {
        console.log(`📞 GameController: Calling getAllGames()...`)
        console.log(`🔍 GameController: Looking for gameId ${gameId} (type: ${typeof gameId})`)
        console.log(`🔍 GameController: Blockchain connection:`, {
          isConnected: blockchainGame.isConnected,
          currentNetwork: blockchainGame.currentNetwork,
          contractAddress: blockchainGame.contractAddress,
          userAddress: blockchainGame.userAddress
        })
        
        // Use the blockchain hook to get all games, then find ours
        const allGames = await blockchainGame.getAllGames()
        console.log(`📊 GameController: getAllGames() returned ${allGames?.length || 0} games:`, allGames)
        console.log(`🔍 GameController: Games with details:`, allGames?.map(g => ({
          id: g.id,
          idType: typeof g.id,
          state: g.state,
          creator: g.creator,
          playerCount: g.playerAddresses.length,
          maxPlayers: g.maxPlayers
        })))
        
        const game = allGames.find(g => g.id === gameId)
        
        if (!mounted) return // Check again after async operation
        
        if (game) {
          const gameState = {
            id: game.id,
            state: game.state,
            playerAddresses: game.playerAddresses,
            playerScores: game.playerScores,
            playerNames: game.playerAddresses.map((addr, i) => `Player ${i + 1}`),
            currentPlayerIndex: game.currentPlayerIndex,
            turnNumber: game.turnNumber,
            maxPlayers: game.maxPlayers,
            creator: game.creator,
            isLoading: false,
            error: null,
            tilesRemaining: game.tilesRemaining,
            lastUpdate: Date.now()
          }
          
          setGameState(gameState)
          
          console.log(`🔍 GameController: Game loaded successfully:`, {
            gameId: gameState.id,
            state: gameState.state,
            playerAddresses: gameState.playerAddresses,
            creator: gameState.creator,
            maxPlayers: gameState.maxPlayers,
            autoJoin: autoJoin
          })
          
          // Check if we should attempt auto-join
          if (autoJoin && !isJoining && !joinAttempted) {
            const walletAddress = blockchainGame.userAddress?.toLowerCase()
            const isAlreadyPlayer = gameState.playerAddresses.some(addr => addr.toLowerCase() === walletAddress)
            const hasSpace = gameState.playerAddresses.length < gameState.maxPlayers
            const isSetup = gameState.state === 0
            
            console.log(`🎯 GameController: Auto-join check:`, {
              autoJoin,
              walletAddress,
              isAlreadyPlayer,
              hasSpace,
              isSetup,
              playerCount: gameState.playerAddresses.length,
              maxPlayers: gameState.maxPlayers,
              playerAddresses: gameState.playerAddresses
            })
            
            if (!isAlreadyPlayer && hasSpace && isSetup && walletAddress) {
              console.log(`🚀 GameController: Attempting auto-join...`)
              attemptAutoJoin(gameState)
              return // Exit early, don't set player role yet
            }
          }
          
          // Update player role
          updatePlayerRole(gameState)
          
          console.log(`✅ GameController: Successfully loaded game ${gameId}:`, { 
            state: gameState.state, 
            players: gameState.playerAddresses.length,
            turn: gameState.turnNumber,
            playerAddresses: gameState.playerAddresses,
            scores: gameState.playerScores
          })
        } else {
          const errorMsg = `Game ${gameId} not found or invalid (searched ${allGames?.length || 0} games)`
          console.error(`❌ GameController: ${errorMsg}`)
          console.error(`📋 GameController: Available games:`, allGames?.map(g => ({ id: g.id, state: g.state, players: g.playerAddresses?.length })))
          setGameState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMsg
          }))
        }
      } catch (error) {
        if (!mounted) return
        
        console.error('❌ GameController: Failed to load game:', error)
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          error: `Failed to load game: ${error.message}`
        }))
      }
    }

    loadGame()
    
    return () => {
      mounted = false
    }
  }, [
    gameId, 
    isJoining, 
    joinAttempted, 
    blockchainGame.isConnected, 
    blockchainGame.contractAddress,
    blockchainGame.currentNetwork,
    autoJoin,
    refreshTrigger
  ]) // Add blockchain connection state and refresh trigger to dependencies

  /**
   * Get role status display
   */
  const getRoleStatus = () => {
    if (isJoining) {
      return { text: '🚀 Joining Game...', color: '#FF9800', pulse: true }
    }
    if (playerRole.isPlayer && playerRole.canMakeMove) {
      return { text: '🎮 Your Turn!', color: '#4CAF50', pulse: true }
    } else if (playerRole.isPlayer) {
      return { text: '🎮 Player (Waiting)', color: '#2196F3', pulse: false }
    } else {
      return { text: '👁️ Spectator', color: '#9C27B0', pulse: false }
    }
  }

  const roleStatus = getRoleStatus()

  // Check if user can join as a player
  const canJoinAsPlayer = () => {
    return (
      !playerRole.isPlayer && // Not already a player
      gameState.state === 0 && // Game in setup
      gameState.playerAddresses.length < gameState.maxPlayers && // Has space
      blockchainGame.userAddress && // User has wallet connected
      !isJoining // Not currently joining
    )
  }

  // Handle manual join game
  const handleManualJoin = async () => {
    if (!canJoinAsPlayer()) return

    setIsJoining(true)
    try {
      console.log(`🎮 GameController: Manual join game ${gameState.id}...`)
      
      // Use a default player name
      const playerName = `Player ${gameState.playerAddresses.length + 1}`
      
      await blockchainGame.joinGame(gameState.id, playerName)
      
      console.log(`✅ GameController: Successfully joined game ${gameState.id}`)
      
      // Reload game state after joining
      setTimeout(() => {
        console.log(`🔄 GameController: Reloading game state after manual join...`)
        // Reset join attempted flag so we can check role again
        setJoinAttempted(false)
      }, 2000)
      
    } catch (error) {
      console.error(`❌ GameController: Manual join failed:`, error)
      setGameState(prev => ({
        ...prev,
        error: `Failed to join game: ${error.message}`
      }))
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div css={containerStyle}>
      {/* Role Status Indicator */}
      <div css={roleIndicatorStyle(roleStatus.color, roleStatus.pulse)}>
        {roleStatus.text}
        {playerRole.playerIndex !== null && ` (P${playerRole.playerIndex + 1})`}
      </div>

      {/* Navigation Header with Wallet Connection */}
      <Navigation currentPage="game" showWalletButton={true} />
      
      {/* Game Info Header */}
      <div css={gameInfoHeaderStyle}>
        <div css={gameInfoLeftStyle}>
          <h1 css={gameTitleStyle}>
            🎮 Game {gameState.id}
            <span css={gameStatusStyle}>
              {gameState.state === 0 ? '⏳ Setup' : 
               gameState.state === 1 ? '🎮 Playing' : 
               gameState.state === 2 ? '🏆 Completed' : '❌ Cancelled'}
            </span>
          </h1>
        </div>
        
        <div css={gameInfoRightStyle}>
          <div css={gameInfoStyle}>
            <div>Turn: {gameState.turnNumber}</div>
            <div>Players: {gameState.playerAddresses.length}/{gameState.maxPlayers}</div>
            <div>Tiles: {gameState.tilesRemaining}</div>
          </div>
          
          {/* Join Game Button */}
          {canJoinAsPlayer() && (
            <button css={joinGameButtonStyle} onClick={handleManualJoin}>
              🎮 Join Game
            </button>
          )}
          
          {onExit && (
            <button css={exitButtonStyle} onClick={onExit}>
              ← Back to Gallery
            </button>
          )}
        </div>
      </div>

      {/* Main Game Board */}
      <div css={gameBoardContainerStyle}>
        {isJoining ? (
          <div css={joiningOverlayStyle}>
            <div css={joiningContentStyle}>
              <div css={spinnerStyle}>🚀</div>
              <div>Joining game as Player {gameState.playerAddresses.length + 1}...</div>
              <div css={joiningSubtextStyle}>Please confirm the transaction in your wallet</div>
            </div>
          </div>
        ) : playerRole.isPlayer ? (
          (() => {
            console.log(`🎮 GameController: Rendering GamePlayer for player ${playerRole.playerIndex}`)
            return (
              <GamePlayer 
                gameId={gameState.id} 
                playerIndex={playerRole.playerIndex!}
                canMakeMove={playerRole.canMakeMove}
                gameData={gameState}
                userAddress={blockchainGame.userAddress}
                onGameStateChange={handleGameStateChange}
              />
            )
          })()
        ) : (
          (() => {
            console.log(`👁️ GameController: Rendering GameSpectator (not a player)`)
            return (
              <GameSpectator 
                gameId={gameState.id} 
                compact={false}
              />
            )
          })()
        )}
      </div>



      {/* Loading/Error States */}
      {gameState.isLoading && blockchainGame.isConnected && (
        <div css={loadingOverlayStyle}>
          <div css={loadingContentStyle}>
            <div css={spinnerStyle}>🔄</div>
            <div>Loading game state...</div>
          </div>
        </div>
      )}

      {gameState.error && (
        <div css={errorOverlayStyle}>
          <div css={errorContentStyle}>
            <div>❌ Error</div>
            <div>{gameState.error}</div>
            {onExit && (
              <button css={errorButtonStyle} onClick={onExit}>
                Back to Gallery
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div css={debugStyle}>
          <strong>🔧 Debug Info:</strong><br/>
          Game: {gameId} | State: {gameState.state} | Turn: {gameState.turnNumber}<br/>
          Role: {playerRole.isPlayer ? '🎮 Player' : '👁️ Spectator'} 
          {playerRole.canMakeMove && ' (Your Turn!)'}<br/>
          AutoJoin: {autoJoin ? 'Yes' : 'No'} | Joining: {isJoining ? 'Yes' : 'No'}<br/>
          Last Sync: {new Date(lastSyncTime).toLocaleTimeString()}<br/>
          <strong>🌐 Connection Status:</strong><br/>
          Network: {blockchainGame.currentNetwork || 'None'} | Connected: {blockchainGame.isConnected ? 'Yes' : 'No'}<br/>
          Contract: {blockchainGame.contractAddress ? blockchainGame.contractAddress.slice(0, 8) + '...' : 'None'}<br/>
          Wallet: {blockchainGame.userAddress ? blockchainGame.userAddress.slice(0, 8) + '...' : 'None'}
        </div>
      )}

      {/* Game Content */}
      {showNewAgeBoard ? (
        <NewAgeGameBoard 
          gameConfig={gameConfig}
          onBackToSetup={() => setShowNewAgeBoard(false)}
          blockchainGameId={gameId}
          mode={gameState ? 'blockchain' : 'local'}
        />
      ) : (
        <div css={gameContentStyle}>
          {/* Rest of existing game content */}
        </div>
      )}
    </div>
  )
}

const containerStyle = css`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
`

const roleIndicatorStyle = (color: string, pulse: boolean) => css`
  position: fixed;
  top: 80px; /* Below the Navigation component */
  left: 50%;
  transform: translateX(-50%);
  background: ${color};
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  z-index: 1002;
  animation: ${pulse ? 'pulse 1.5s infinite' : 'none'};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  
  @keyframes pulse {
    0% { opacity: 0.8; transform: translateX(-50%) scale(1); }
    50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
    100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
  }
`

const gameInfoHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  margin-top: 70px; /* Space for Navigation component */
`

const gameInfoLeftStyle = css`
  flex: 1;
`

const gameInfoRightStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`

const gameTitleStyle = css`
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 12px;
`

const gameStatusStyle = css`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: normal;
`

const gameInfoStyle = css`
  text-align: right;
  font-size: 0.8rem;
  opacity: 0.8;
  line-height: 1.4;
`

const walletStatusStyle = css`
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.4);
  border-radius: 8px;
  padding: 8px 12px;
  margin-right: 12px;
`

const walletStatusTextStyle = css`
  color: #FFC107;
  font-weight: bold;
  font-size: 0.9rem;
`



const exitButtonStyle = css`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`

const joinGameButtonStyle = css`
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: 1px solid rgba(76, 175, 80, 0.5);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
  
  &:hover {
    background: linear-gradient(135deg, #45a049, #3d8b40);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
    opacity: 0.6;
  }
`

const gameBoardContainerStyle = css`
  flex: 1;
  overflow: hidden;
  position: relative;
`

const joiningOverlayStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const joiningContentStyle = css`
  text-align: center;
  color: white;
  font-size: 1.2rem;
`

const joiningSubtextStyle = css`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 12px;
`

const walletConnectHintStyle = css`
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const actionsPanelStyle = (canMakeMove: boolean) => css`
  background: rgba(255, 255, 255, ${canMakeMove ? '0.15' : '0.1'});
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px 24px;
  color: white;
  
  ${canMakeMove && css`
    animation: glow 2s ease-in-out infinite alternate;
    
    @keyframes glow {
      from { box-shadow: 0 0 5px rgba(76, 175, 80, 0.3); }
      to { box-shadow: 0 0 20px rgba(76, 175, 80, 0.6); }
    }
  `}
`

const activeActionsStyle = css`
  h3 {
    margin: 0 0 12px 0;
    color: #4CAF50;
    font-size: 1.1rem;
  }
`

const actionButtonsStyle = css`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const actionButtonStyle = (color: string) => css`
  background: ${color};
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`

const waitingActionsStyle = css`
  text-align: center;
  opacity: 0.7;
  
  div:first-child {
    font-size: 1.1rem;
    margin-bottom: 4px;
  }
`

const waitingTextStyle = css`
  font-size: 0.9rem;
  opacity: 0.8;
`

const loadingOverlayStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const loadingContentStyle = css`
  text-align: center;
  color: white;
  font-size: 1.2rem;
`

const errorOverlayStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const errorContentStyle = css`
  background: white;
  color: #333;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  
  div:first-child {
    font-size: 1.5rem;
    margin-bottom: 12px;
  }
  
  div:nth-child(2) {
    margin-bottom: 20px;
    line-height: 1.5;
  }
`

const errorButtonStyle = css`
  background: #2196F3;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
`

const spinnerStyle = css`
  font-size: 2rem;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

const debugStyle = css`
  position: fixed;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-family: monospace;
  z-index: 1000;
  max-width: 300px;
`

const gameContentStyle = css`
  /* Add any additional styles for the game content section */
`