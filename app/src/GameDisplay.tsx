/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState } from 'react'
import { NewAgeGameBoard } from './components/NewAgeGameBoard'
import { NewAgeGameSetup } from './components/NewAgeGameSetup'
import { NewAgeTheme } from './components/NewAgeTheme'
import { BlockchainGameBoard } from './components/BlockchainGameBoard'

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
    setGameConfig(config)
    setGameStarted(true)
    if (blockchainId) {
      setBlockchainGameId(blockchainId)
    }
  }

  const handleBackToSetup = () => {
    setGameStarted(false)
    setGameConfig(null)
    setBlockchainGameId(null)
  }

  if (!gameStarted || !gameConfig) {
    return (
      <>
        <NewAgeTheme />
        <div css={setupContainerStyle}>
          <NewAgeGameSetup onStartGame={handleStartGame} />
        </div>
      </>
    )
  }

  // Render blockchain game board if we have a blockchain game ID
  if (blockchainGameId) {
    return (
      <>
        <NewAgeTheme />
        <div css={gameContainerStyle}>
          <BlockchainGameBoard 
            gameConfig={gameConfig} 
            blockchainGameId={blockchainGameId}
            onBackToSetup={handleBackToSetup}
          />
        </div>
      </>
    )
  }

  // Render local game board
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
