/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState } from 'react'
import { NewAgeGameBoard } from './components/NewAgeGameBoard'
import { NewAgeGameSetup } from './components/NewAgeGameSetup'
import { NewAgeTheme } from './components/NewAgeTheme'

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

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config)
    setGameStarted(true)
  }

  const handleBackToSetup = () => {
    setGameStarted(false)
    setGameConfig(null)
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
