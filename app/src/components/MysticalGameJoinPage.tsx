/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState, useEffect } from 'react'
import { useBlockchainGame } from '../hooks/useBlockchainGame'
import { useGameCache } from '../hooks/useGameCache'
import { NewAgeTile } from './NewAgeTile'

interface MysticalGameJoinPageProps {
  onBackToMenu: () => void
}

export function MysticalGameJoinPage({ onBackToMenu }: MysticalGameJoinPageProps) {
  const blockchainGame = useBlockchainGame()
  const [gameId, setGameId] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')
  const [isJoining, setIsJoining] = useState(false)
  const [currentGameId, setCurrentGameId] = useState<number | null>(null)
  const [gameMessage, setGameMessage] = useState('Enter a game ID to join the mystical weaving circle')
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [pendingMoves, setPendingMoves] = useState<Array<{x: number, y: number, number: number}>>([])
  
  const { 
    placedTiles, 
    currentGame, 
    playerInfo,
    allPlayersScores,
    isLoading: cacheLoading,
    error: cacheError,
    refreshData
  } = useGameCache({
    blockchainGameId: currentGameId || 0,
    contractAddress: blockchainGame.contractAddress || '',
    networkName: blockchainGame.networkName || 'Base Sepolia',
    chainId: blockchainGame.currentNetwork || 84532
  })

  useEffect(() => {
    if (cacheError) {
      setGameMessage(`Mystical connection failed: ${cacheError}`)
    }
  }, [cacheError])

  useEffect(() => {
    if (currentGameId && currentGame) {
      setGameMessage(`Connected to the mystical realm • Game ${currentGameId} • Turn ${currentGame.turnNumber}`)
    }
  }, [currentGameId, currentGame])

  const handleJoinGame = async () => {
    if (!gameId.trim() || !playerName.trim()) {
      setGameMessage('Please provide both game ID and your mystical name')
      return
    }

    if (!blockchainGame.isConnected) {
      setGameMessage('Please connect your mystical wallet first')
      return
    }

    setIsJoining(true)
    setGameMessage('Joining the mystical weaving circle...')

    try {
      const targetGameId = parseInt(gameId.trim())
      
      await blockchainGame.joinGame(targetGameId, playerName.trim())
      
      setCurrentGameId(targetGameId)
      setGameMessage(`✨ Successfully joined the mystical game ${targetGameId}!`)
      
      // Refresh game data after joining
      setTimeout(() => {
        refreshData()
      }, 2000)
      
    } catch (error: any) {
      console.error('Failed to join game:', error)
      setGameMessage(`Failed to join the mystical realm: ${error.message}`)
    } finally {
      setIsJoining(false)
    }
  }

  const handleTileSelection = (tileNumber: number) => {
    setSelectedTile(selectedTile === tileNumber ? null : tileNumber)
    setGameMessage(selectedTile === tileNumber ? 
      'Tile deselected. Choose another mystical thread.' : 
      `Selected mystical thread ${tileNumber}. Click an empty space to weave it into reality!`)
  }

  const handleBoardClick = (x: number, y: number) => {
    if (!selectedTile) {
      setGameMessage('Select a mystical thread from your hand first!')
      return
    }

    // Check if space is already occupied
    const existingTile = [...(placedTiles || []), ...pendingMoves].find(
      tile => tile.x === x && tile.y === y
    )
    
    if (existingTile) {
      setGameMessage('This space is already woven with mystical energy!')
      return
    }

    // Add to pending moves
    setPendingMoves(prev => [...prev, { x, y, number: selectedTile }])
    setSelectedTile(null)
    setGameMessage(`Mystical thread ${selectedTile} placed at (${x}, ${y}). Continue weaving or submit your pattern!`)
  }

  const handleSubmitMoves = async () => {
    if (!currentGameId || pendingMoves.length === 0) {
      setGameMessage('No mystical threads to weave!')
      return
    }

    setIsJoining(true)
    setGameMessage('Weaving your mystical pattern into the blockchain...')

    try {
      await blockchainGame.playTurn(currentGameId, pendingMoves)
      
      setPendingMoves([])
      setGameMessage('✨ Your mystical pattern has been woven into reality! Waiting for confirmation...')
      
      // Refresh game data after move
      setTimeout(() => {
        refreshData()
      }, 3000)
      
    } catch (error: any) {
      console.error('Failed to submit moves:', error)
      setGameMessage(`Failed to weave pattern: ${error.message}`)
    } finally {
      setIsJoining(false)
    }
  }

  const handleUndoMoves = () => {
    setPendingMoves([])
    setSelectedTile(null)
    setGameMessage('Mystical pattern cleared. Begin weaving anew!')
  }

  const isCurrentPlayerTurn = () => {
    return currentGame && playerInfo && blockchainGame.userAddress && 
           currentGame.playerAddresses[currentGame.currentPlayerIndex]?.toLowerCase() === blockchainGame.userAddress.toLowerCase()
  }

  const getGameStateText = (state: number) => {
    switch (state) {
      case 0: return 'Gathering Weavers'
      case 1: return 'Mystical Weaving in Progress'
      case 2: return 'Pattern Complete'
      case 3: return 'Realm Closed'
      default: return 'Unknown Realm'
    }
  }

  // Generate floating mystical particles
  const renderMysticalParticles = () => (
    <div css={mysticalParticlesStyle}>
      {Array.from({ length: 15 }, (_, i) => (
        <div
          key={i}
          css={particleStyle}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>
  )

  return (
    <div css={containerStyle}>
      {renderMysticalParticles()}
      
      <div css={headerStyle}>
        <button css={backButtonStyle} onClick={onBackToMenu}>
          ← Return to Portal
        </button>
        <h1 css={titleStyle}>Mystical Game Realm</h1>
        <div css={walletStatusStyle}>
          {blockchainGame.isConnected ? (
            <div>
              <div>✨ Wallet Connected</div>
              <div>{blockchainGame.userAddress?.slice(0, 6)}...{blockchainGame.userAddress?.slice(-4)}</div>
              <div>{blockchainGame.networkName}</div>
            </div>
          ) : (
            <div css={disconnectedStyle}>⚠️ Wallet Disconnected</div>
          )}
        </div>
      </div>

      <div css={contentStyle}>
        {/* Join Game Form */}
        {!currentGameId && (
          <div css={joinFormStyle}>
            <div css={formHeaderStyle}>
              <h2>🔮 Join a Mystical Weaving Circle</h2>
              <p>Enter the realm ID and your mystical name to begin weaving</p>
            </div>
            
            <div css={formFieldsStyle}>
              <div css={fieldStyle}>
                <label css={labelStyle}>Game Realm ID:</label>
                <input
                  css={inputStyle}
                  type="number"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="Enter game ID..."
                  disabled={isJoining}
                />
              </div>
              
              <div css={fieldStyle}>
                <label css={labelStyle}>Your Mystical Name:</label>
                <input
                  css={inputStyle}
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your weaver name..."
                  disabled={isJoining}
                />
              </div>
              
              <button
                css={joinButtonStyle}
                onClick={handleJoinGame}
                disabled={isJoining || !gameId.trim() || !playerName.trim()}
              >
                {isJoining ? '🌀 Entering Realm...' : '✨ Join Mystical Circle'}
              </button>
            </div>
          </div>
        )}

        {/* Game Board */}
        {currentGameId && currentGame && (
          <div css={gameAreaStyle}>
            <div css={gameInfoStyle}>
              <div css={gameStatsStyle}>
                <div>🎮 Game {currentGameId}</div>
                <div>🌟 {getGameStateText(currentGame.state)}</div>
                <div>🔄 Turn {currentGame.turnNumber}</div>
                <div>👥 {currentGame.playerAddresses.length}/{currentGame.maxPlayers} Weavers</div>
              </div>
              
              <div css={turnInfoStyle}>
                {isCurrentPlayerTurn() ? (
                  <div css={yourTurnStyle}>✨ Your Turn to Weave!</div>
                ) : (
                  <div css={waitingStyle}>🔮 Waiting for other weavers...</div>
                )}
              </div>
              
              <button 
                css={refreshButtonStyle} 
                onClick={refreshData}
                disabled={cacheLoading}
              >
                {cacheLoading ? '🌀' : '🔄'} Refresh Realm
              </button>
            </div>

            {/* Mystical Game Board */}
            <div css={boardContainerStyle}>
              <div css={boardGridStyle}>
                {Array.from({ length: 15 }, (_, row) =>
                  Array.from({ length: 15 }, (_, col) => {
                    const existingTile = placedTiles?.find(t => t.x === col && t.y === row)
                    const pendingTile = pendingMoves.find(m => m.x === col && m.y === row)
                    
                    return (
                      <div
                        key={`${row}-${col}`}
                        css={boardCellStyle}
                        onClick={() => {
                          if (isCurrentPlayerTurn() && currentGame.state === 1) {
                            handleBoardClick(col, row)
                          }
                        }}
                      >
                        {existingTile && (
                          <NewAgeTile
                            value={existingTile.number}
                            state="played"
                            isSelected={false}
                            onClick={() => {}}
                          />
                        )}
                        {pendingTile && (
                          <NewAgeTile
                            value={pendingTile.number}
                            state="unplayed"
                            isSelected={false}
                            onClick={() => {}}
                          />
                        )}
                        {!existingTile && !pendingTile && (
                          <div css={emptyCellStyle} />
                        )}
                      </div>
                    )
                  })
                ).flat()}
              </div>
            </div>

            {/* Player Hand */}
            {playerInfo?.hand && currentGame.state === 1 && (
              <div css={handAreaStyle}>
                <div css={handHeaderStyle}>
                  <h3>🧵 Your Mystical Threads ({playerInfo.hand.length})</h3>
                  <div css={handActionsStyle}>
                    {pendingMoves.length > 0 && (
                      <>
                        <button 
                          css={submitButtonStyle} 
                          onClick={handleSubmitMoves}
                          disabled={isJoining}
                        >
                          {isJoining ? '🌀 Weaving...' : `✨ Weave Pattern (${pendingMoves.length} threads)`}
                        </button>
                        <button 
                          css={undoButtonStyle} 
                          onClick={handleUndoMoves}
                          disabled={isJoining}
                        >
                          🔄 Clear Pattern
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div css={handContainerStyle}>
                  {playerInfo.hand.map((tileNumber, index) => (
                    <NewAgeTile
                      key={index}
                      value={tileNumber}
                      state="unplayed"
                      isSelected={selectedTile === tileNumber}
                      onClick={() => {
                        if (isCurrentPlayerTurn() && currentGame.state === 1) {
                          handleTileSelection(tileNumber)
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Player Scores */}
            {currentGame.playerScores && (
              <div css={scoresAreaStyle}>
                <h3>🏆 Weaver Scores</h3>
                <div css={scoresListStyle}>
                  {currentGame.playerAddresses.map((address, index) => (
                    <div 
                      key={address}
                      css={[
                        scoreItemStyle,
                        index === currentGame.currentPlayerIndex && activePlayerStyle
                      ]}
                    >
                      <div css={playerAddressStyle}>
                        {address.slice(0, 8)}...{address.slice(-6)}
                        {index === currentGame.currentPlayerIndex && <span css={currentIndicatorStyle}>👈</span>}
                      </div>
                      <div css={playerScoreStyle}>{currentGame.playerScores[index] || 0} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Message */}
      <div css={gameMessageStyle}>
        {gameMessage}
      </div>
    </div>
  )
}

// Styles with mystical theme
const containerStyle = css`
  min-height: 100vh;
  background: radial-gradient(
    ellipse at center,
    #1e3c3a 0%,
    #2d5a54 30%,
    #1a4a42 60%,
    #0f2e28 100%
  );
  color: #FFD700;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  overflow-x: hidden;
`

const mysticalParticlesStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`

const particleStyle = css`
  position: absolute;
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, #90EE90, #FFD700);
  border-radius: 50%;
  animation: mysticalFloat 6s ease-in-out infinite;
  
  @keyframes mysticalFloat {
    0%, 100% { 
      opacity: 0.3;
      transform: translateY(0px) scale(1);
    }
    50% { 
      opacity: 1;
      transform: translateY(-20px) scale(1.2);
    }
  }
`

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 10;
  position: relative;
`

const backButtonStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  color: #FFD700;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }
`

const titleStyle = css`
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  background: linear-gradient(45deg, #FFD700, #FFA500, #FF6347);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const walletStatusStyle = css`
  text-align: right;
  font-size: 0.9rem;
  
  > div {
    margin-bottom: 4px;
  }
`

const disconnectedStyle = css`
  color: #FF6B6B;
`

const contentStyle = css`
  padding: 40px 20px;
  max-width: 1400px;
  margin: 0 auto;
  z-index: 10;
  position: relative;
`

const joinFormStyle = css`
  max-width: 600px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  padding: 40px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`

const formHeaderStyle = css`
  text-align: center;
  margin-bottom: 30px;
  
  h2 {
    font-size: 1.8rem;
    margin: 0 0 10px 0;
    color: #FFD700;
  }
  
  p {
    color: rgba(255, 215, 0, 0.8);
    margin: 0;
  }
`

const formFieldsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const fieldStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const labelStyle = css`
  color: #FFD700;
  font-weight: 600;
  font-size: 1rem;
`

const inputStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #FFD700;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(255, 215, 0, 0.6);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 215, 0, 0.5);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const joinButtonStyle = css`
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border: none;
  border-radius: 12px;
  padding: 16px 24px;
  color: #1a4a42;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  
  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
    filter: brightness(1.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const gameAreaStyle = css`
  display: grid;
  grid-template-areas: 
    "info info"
    "board board"
    "hand hand"
    "scores scores";
  grid-template-columns: 1fr;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
`

const gameInfoStyle = css`
  grid-area: info;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
`

const gameStatsStyle = css`
  display: flex;
  gap: 30px;
  font-weight: 600;
  
  > div {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

const turnInfoStyle = css`
  display: flex;
  align-items: center;
`

const yourTurnStyle = css`
  color: #90EE90;
  font-weight: 700;
  font-size: 1.1rem;
  animation: mysticalPulse 2s ease-in-out infinite;
  
  @keyframes mysticalPulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`

const waitingStyle = css`
  color: rgba(255, 215, 0, 0.7);
  font-style: italic;
`

const refreshButtonStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  color: #FFD700;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 215, 0, 0.2);
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const boardContainerStyle = css`
  grid-area: board;
  display: flex;
  justify-content: center;
  padding: 20px;
  background: rgba(139, 69, 19, 0.1);
  border: 3px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(10px);
`

const boardGridStyle = css`
  display: grid;
  grid-template-columns: repeat(15, 40px);
  grid-template-rows: repeat(15, 40px);
  gap: 2px;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 8px;
`

const boardCellStyle = css`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    transform: scale(1.05);
  }
`

const emptyCellStyle = css`
  width: 100%;
  height: 100%;
  border: 2px dashed rgba(255, 215, 0, 0.3);
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
    background: rgba(255, 215, 0, 0.1);
  }
`

const handAreaStyle = css`
  grid-area: hand;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
`

const handHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  h3 {
    margin: 0;
    color: #FFD700;
    font-size: 1.2rem;
  }
`

const handActionsStyle = css`
  display: flex;
  gap: 12px;
`

const submitButtonStyle = css`
  background: linear-gradient(135deg, #90EE90, #32CD32);
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: #1a4a42;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(144, 238, 144, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const undoButtonStyle = css`
  background: rgba(255, 165, 0, 0.8);
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 165, 0, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const handContainerStyle = css`
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
`

const scoresAreaStyle = css`
  grid-area: scores;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  
  h3 {
    margin: 0 0 16px 0;
    color: #FFD700;
    font-size: 1.2rem;
  }
`

const scoresListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const scoreItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  transition: all 0.2s ease;
`

const activePlayerStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
`

const playerAddressStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #FFD700;
  font-weight: 600;
`

const currentIndicatorStyle = css`
  color: #90EE90;
  font-size: 1.2rem;
`

const playerScoreStyle = css`
  color: #87CEEB;
  font-weight: 700;
  font-size: 1.1rem;
`

const gameMessageStyle = css`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 12px;
  padding: 16px 24px;
  color: #FFD700;
  font-weight: 600;
  text-align: center;
  backdrop-filter: blur(15px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-width: 600px;
  min-width: 300px;
` 