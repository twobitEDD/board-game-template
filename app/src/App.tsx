/** @jsxImportSource @emotion/react */
import { GameDisplay } from './GameDisplay'
import { TexturePreview } from './components/TexturePreview'

export function App() {
  // Simple routing based on hash
  const showTexturePreview = window.location.hash === '#textures'
  
  if (showTexturePreview) {
    return <TexturePreview />
  }
  
  return <GameDisplay />
}
