/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState } from 'react'
import { NewAgeGameBoard } from './components/NewAgeGameBoard'
import { NewAgeGameSetup } from './components/NewAgeGameSetup'
import { NewAgeTheme } from './components/NewAgeTheme'
import { BlockchainGameBoardCached } from './components/BlockchainGameBoardCached'

export interface GameConfig {
  playerCount: number
  playerNames: string[]
  tilesPerPlayer: number
  winningScore: number
  allowIslands: boolean
}

export function GameDisplay() {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [blockchainGameId, setBlockchainGameId] = useState<number | null>(null)

  const handleStartGame = (config: GameConfig, blockchainId?: number) => {
    console.log('🎮 GameDisplay.handleStartGame called with:', {
      config,
      blockchainId,
      hasBlockchainId: !!blockchainId
    })
    
    setGameConfig(config)
    setGameStarted(true)
    if (blockchainId) {
      setBlockchainGameId(blockchainId)
      console.log('✅ GameDisplay: Set blockchain game ID:', blockchainId)
    } else {
      console.log('⚠️ GameDisplay: No blockchain ID provided, will show local game')
    }
    
    console.log('🎮 GameDisplay: State updated - game should start rendering')
  }

  const handleBackToSetup = () => {
    setGameStarted(false)
    setGameConfig(null)
    setBlockchainGameId(null)
  }

  // Debug current state
  console.log('🎮 GameDisplay render state:', {
    gameStarted,
    hasGameConfig: !!gameConfig,
    blockchainGameId,
    willRenderSetup: !gameStarted || !gameConfig,
    willRenderBlockchain: !!(gameStarted && gameConfig && blockchainGameId),
    willRenderLocal: !!(gameStarted && gameConfig && !blockchainGameId)
  })

  if (!gameStarted || !gameConfig) {
    console.log('📋 GameDisplay: Rendering setup screen')
    return (
      <>
        <NewAgeTheme />
        <div css={setupContainerStyle}>
          <div css={testButtonContainerStyle}>
            <button 
              css={testButtonStyle}
              onClick={() => window.location.pathname = '/zerodev-test'}
            >
              🧪 Test ZeroDev Integration
            </button>
          </div>
          <NewAgeGameSetup onStartGame={handleStartGame} />
        </div>
      </>
    )
  }

  // Render blockchain game board if we have a blockchain game ID
  if (blockchainGameId) {
    console.log('🔗 GameDisplay: Rendering blockchain game board for game ID:', blockchainGameId)
    return (
      <>
        <NewAgeTheme />
        <div css={gameContainerStyle}>
          <BlockchainGameBoardCached 
            gameConfig={gameConfig} 
            blockchainGameId={blockchainGameId}
            onBackToSetup={handleBackToSetup}
          />
        </div>
      </>
    )
  }

  // Render local game board
  console.log('🏠 GameDisplay: Rendering local game board')
  return (
    <>
      <NewAgeTheme />
      <div css={gameContainerStyle}>
        <NewAgeGameBoard 
          gameConfig={gameConfig} 
          onBackToSetup={handleBackToSetup}
        />
      </div>
    </>
  )
}

// Clean container styles
const setupContainerStyle = css`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
`

const gameContainerStyle = css`
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
`

const testButtonContainerStyle = css`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
`

const testButtonStyle = css`
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`
