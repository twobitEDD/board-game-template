/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useRef, useEffect } from 'react'

interface YarnTextureProps {
  color: string
  pattern: 'plain' | 'ribbed' | 'cable' | 'seed' | 'moss' | 'lace' | 'fisherman' | 'aran' | 'fair-isle' | 'intarsia'
  size?: number
  onTextureGenerated?: (dataUrl: string, pattern: string, color: string) => void
}

export function YarnTextureGenerator({ color, pattern, size = 128, onTextureGenerated }: YarnTextureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    generateYarnTexture()
  }, [color, pattern, size])

  const generateYarnTexture = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Base yarn color
    const baseColor = color
    const lightColor = lightenColor(color, 0.3)
    const darkColor = darkenColor(color, 0.2)

    switch (pattern) {
      case 'plain':
        drawPlainKnit(ctx, size, baseColor, lightColor, darkColor)
        break
      case 'ribbed':
        drawRibbedKnit(ctx, size, baseColor, darkColor)
        break
      case 'cable':
        drawCableKnit(ctx, size, baseColor, lightColor, darkColor)
        break
      case 'seed':
        drawSeedStitch(ctx, size, baseColor, lightColor)
        break
      case 'moss':
        drawMossStitch(ctx, size, baseColor, lightColor)
        break
      case 'lace':
        drawLacePattern(ctx, size, baseColor, darkColor)
        break
      case 'fisherman':
        drawFishermanKnit(ctx, size, baseColor, lightColor, darkColor)
        break
      case 'aran':
        drawAranPattern(ctx, size, baseColor, lightColor, darkColor)
        break
      case 'fair-isle':
        drawFairIslePattern(ctx, size, baseColor)
        break
      case 'intarsia':
        drawIntarsiaPattern(ctx, size, baseColor, lightColor)
        break
    }

    // Add yarn fiber texture overlay
    addFiberTexture(ctx, size)

    // Export texture
    if (onTextureGenerated) {
      const dataUrl = canvas.toDataURL('image/png')
      onTextureGenerated(dataUrl, pattern, color)
    }
  }

  const drawPlainKnit = (ctx: CanvasRenderingContext2D, size: number, base: string, light: string, dark: string) => {
    const stitchWidth = 8
    const stitchHeight = 6

    for (let y = 0; y < size; y += stitchHeight) {
      for (let x = 0; x < size; x += stitchWidth) {
        // Knit stitch shape
        ctx.fillStyle = base
        ctx.fillRect(x, y, stitchWidth, stitchHeight)
        
        // Stitch definition
        ctx.fillStyle = dark
        ctx.fillRect(x, y, stitchWidth, 1)
        ctx.fillRect(x, y + stitchHeight - 1, stitchWidth, 1)
        
        // Highlight
        ctx.fillStyle = light
        ctx.fillRect(x + 1, y + 1, stitchWidth - 2, 1)
      }
    }
  }

  const drawRibbedKnit = (ctx: CanvasRenderingContext2D, size: number, base: string, dark: string) => {
    const ribWidth = 4

    for (let x = 0; x < size; x += ribWidth * 2) {
      // Knit ribs
      ctx.fillStyle = base
      ctx.fillRect(x, 0, ribWidth, size)
      
      // Purl ribs
      ctx.fillStyle = darkenColor(base, 0.1)
      ctx.fillRect(x + ribWidth, 0, ribWidth, size)
      
      // Rib definition
      ctx.fillStyle = dark
      ctx.fillRect(x + ribWidth - 1, 0, 1, size)
      ctx.fillRect(x + ribWidth, 0, 1, size)
    }
  }

  const drawCableKnit = (ctx: CanvasRenderingContext2D, size: number, base: string, light: string, dark: string) => {
    // Background
    ctx.fillStyle = base
    ctx.fillRect(0, 0, size, size)

    const cableWidth = 16
    const centerX = size / 2

    // Cable twist
    for (let y = 0; y < size; y += 20) {
      // Left cable
      ctx.beginPath()
      ctx.strokeStyle = dark
      ctx.lineWidth = 3
      ctx.moveTo(centerX - cableWidth, y)
      ctx.quadraticCurveTo(centerX, y + 10, centerX + cableWidth, y + 20)
      ctx.stroke()

      // Right cable
      ctx.beginPath()
      ctx.strokeStyle = light
      ctx.lineWidth = 2
      ctx.moveTo(centerX + cableWidth, y)
      ctx.quadraticCurveTo(centerX, y + 10, centerX - cableWidth, y + 20)
      ctx.stroke()
    }
  }

  const drawSeedStitch = (ctx: CanvasRenderingContext2D, size: number, base: string, light: string) => {
    const stitchSize = 4

    for (let y = 0; y < size; y += stitchSize) {
      for (let x = 0; x < size; x += stitchSize) {
        const isKnit = (x + y) % (stitchSize * 2) < stitchSize
        ctx.fillStyle = isKnit ? base : darkenColor(base, 0.15)
        ctx.fillRect(x, y, stitchSize, stitchSize)
        
        if (isKnit) {
          ctx.fillStyle = light
          ctx.fillRect(x + 1, y + 1, 1, 1)
        }
      }
    }
  }

  const drawMossStitch = (ctx: CanvasRenderingContext2D, size: number, base: string, light: string) => {
    // Similar to seed but with offset pattern
    const stitchSize = 4

    for (let y = 0; y < size; y += stitchSize) {
      for (let x = 0; x < size; x += stitchSize) {
        const row = Math.floor(y / stitchSize)
        const isKnit = row % 2 === 0 ? (x + y) % (stitchSize * 2) < stitchSize : (x + y) % (stitchSize * 2) >= stitchSize
        ctx.fillStyle = isKnit ? base : darkenColor(base, 0.15)
        ctx.fillRect(x, y, stitchSize, stitchSize)
        
        if (isKnit) {
          ctx.fillStyle = light
          ctx.fillRect(x + 1, y + 1, 1, 1)
        }
      }
    }
  }

  const drawLacePattern = (ctx: CanvasRenderingContext2D, size: number, base: string, dark: string) => {
    // Background
    ctx.fillStyle = base
    ctx.fillRect(0, 0, size, size)

    // Lace holes
    const holeSize = 6
    const spacing = 16

    for (let y = spacing; y < size; y += spacing) {
      for (let x = spacing; x < size; x += spacing) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.beginPath()
        ctx.arc(x, y, holeSize / 2, 0, Math.PI * 2)
        ctx.fill()
        
        // Hole shadow
        ctx.fillStyle = dark
        ctx.beginPath()
        ctx.arc(x + 1, y + 1, holeSize / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const drawFishermanKnit = (ctx: CanvasRenderingContext2D, size: number, base: string, light: string, dark: string) => {
    drawCableKnit(ctx, size, base, light, dark) // Similar to cable
  }

  const drawAranPattern = (ctx: CanvasRenderingContext2D, size: number, base: string, light: string, dark: string) => {
    drawCableKnit(ctx, size, base, light, dark) // Complex Aran pattern
  }

  const drawFairIslePattern = (ctx: CanvasRenderingContext2D, size: number, base: string) => {
    // Colorwork pattern
    const patternSize = 8
    
    for (let y = 0; y < size; y += patternSize) {
      for (let x = 0; x < size; x += patternSize) {
        const useSecondColor = (Math.floor(x / patternSize) + Math.floor(y / patternSize)) % 2
        ctx.fillStyle = useSecondColor ? lightenColor(base, 0.4) : base
        ctx.fillRect(x, y, patternSize, patternSize)
      }
    }
  }

  const drawIntarsiaPattern = (ctx: CanvasRenderingContext2D, size: number, base: string, light: string) => {
    // Gradient intarsia effect
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, base)
    gradient.addColorStop(0.5, light)
    gradient.addColorStop(1, base)
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  const addFiberTexture = (ctx: CanvasRenderingContext2D, size: number) => {
    // Add random fiber texture
    const imageData = ctx.getImageData(0, 0, size, size)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20
      data[i] = Math.max(0, Math.min(255, data[i] + noise))     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)) // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)) // B
    }

    ctx.putImageData(imageData, 0, 0)
  }

  const lightenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '')
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount))
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount))
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const darkenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '')
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount))
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount))
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  return (
    <div css={generatorStyle}>
      <canvas 
        ref={canvasRef}
        css={canvasStyle}
        width={size}
        height={size}
      />
    </div>
  )
}

const generatorStyle = css`
  display: inline-block;
  margin: 4px;
  border: 2px solid #8B4513;
  border-radius: 8px;
  overflow: hidden;
`

const canvasStyle = css`
  display: block;
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
` 