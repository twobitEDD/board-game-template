/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState } from 'react'
import { PlayerPanels } from './panels/PlayerPanels'
import { FivesGameBoard } from './components/FivesGameBoard'
import { GameSetup, GameConfig } from './components/GameSetup'
import { RetroYarnGlobalStyles, RetroYarnDecorations, RetroEmbroideredText, QuiltedRetroSurface } from './components/RetroYarnTheme'

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
    return (
      <>
        <RetroYarnGlobalStyles />
        <RetroYarnDecorations />
        <div css={retroSetupContainerStyle}>
          <QuiltedRetroSurface padding="24px" color="#E0D8D0">
            <div css={retroSetupHeaderStyle}>
              <RetroEmbroideredText size="2.2rem" color="#6B5B73">
                🕹️ FIVES WORLD '02 🕹️
              </RetroEmbroideredText>
                             <RetroEmbroideredText size="1rem" color="#8A7B85">
                 {'> A RETRO FABRIC ADVENTURE <'}
               </RetroEmbroideredText>
              <div css={retroSubtitleStyle}>
                <RetroEmbroideredText size="0.9rem" color="#9B8C96">
                  SELECT YOUR QUILTING MODE
                </RetroEmbroideredText>
              </div>
            </div>
            <GameSetup onStartGame={handleStartGame} />
          </QuiltedRetroSurface>
        </div>
      </>
    )
  }

  return (
    <>
      <RetroYarnGlobalStyles />
      <RetroYarnDecorations />
      <div css={retroGameContainerStyle}>
        <div css={retroWorkshopStyle}>
          <div css={retroWorkshopHeaderStyle}>
            <RetroEmbroideredText size="1.6rem" color="#6B5B73">
              🏭 {gameConfig.playerNames[gameData.currentPlayerIndex]}'S WORKSHOP
            </RetroEmbroideredText>
            <div css={retroWorkshopInfoStyle}>
              <RetroEmbroideredText size="0.9rem" color="#8A7B85">
                ROUND_{gameData.turnNumber.toString().padStart(2, '0')} | PATCHES_{gameData.tilesRemaining.toString().padStart(2, '0')}
              </RetroEmbroideredText>
            </div>
          </div>
          
          <div css={gameBoardWrapperFixStyle}>
            <QuiltedRetroSurface padding="12px" color="#D4CCC4">
              <FivesGameBoard 
                gameConfig={gameConfig} 
                onGameDataUpdate={handleGameDataUpdate}
              />
            </QuiltedRetroSurface>
          </div>
          
                     <div css={retroMessageStyle}>
             <RetroEmbroideredText size="0.8rem" color="#8A7B85">
               {'> '}{gameData.gameMessage}
             </RetroEmbroideredText>
           </div>
        </div>
        
        <div css={retroCraftingPanelStyle}>
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
      </div>
    </>
  )
}

// Retro PS2 + Yarn styling
const retroSetupContainerStyle = css`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
`

const retroSetupHeaderStyle = css`
  text-align: center;
  margin-bottom: 24px;
  
  & > span:first-of-type {
    display: block;
    margin-bottom: 12px;
  }
  
  & > span:nth-of-type(2) {
    display: block;
    margin-bottom: 8px;
  }
`

const retroSubtitleStyle = css`
  margin-top: 16px;
  padding: 8px;
  background: rgba(107, 91, 115, 0.1);
  border: 2px solid rgba(107, 91, 115, 0.3);
  clip-path: polygon(
    4px 0%, 100% 0%, 100% calc(100% - 4px), 
    calc(100% - 4px) 100%, 0% 100%, 0% 4px
  );
`

const retroGameContainerStyle = css`
  width: 100vw;
  height: 100vh;
  position: relative;
  z-index: 1;
  display: flex;
  font-family: 'Courier New', monospace;
  overflow: hidden;
  
  /* Retro CRT monitor effect */
  background: 
    radial-gradient(circle at 30% 20%, rgba(168, 128, 156, 0.1) 0%, transparent 60%),
    radial-gradient(circle at 70% 80%, rgba(122, 155, 122, 0.1) 0%, transparent 50%);
  
  /* Subtle scan lines */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
      repeating-linear-gradient(0deg, 
        transparent 0px, 
        transparent 2px, 
        rgba(107, 91, 115, 0.03) 2px, 
        rgba(107, 91, 115, 0.03) 4px);
    pointer-events: none;
    z-index: 10;
  }
`

const retroWorkshopStyle = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  min-height: 100vh;
  position: relative;
  gap: 16px;
  
  /* PS2-era workshop table */
  background: 
    linear-gradient(135deg, 
      rgba(212, 204, 196, 0.9) 0%,
      rgba(196, 189, 182, 0.9) 100%);
  
  /* Pixelated wood grain */
  background-image: 
    repeating-linear-gradient(90deg, 
      rgba(107, 91, 115, 0.08) 0px, 
      rgba(107, 91, 115, 0.08) 4px, 
      transparent 4px, 
      transparent 32px);
  
  border: 3px solid rgba(107, 91, 115, 0.4);
  border-left: none;
  
  /* Angular PS2-style corners */
  clip-path: polygon(
    0% 0%, 100% 0%, 100% calc(100% - 12px), 
    calc(100% - 12px) 100%, 0% 100%
  );
  
  box-shadow: 
    inset 8px 0 16px rgba(107, 91, 115, 0.1),
    0 0 20px rgba(107, 91, 115, 0.15);
`

const retroWorkshopHeaderStyle = css`
  text-align: center;
  flex-shrink: 0; /* Prevent from shrinking */
  padding: 12px;
  background: rgba(224, 216, 208, 0.8);
  border: 2px solid rgba(107, 91, 115, 0.4);
  
  /* Retro banner style */
  clip-path: polygon(
    6px 0%, 100% 0%, 100% calc(100% - 6px), 
    calc(100% - 6px) 100%, 0% 100%, 0% 6px
  );
  
  /* Pixelated fabric texture */
  background-image: 
    repeating-linear-gradient(45deg, 
      rgba(107, 91, 115, 0.04) 0px, 
      rgba(107, 91, 115, 0.04) 2px, 
      transparent 2px, 
      transparent 12px);
`

const retroWorkshopInfoStyle = css`
  margin-top: 8px;
  opacity: 0.9;
`

const retroMessageStyle = css`
  flex-shrink: 0; /* Prevent from shrinking */
  padding: 8px;
  background: rgba(168, 128, 156, 0.2);
  border: 2px solid rgba(107, 91, 115, 0.4);
  text-align: left;
  
  /* Retro terminal style */
  clip-path: polygon(
    4px 0%, 100% 0%, 100% calc(100% - 4px), 
    calc(100% - 4px) 100%, 0% 100%, 0% 4px
  );
  
  /* Pixelated message background */
  background-image: 
    repeating-linear-gradient(0deg, 
      rgba(107, 91, 115, 0.05) 0px, 
      rgba(107, 91, 115, 0.05) 1px, 
      transparent 1px, 
      transparent 6px);
`

const retroCraftingPanelStyle = css`
  width: 280px;
  background: 
    linear-gradient(135deg, 
      rgba(212, 204, 196, 0.95) 0%,
      rgba(196, 189, 182, 0.95) 100%);
  
  /* PS2-era cabinet texture */
  background-image: 
    repeating-linear-gradient(180deg, 
      rgba(107, 91, 115, 0.1) 0px, 
      rgba(107, 91, 115, 0.1) 3px, 
      transparent 3px, 
      transparent 20px);
  
  border: 3px solid rgba(107, 91, 115, 0.4);
  border-right: none;
  
  /* Angular cabinet door */
  clip-path: polygon(
    0% 0%, calc(100% - 12px) 0%, 100% 12px, 
    100% 100%, 0% 100%
  );
  
  box-shadow: 
    inset -6px 0 12px rgba(107, 91, 115, 0.15),
    0 0 16px rgba(107, 91, 115, 0.2);
  
  position: relative;
  
  /* Retro cabinet handle */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    width: 6px;
    height: 24px;
    background: 
      linear-gradient(180deg, 
        rgba(107, 91, 115, 0.8) 0%, 
        rgba(92, 76, 99, 0.8) 100%);
    border: 1px solid rgba(107, 91, 115, 0.6);
    clip-path: polygon(
      20% 0%, 80% 0%, 100% 20%, 100% 80%, 
      80% 100%, 20% 100%, 0% 80%, 0% 20%
    );
  }
`

const gameBoardWrapperFixStyle = css`
  flex: 1; /* This will make it take all available space */
  display: flex;
  min-height: 0; /* Critical for flex children */
  
  > div {
    flex: 1;
  }
`
