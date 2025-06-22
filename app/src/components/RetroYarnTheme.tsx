/** @jsxImportSource @emotion/react */
import { css, keyframes, Global } from '@emotion/react'
import { useEffect } from 'react'

// Retro Yarn World - Mr. Mosquito meets Kirby's Epic Yarn
export const RetroYarnGlobalStyles = () => (
  <Global styles={retroYarnGlobalStyles} />
)

// Floating retro elements
export function RetroYarnDecorations() {
  useEffect(() => {
    const interval = setInterval(() => {
      // PS2-era frame updates
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div css={retroDecorationsStyle}>
      <LowPolyYarnBalls />
      <PixelatedButtons />
      <GeometricStitches />
      <RetroTV />
    </div>
  )
}

// Low-poly yarn balls (Mr. Mosquito style)
function LowPolyYarnBalls() {
  const balls = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 4,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    size: 12 + Math.random() * 8,
    color: ['#A8809C', '#7A9B7A', '#8A9BC7', '#C7A89B', '#9BC78A', '#9B8AC7'][i]
  }))

  return (
    <div css={lowPolyContainerStyle}>
      {balls.map(ball => (
        <div
          key={ball.id}
          css={lowPolyBallStyle({
            delay: ball.delay,
            duration: ball.duration,
            x: ball.x,
            y: ball.y,
            size: ball.size
          })}
        >
          {/* Octagonal low-poly shape */}
          <div css={octagonShapeStyle(ball.color)} />
          <div css={pixelStrandStyle} />
        </div>
      ))}
    </div>
  )
}

// Pixelated sewing buttons
function PixelatedButtons() {
  const buttons = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    delay: Math.random() * 6,
    duration: 10 + Math.random() * 4,
    x: 15 + Math.random() * 70,
    color: ['#6B5B73', '#73705C', '#5C7073', '#73615C'][i],
    size: 8 + Math.random() * 4
  }))

  return (
    <div css={pixelButtonsContainerStyle}>
      {buttons.map(button => (
        <div
          key={button.id}
          css={pixelButtonStyle({
            delay: button.delay,
            duration: button.duration,
            x: button.x,
            color: button.color,
            size: button.size
          })}
        >
          <div css={buttonPixelHoleStyle} />
          <div css={buttonPixelHoleStyle} />
          <div css={buttonPixelHoleStyle} />
          <div css={buttonPixelHoleStyle} />
        </div>
      ))}
    </div>
  )
}

// Geometric stitching patterns
function GeometricStitches() {
  return (
    <div css={geometricStitchesStyle}>
      <div css={geometricStitchStyle({ x: 5, y: 15, width: 25, angle: 15 })} />
      <div css={geometricStitchStyle({ x: 70, y: 25, width: 20, angle: -20 })} />
      <div css={geometricStitchStyle({ x: 10, y: 75, width: 30, angle: 10 })} />
      <div css={geometricStitchStyle({ x: 75, y: 80, width: 22, angle: -15 })} />
    </div>
  )
}

// Retro TV/CRT effect
function RetroTV() {
  return (
    <div css={retroTVStyle}>
      <div css={scanLinesStyle} />
    </div>
  )
}

// Retro fabric components
export function RetroEmbroideredText({ 
  children, 
  size = '1rem', 
  color = '#6B5B73' 
}: { 
  children: React.ReactNode
  size?: string
  color?: string 
}) {
  return (
    <span css={retroEmbroideredStyle(size, color)}>
      {children}
    </span>
  )
}

export function QuiltedRetroSurface({ 
  children, 
  padding = '16px',
  color = '#D4CCC4' 
}: { 
  children: React.ReactNode
  padding?: string
  color?: string 
}) {
  return (
    <div css={quiltedRetroStyle(padding, color)}>
      {children}
    </div>
  )
}

export function PixelFabricButton({ 
  children, 
  onClick, 
  color = '#A8809C',
  disabled = false 
}: { 
  children: React.ReactNode
  onClick?: () => void
  color?: string
  disabled?: boolean 
}) {
  return (
    <button 
      css={pixelFabricButtonStyle(color, disabled)}
      onClick={onClick}
      disabled={disabled}
    >
      <span css={pixelButtonTextStyle}>
        {children}
      </span>
      <div css={pixelStitchingStyle} />
    </button>
  )
}

// ============ ANIMATIONS ============

const lowPolyFloat = keyframes`
  0%, 100% { transform: translate(0, 0) rotateX(0deg) rotateY(0deg); }
  25% { transform: translate(3px, -5px) rotateX(15deg) rotateY(5deg); }
  50% { transform: translate(-2px, -8px) rotateX(-10deg) rotateY(-5deg); }
  75% { transform: translate(5px, -3px) rotateX(5deg) rotateY(10deg); }
`

const pixelPulse = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
  50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
`

const geometricStitch = keyframes`
  0%, 100% { 
    clip-path: polygon(0% 0%, 20% 0%, 20% 100%, 0% 100%);
  }
  50% { 
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
  }
`

const scanlineMove = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
`

// ============ GLOBAL STYLES ============

const retroYarnGlobalStyles = css`
  * {
    /* Pixelated yarn ball cursor */
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect x="4" y="4" width="8" height="8" fill="%23A8809C" stroke="%236B5B73" stroke-width="2"/><rect x="6" y="6" width="4" height="4" fill="%23C7A89B"/></svg>') 8 8, auto;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
  
  button, [role="button"], .clickable {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" fill="%23D4CCC4" stroke="%236B5B73" stroke-width="2"/><rect x="6" y="6" width="2" height="2" fill="%236B5B73"/><rect x="8" y="8" width="2" height="2" fill="%236B5B73"/></svg>') 8 8, pointer;
  }
  
  body {
    /* Muted, desaturated PS2-era colors */
    background: 
      radial-gradient(circle at 30% 20%, rgba(168, 128, 156, 0.15) 0%, transparent 60%),
      radial-gradient(circle at 70% 80%, rgba(122, 155, 122, 0.15) 0%, transparent 50%),
      linear-gradient(135deg, 
        #D4CCC4 0%,   /* Muted cream */
        #C4BDB6 25%,  /* Desaturated tan */
        #CFC7C0 50%,  /* Neutral beige */
        #C0B8B1 75%,  /* Soft gray-brown */
        #D4CCC4 100%  /* Back to cream */
      );
    
    /* Pixelated fabric texture */
    background-image: 
      repeating-linear-gradient(45deg, 
        rgba(107, 91, 115, 0.08) 0px, 
        rgba(107, 91, 115, 0.08) 4px, 
        transparent 4px, 
        transparent 16px),
      repeating-linear-gradient(-45deg, 
        rgba(107, 91, 115, 0.06) 0px, 
        rgba(107, 91, 115, 0.06) 3px, 
        transparent 3px, 
        transparent 12px);
    
    background-attachment: fixed;
    min-height: 100vh;
    font-family: 'Courier New', monospace;
    color: #6B5B73;
    
    /* Subtle CRT/TV effect */
    filter: contrast(1.1) brightness(0.95);
  }
  
  /* Retro scrollbars */
  ::-webkit-scrollbar {
    width: 16px;
  }
  
  ::-webkit-scrollbar-track {
    background: 
      repeating-linear-gradient(0deg, 
        #D4CCC4 0px, 
        #D4CCC4 2px, 
        #C4BDB6 2px, 
        #C4BDB6 4px);
  }
  
  ::-webkit-scrollbar-thumb {
    background: 
      repeating-linear-gradient(0deg, 
        #6B5B73 0px, 
        #6B5B73 2px, 
        #5C4C63 2px, 
        #5C4C63 4px);
    border: 2px solid #D4CCC4;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #5C4C63;
  }
  
  /* Pixelated selection */
  ::selection {
    background: rgba(168, 128, 156, 0.6);
    color: #6B5B73;
  }
`

// ============ COMPONENT STYLES ============

const retroDecorationsStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`

const lowPolyContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const lowPolyBallStyle = ({ delay, duration, x, y, size }: {
  delay: number, duration: number, x: number, y: number, size: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}px;
  height: ${size}px;
  animation: ${lowPolyFloat} ${duration}s ease-in-out infinite;
  animation-delay: ${delay}s;
  filter: brightness(0.9);
  opacity: 0.7;
`

const octagonShapeStyle = (color: string) => css`
  width: 100%;
  height: 100%;
  background: ${color};
  clip-path: polygon(
    30% 0%, 70% 0%, 100% 30%, 100% 70%, 
    70% 100%, 30% 100%, 0% 70%, 0% 30%
  );
  border: 2px solid rgba(107, 91, 115, 0.5);
  box-shadow: 
    inset 2px 2px 4px rgba(255, 255, 255, 0.3),
    inset -2px -2px 4px rgba(0, 0, 0, 0.2);
`

const pixelStrandStyle = css`
  position: absolute;
  top: 80%;
  left: 70%;
  width: 3px;
  height: 120%;
  background: 
    repeating-linear-gradient(0deg, 
      rgba(107, 91, 115, 0.8) 0px, 
      rgba(107, 91, 115, 0.8) 2px, 
      transparent 2px, 
      transparent 4px);
  transform: rotate(30deg);
`

const pixelButtonsContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const pixelButtonStyle = ({ delay, duration, x, color, size }: {
  delay: number, duration: number, x: number, color: string, size: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: 50%;
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  animation: ${pixelPulse} ${duration}s ease-in-out infinite;
  animation-delay: ${delay}s;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  padding: 2px;
  border: 1px solid rgba(107, 91, 115, 0.6);
  clip-path: polygon(
    15% 0%, 85% 0%, 100% 15%, 100% 85%, 
    85% 100%, 15% 100%, 0% 85%, 0% 15%
  );
`

const buttonPixelHoleStyle = css`
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(107, 91, 115, 0.3);
`

const geometricStitchesStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const geometricStitchStyle = ({ x, y, width, angle }: {
  x: number, y: number, width: number, angle: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${width}%;
  height: 4px;
  background: 
    repeating-linear-gradient(90deg, 
      rgba(107, 91, 115, 0.6) 0px, 
      rgba(107, 91, 115, 0.6) 4px, 
      transparent 4px, 
      transparent 8px);
  transform: rotate(${angle}deg);
  animation: ${geometricStitch} 4s ease-in-out infinite;
  border: 1px solid rgba(107, 91, 115, 0.3);
`

const retroTVStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
`

const scanLinesStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: 
    linear-gradient(180deg, 
      transparent 0%, 
      rgba(107, 91, 115, 0.1) 50%, 
      transparent 100%);
  animation: ${scanlineMove} 8s linear infinite;
`

const retroEmbroideredStyle = (size: string, color: string) => css`
  font-size: ${size};
  font-weight: bold;
  color: ${color};
  text-shadow: 
    1px 0 0 rgba(255, 255, 255, 0.6),
    0 1px 0 rgba(0, 0, 0, 0.3),
    1px 1px 0 rgba(0, 0, 0, 0.2);
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  
  /* Pixelated text effect */
  filter: contrast(1.2);
`

const quiltedRetroStyle = (padding: string, color: string) => css`
  background: ${color};
  padding: ${padding};
  border: 3px solid rgba(107, 91, 115, 0.4);
  box-shadow: 
    inset 3px 3px 6px rgba(255, 255, 255, 0.4),
    inset -3px -3px 6px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(107, 91, 115, 0.3);
  
  /* Geometric quilted pattern */
  background-image: 
    repeating-linear-gradient(45deg, 
      rgba(107, 91, 115, 0.08) 0px, 
      rgba(107, 91, 115, 0.08) 3px, 
      transparent 3px, 
      transparent 24px),
    repeating-linear-gradient(-45deg, 
      rgba(107, 91, 115, 0.08) 0px, 
      rgba(107, 91, 115, 0.08) 3px, 
      transparent 3px, 
      transparent 24px);
  
  /* Angular corners like PS2 era */
  clip-path: polygon(
    8px 0%, 100% 0%, 100% calc(100% - 8px), 
    calc(100% - 8px) 100%, 0% 100%, 0% 8px
  );
`

const pixelFabricButtonStyle = (color: string, disabled: boolean) => css`
  background: ${color};
  border: 3px solid rgba(107, 91, 115, 0.8);
  padding: 12px 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  
  /* Angular PS2-style corners */
  clip-path: polygon(
    6px 0%, 100% 0%, 100% calc(100% - 6px), 
    calc(100% - 6px) 100%, 0% 100%, 0% 6px
  );
  
  ${disabled && css`
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(0.5);
  `}
  
  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 
      2px 2px 0 rgba(107, 91, 115, 0.8),
      inset 2px 2px 4px rgba(255, 255, 255, 0.4);
    filter: brightness(1.1);
  }
  
  &:active:not(:disabled) {
    transform: translate(0, 0);
    box-shadow: 
      inset 2px 2px 4px rgba(0, 0, 0, 0.3),
      inset -2px -2px 4px rgba(255, 255, 255, 0.3);
  }
`

const pixelButtonTextStyle = css`
  position: relative;
  z-index: 2;
  font-weight: bold;
  color: #6B5B73;
  text-shadow: 
    1px 0 0 rgba(255, 255, 255, 0.6),
    0 1px 0 rgba(0, 0, 0, 0.3);
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
`

const pixelStitchingStyle = css`
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  border: 1px solid rgba(107, 91, 115, 0.6);
  pointer-events: none;
  
  /* Pixelated stitching pattern */
  background-image: 
    repeating-linear-gradient(0deg, 
      rgba(107, 91, 115, 0.3) 0px, 
      rgba(107, 91, 115, 0.3) 1px, 
      transparent 1px, 
      transparent 4px),
    repeating-linear-gradient(90deg, 
      rgba(107, 91, 115, 0.3) 0px, 
      rgba(107, 91, 115, 0.3) 1px, 
      transparent 1px, 
      transparent 4px);
` 