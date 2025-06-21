/** @jsxImportSource @emotion/react */
import { FivesOptionsSpec } from '../../rules/src/FivesOptions'
import { FivesRules } from '../../rules/src/FivesRules'
import { FivesSetup } from '../../rules/src/FivesSetup'
import { GameProvider, setupTranslation } from '@gamepark/react-game'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { gameAnimations } from './animations/GameAnimations'
import { App } from './App'
import { Locators } from './locators/Locators'
import { Material } from './material/Material'
import translations from './translations.json'

setupTranslation(translations, { debug: false })

ReactDOM.render(
  <StrictMode>
    <GameProvider
      game="fives"
      Rules={FivesRules}
      optionsSpec={FivesOptionsSpec}
      GameSetup={FivesSetup}
      material={Material}
      locators={Locators}
      animations={gameAnimations}
    >
      <App />
    </GameProvider>
  </StrictMode>,
  document.getElementById('root')
)
