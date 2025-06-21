/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState } from 'react'
import { PlayerPanels } from './panels/PlayerPanels'
import { FivesGameBoard } from './components/FivesGameBoard'
import { GameSetup, GameConfig } from './components/GameSetup'

export function GameDisplay() {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameData, setGameData] = useState({
    playerScores: [0],
    turnNumber: 1,
    tilesRemaining: 0,
    gameMessage: '',
    currentPlayerIndex: 0
  })

  const handleStartGame = (config: GameConfig) => {
    console.log('GameDisplay.handleStartGame called with:', config)
    setGameConfig(config)
    setGameStarted(true)
    console.log('Game started, gameStarted:', true, 'gameConfig:', config)
  }

  const handleBackToSetup = () => {
    setGameStarted(false)
    setGameConfig(null)
  }

  const handleGameDataUpdate = (data: typeof gameData) => {
    setGameData(data)
  }

  if (!gameStarted || !gameConfig) {
    return <GameSetup onStartGame={handleStartGame} />
  }

  return (
    <div css={gameDisplayContainerStyle}>
      <div css={mainGameAreaStyle}>
        <FivesGameBoard 
          gameConfig={gameConfig} 
          onGameDataUpdate={handleGameDataUpdate}
        />
      </div>
      <PlayerPanels 
        gameConfig={gameConfig} 
        onBackToSetup={handleBackToSetup}
        playerScores={gameData.playerScores}
        turnNumber={gameData.turnNumber}
        tilesRemaining={gameData.tilesRemaining}
        gameMessage={gameData.gameMessage}
        currentPlayerIndex={gameData.currentPlayerIndex}
      />
    </div>
  )
}

const gameDisplayContainerStyle = css`
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  font-family: 'Arial', sans-serif;
`

const mainGameAreaStyle = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 100vh;
`
