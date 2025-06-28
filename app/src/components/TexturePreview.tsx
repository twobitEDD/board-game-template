/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState, useCallback } from 'react'
import { YarnTextureGenerator } from './TextureGenerator'
import { NumberTileId, GameParkUtils } from '../gamepark'

interface TextureData {
  dataUrl: string
  pattern: string
  color: string
  name: string
}

export function TexturePreview() {
  const [generatedTextures, setGeneratedTextures] = useState<TextureData[]>([])

  // Fabric data from your existing NumberTile component
  const fabricTypes = [
    { id: NumberTileId.Zero, name: 'Cream Wool', primary: '#F5F5DC', pattern: 'plain' as const },
    { id: NumberTileId.One, name: 'Rose Cotton', primary: '#FFB6C1', pattern: 'ribbed' as const },
    { id: NumberTileId.Two, name: 'Sage Linen', primary: '#98FB98', pattern: 'cable' as const },
    { id: NumberTileId.Three, name: 'Sunshine Yarn', primary: '#FFE135', pattern: 'seed' as const },
    { id: NumberTileId.Four, name: 'Coral Mohair', primary: '#FF7F7F', pattern: 'moss' as const },
    { id: NumberTileId.Five, name: 'Lavender Silk', primary: '#DDA0DD', pattern: 'lace' as const },
    { id: NumberTileId.Six, name: 'Sky Cashmere', primary: '#87CEEB', pattern: 'fisherman' as const },
    { id: NumberTileId.Seven, name: 'Forest Alpaca', primary: '#228B22', pattern: 'aran' as const },
    { id: NumberTileId.Eight, name: 'Violet Merino', primary: '#8A2BE2', pattern: 'fair-isle' as const },
    { id: NumberTileId.Nine, name: 'Golden Angora', primary: '#DAA520', pattern: 'intarsia' as const },
  ]

  const handleTextureGenerated = useCallback((dataUrl: string, pattern: string, color: string) => {
    const fabricType = fabricTypes.find(f => f.primary === color)
    if (fabricType) {
      const textureData: TextureData = {
        dataUrl,
        pattern,
        color,
        name: fabricType.name
      }
      
      setGeneratedTextures(prev => {
        const filtered = prev.filter(t => t.name !== textureData.name)
        return [...filtered, textureData]
      })
    }
  }, [])

  const downloadTexture = (texture: TextureData) => {
    const link = document.createElement('a')
    link.download = `${texture.name.toLowerCase().replace(/\s+/g, '-')}-${texture.pattern}.png`
    link.href = texture.dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAllTextures = () => {
    generatedTextures.forEach((texture, index) => {
      setTimeout(() => downloadTexture(texture), index * 200)
    })
  }

  const saveTexturesToPublic = async () => {
    console.log('Generated textures ready for export:')
    generatedTextures.forEach(texture => {
      console.log(`${texture.name} (${texture.pattern}):`, texture.dataUrl)
    })
    
    // This would typically be handled by a backend service
    alert('Check the console for texture data URLs. You can save these as PNG files in app/public/textures/')
  }

  return (
    <div css={containerStyle}>
      <div css={headerStyle}>
        <h2>🧶 Yarn Texture Generator</h2>
        <p>Generated procedural yarn textures for your game tiles</p>
      </div>

      <div css={generatorGridStyle}>
        {fabricTypes.map(fabric => (
          <div key={fabric.id} css={textureItemStyle}>
            <h4>{fabric.name}</h4>
            <YarnTextureGenerator
              color={fabric.primary}
              pattern={fabric.pattern}
              size={128}
              onTextureGenerated={handleTextureGenerated}
            />
            <p css={patternLabelStyle}>{fabric.pattern}</p>
          </div>
        ))}
      </div>

      {generatedTextures.length > 0 && (
        <div css={controlsStyle}>
          <h3>Generated Textures ({generatedTextures.length})</h3>
          <div css={buttonGroupStyle}>
            <button css={downloadButtonStyle} onClick={downloadAllTextures}>
              📥 Download All Textures
            </button>
            <button css={saveButtonStyle} onClick={saveTexturesToPublic}>
              💾 Export for Game
            </button>
          </div>
          
          <div css={textureGridStyle}>
            {generatedTextures.map((texture, index) => (
              <div key={index} css={texturePreviewStyle}>
                <img 
                  src={texture.dataUrl} 
                  alt={texture.name}
                  css={textureImageStyle}
                />
                <div css={textureInfoStyle}>
                  <strong>{texture.name}</strong>
                  <span>{texture.pattern}</span>
                  <button 
                    css={smallButtonStyle}
                    onClick={() => downloadTexture(texture)}
                  >
                    ⬇️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div css={usageStyle}>
        <h3>🎯 How to Use These Textures</h3>
        <ol>
          <li><strong>Download textures</strong> using the buttons above</li>
          <li><strong>Save them</strong> to <code>app/public/textures/</code></li>
          <li><strong>Update NumberTile.tsx</strong> to use <code>background-image: url('/textures/...')</code></li>
          <li><strong>Enable texture mapping</strong> in your tile rendering</li>
        </ol>
        
        <div css={codeExampleStyle}>
          <h4>Example CSS Integration:</h4>
          <pre>{`// In NumberTile.tsx
background-image: url('/textures/rose-cotton-ribbed.png');
background-size: cover;
background-repeat: repeat;`}</pre>
        </div>
      </div>
    </div>
  )
}

const containerStyle = css`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f5dc 0%, #e6e6fa 100%);
  min-height: 100vh;
`

const headerStyle = css`
  text-align: center;
  margin-bottom: 30px;
  
  h2 {
    color: #8B4513;
    font-size: 2.5rem;
    margin-bottom: 10px;
  }
  
  p {
    color: #654321;
    font-size: 1.1rem;
  }
`

const generatorGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`

const textureItemStyle = css`
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  border: 2px solid rgba(139, 69, 19, 0.3);
  
  h4 {
    margin: 0 0 10px 0;
    color: #8B4513;
    font-size: 0.9rem;
  }
`

const patternLabelStyle = css`
  margin: 8px 0 0 0;
  font-size: 0.8rem;
  color: #654321;
  font-style: italic;
`

const controlsStyle = css`
  background: rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  
  h3 {
    color: #8B4513;
    margin-bottom: 15px;
  }
`

const buttonGroupStyle = css`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`

const downloadButtonStyle = css`
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
    transform: translateY(-2px);
  }
`

const saveButtonStyle = css`
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background: linear-gradient(135deg, #F57C00 0%, #FF9800 100%);
    transform: translateY(-2px);
  }
`

const textureGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
`

const texturePreviewStyle = css`
  background: white;
  border-radius: 8px;
  padding: 8px;
  border: 1px solid rgba(139, 69, 19, 0.2);
`

const textureImageStyle = css`
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
  image-rendering: pixelated;
`

const textureInfoStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  
  strong {
    font-size: 0.8rem;
    color: #8B4513;
  }
  
  span {
    font-size: 0.7rem;
    color: #654321;
    font-style: italic;
  }
`

const smallButtonStyle = css`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: #45a049;
  }
`

const usageStyle = css`
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 20px;
  
  h3 {
    color: #8B4513;
    margin-bottom: 15px;
  }
  
  ol {
    color: #654321;
    line-height: 1.6;
  }
  
  code {
    background: rgba(139, 69, 19, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
`

const codeExampleStyle = css`
  margin-top: 20px;
  
  h4 {
    color: #8B4513;
    margin-bottom: 10px;
  }
  
  pre {
    background: #2d2d2d;
    color: #f8f8f2;
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
  }
` 