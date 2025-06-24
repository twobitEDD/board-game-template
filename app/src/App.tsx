/** @jsxImportSource @emotion/react */
import { GameDisplay } from './GameDisplay'
import { TexturePreview } from './components/TexturePreview'
import { NewAgeDisplay } from './NewAgeDisplay'
import { RulesPage } from './components/RulesPage'

function App() {
  // Simple routing based on pathname
  const showTexturePreview = window.location.hash === '#textures'
  const showNewAge = window.location.pathname.includes('/new-age')
  const showRules = window.location.pathname.includes('/rules')
  
  if (showTexturePreview) {
    return <TexturePreview />
  }
  
  if (showNewAge) {
    return <NewAgeDisplay />
  }
  
  if (showRules) {
    return <RulesPage onBackToGame={() => window.history.back()} />
  }
  
  return <GameDisplay />
}

export default App
