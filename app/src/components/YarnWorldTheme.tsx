/** @jsxImportSource @emotion/react */
import { css, keyframes, Global } from '@emotion/react'
import { useEffect, useState } from 'react'

// Global yarn world styling
export const YarnWorldGlobalStyles = () => (
  <Global styles={yarnWorldGlobalStyles} />
)

// Floating yarn elements component
export function YarnWorldDecorations() {
  return (
    <div css={decorationsContainerStyle}>
      <StitchSnakeBackground />
      <KnittingNeedles />
      <StitchingLines />
    </div>
  )
}

// Background yarn balls
export function YarnBallsBackground() {
  const yarnBalls = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: Math.random() * 15,
    duration: 20 + Math.random() * 10,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    size: 8 + Math.random() * 12,
    color: ['#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#FFE135', '#FF7F7F', '#F5E6D3', '#E8D5C1'][i],
    rotation: Math.random() * 360
  }))

  return (
    <div css={yarnBallsContainerStyle}>
      {yarnBalls.map(ball => (
        <div
          key={ball.id}
          css={yarnBallStyle({
            delay: ball.delay,
            duration: ball.duration,
            x: ball.x,
            y: ball.y,
            size: ball.size,
            color: ball.color,
            rotation: ball.rotation
          })}
        >
          <div css={yarnBallInnerStyle(ball.color)} />
          <div css={yarnStrandStyle} />
        </div>
      ))}
    </div>
  )
}

// Decorative knitting needles
function KnittingNeedles() {
  return (
    <div css={knittingNeedlesContainerStyle}>
      <div css={knittingNeedleStyle({ angle: 15, x: 5, y: 10 })} />
      <div css={knittingNeedleStyle({ angle: -20, x: 90, y: 15 })} />
      <div css={knittingNeedleStyle({ angle: 45, x: 10, y: 85 })} />
      <div css={knittingNeedleStyle({ angle: -35, x: 85, y: 80 })} />
    </div>
  )
}

// Floating sewing buttons
export function FloatingButtons() {
  const buttons = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: Math.random() * 8,
    duration: 12 + Math.random() * 6,
    x: 10 + Math.random() * 80,
    color: ['#8B4513', '#DAA520', '#CD853F', '#D2691E', '#A0522D', '#B8860B'][i],
    size: 4 + Math.random() * 3
  }))

  return (
    <div css={buttonsContainerStyle}>
      {buttons.map(button => (
        <div
          key={button.id}
          css={floatingButtonStyle({
            delay: button.delay,
            duration: button.duration,
            x: button.x,
            color: button.color,
            size: button.size
          })}
        >
          <div css={buttonHoleStyle} />
          <div css={buttonHoleStyle} />
        </div>
      ))}
    </div>
  )
}

// Decorative stitching lines
function StitchingLines() {
  return (
    <div css={stitchingLinesContainerStyle}>
      <div css={stitchingLineStyle({ x1: 0, y1: 20, x2: 30, y2: 25 })} />
      <div css={stitchingLineStyle({ x1: 70, y1: 10, x2: 100, y2: 15 })} />
      <div css={stitchingLineStyle({ x1: 0, y1: 75, x2: 25, y2: 80 })} />
      <div css={stitchingLineStyle({ x1: 75, y1: 85, x2: 100, y2: 90 })} />
    </div>
  )
}

// Embroidered text effect component
export function EmbroideredText({ children, size = '1rem', color = '#8B4513' }: { 
  children: React.ReactNode
  size?: string
  color?: string 
}) {
  return (
    <span css={embroideredTextStyle(size, color)}>
      {children}
    </span>
  )
}

// Quilted surface component
export function QuiltedSurface({ 
  children, 
  padding = '20px',
  color = '#F5E6D3' 
}: { 
  children: React.ReactNode
  padding?: string
  color?: string 
}) {
  return (
    <div css={quiltedSurfaceStyle(padding, color)}>
      {children}
    </div>
  )
}

// Fabric button component
export function FabricButton({ 
  children, 
  onClick, 
  color = '#FFB6C1',
  disabled = false 
}: { 
  children: React.ReactNode
  onClick?: () => void
  color?: string
  disabled?: boolean 
}) {
  return (
    <button 
      css={fabricButtonStyle(color, disabled)}
      onClick={onClick}
      disabled={disabled}
    >
      <span css={fabricButtonTextStyle}>
        {children}
      </span>
      <div css={fabricButtonStitchingStyle} />
    </button>
  )
}

// ============ ANIMATIONS ============

const gentleFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-5px) rotate(2deg); }
  50% { transform: translateY(-3px) rotate(-1deg); }
  75% { transform: translateY(-7px) rotate(1deg); }
`

const yarnBallBob = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(5px, -8px) rotate(5deg); }
  50% { transform: translate(-3px, -15px) rotate(-3deg); }
  75% { transform: translate(8px, -8px) rotate(8deg); }
`

const stitchingDance = keyframes`
  0%, 100% { stroke-dashoffset: 0; }
  50% { stroke-dashoffset: 20px; }
`

const buttonSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const needleGlint = keyframes`
  0%, 90%, 100% { opacity: 0.6; }
  95% { opacity: 1; }
`

// ============ GLOBAL STYLES ============

const yarnWorldGlobalStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap');
  * {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="8" cy="8" r="6" fill="%23FFB6C1" stroke="%238B4513" stroke-width="2"/><path d="M14 8 L20 2" stroke="%238B4513" stroke-width="3" stroke-linecap="round"/></svg>') 8 8, auto;
  }
  
  button, [role="button"], .clickable {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="8" cy="8" r="6" fill="%23DAA520" stroke="%238B4513" stroke-width="2"/><path d="M14 8 L20 2" stroke="%238B4513" stroke-width="3" stroke-linecap="round"/></svg>') 8 8, pointer;
  }
  
  body {
    background: 
      radial-gradient(circle at 25% 25%, rgba(255, 182, 193, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(152, 251, 152, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, 
        #F5E6D3 0%,   /* Cream fabric */
        #E8D5C1 25%,  /* Light tan */
        #F0E2CE 50%,  /* Warm beige */
        #E6D4C1 75%,  /* Soft brown */
        #F5E6D3 100%  /* Back to cream */
      );
    
    /* Global fabric texture */
    background-image: 
      repeating-linear-gradient(45deg, 
        rgba(139, 69, 19, 0.03) 0px, 
        rgba(139, 69, 19, 0.03) 3px, 
        transparent 3px, 
        transparent 15px),
      repeating-linear-gradient(-45deg, 
        rgba(139, 69, 19, 0.02) 0px, 
        rgba(139, 69, 19, 0.02) 2px, 
        transparent 2px, 
        transparent 12px);
    
    background-attachment: fixed;
    min-height: 100vh;
    font-family: 'Georgia', serif;
  }
  
  /* Yarn-themed scrollbars */
  ::-webkit-scrollbar {
    width: 12px;
  }
  
  ::-webkit-scrollbar-track {
    background: linear-gradient(180deg, #F5E6D3 0%, #E8D5C1 100%);
    border-radius: 6px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #8B4513 0%, #A0522D 100%);
    border-radius: 6px;
    border: 2px solid #F5E6D3;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #A0522D 0%, #8B4513 100%);
  }
  
  /* Selection styling */
  ::selection {
    background: rgba(218, 165, 32, 0.4);
    color: #8B4513;
  }
`

// ============ COMPONENT STYLES ============

const decorationsContainerStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`

const yarnBallsContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const yarnBallStyle = ({ delay, duration, x, y, size, color, rotation }: {
  delay: number, duration: number, x: number, y: number, size: number, color: string, rotation: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}px;
  height: ${size}px;
  animation: ${yarnBallBob} ${duration}s ease-in-out infinite;
  animation-delay: ${delay}s;
  transform: rotate(${rotation}deg);
  filter: blur(0.5px);
  opacity: 0.6;
  
  /* Use the color for the yarn ball glow */
  box-shadow: 0 0 ${size / 2}px ${color}40;
`

const yarnBallInnerStyle = (color: string) => css`
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 30%, ${color} 0%, rgba(255,255,255,0.3) 40%, ${color} 100%);
  border-radius: 50%;
  border: 1px solid rgba(139, 69, 19, 0.3);
  box-shadow: 
    0 2px 4px rgba(139, 69, 19, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.4);
`

const yarnStrandStyle = css`
  position: absolute;
  top: 20%;
  left: 70%;
  width: 2px;
  height: 150%;
  background: linear-gradient(180deg, rgba(139, 69, 19, 0.6) 0%, transparent 100%);
  transform: rotate(45deg);
  border-radius: 1px;
`

const knittingNeedlesContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const knittingNeedleStyle = ({ angle, x, y }: { angle: number, x: number, y: number }) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: 4px;
  height: 120px;
  background: linear-gradient(180deg, #C0C0C0 0%, #A8A8A8 50%, #C0C0C0 100%);
  border-radius: 2px 2px 8px 8px;
  transform: rotate(${angle}deg);
  animation: ${needleGlint} 4s ease-in-out infinite;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
  
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    background: radial-gradient(circle, #DAA520 0%, #B8860B 100%);
    border-radius: 50%;
  }
`

const buttonsContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const floatingButtonStyle = ({ delay, duration, x, color, size }: {
  delay: number, duration: number, x: number, color: string, size: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: 60%;
  width: ${size}px;
  height: ${size}px;
  background: radial-gradient(circle, ${color} 0%, rgba(0,0,0,0.2) 100%);
  border-radius: 50%;
  animation: 
    ${gentleFloat} ${duration}s ease-in-out infinite,
    ${buttonSpin} ${duration * 2}s linear infinite;
  animation-delay: ${delay}s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border: 1px solid rgba(139, 69, 19, 0.4);
  opacity: 0.7;
`

const buttonHoleStyle = css`
  width: 2px;
  height: 2px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
`

const stitchingLinesContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const stitchingLineStyle = ({ x1, y1, x2, y2 }: {
  x1: number, y1: number, x2: number, y2: number
}) => css`
  position: absolute;
  left: ${x1}%;
  top: ${y1}%;
  width: ${x2 - x1}%;
  height: 2px;
  background: 
    repeating-linear-gradient(90deg, 
      rgba(139, 69, 19, 0.4) 0px, 
      rgba(139, 69, 19, 0.4) 3px, 
      transparent 3px, 
      transparent 6px);
  transform: rotate(${(y2 - y1) * 2}deg);
  animation: ${stitchingDance} 3s ease-in-out infinite;
  opacity: 0.6;
`

const embroideredTextStyle = (size: string, color: string) => css`
  font-size: ${size};
  font-weight: bold;
  color: ${color};
  text-shadow: 
    1px 1px 0 rgba(255, 255, 255, 0.8),
    2px 2px 0 rgba(139, 69, 19, 0.6),
    1px 1px 4px rgba(0, 0, 0, 0.3);
  font-family: 'Georgia', serif;
  letter-spacing: 0.5px;
`

const quiltedSurfaceStyle = (padding: string, color: string) => css`
  background: ${color};
  padding: ${padding};
  border-radius: 12px;
  border: 3px solid rgba(139, 69, 19, 0.3);
  box-shadow: 
    0 8px 16px rgba(139, 69, 19, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.4),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1);
  
  /* Quilted diamond pattern */
  background-image: 
    repeating-linear-gradient(45deg, 
      rgba(139, 69, 19, 0.05) 0px, 
      rgba(139, 69, 19, 0.05) 2px, 
      transparent 2px, 
      transparent 20px),
    repeating-linear-gradient(-45deg, 
      rgba(139, 69, 19, 0.05) 0px, 
      rgba(139, 69, 19, 0.05) 2px, 
      transparent 2px, 
      transparent 20px);
`

const fabricButtonStyle = (color: string, disabled: boolean) => css`
  background: linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.1) 100%);
  border: 2px solid rgba(139, 69, 19, 0.6);
  border-radius: 8px;
  padding: 12px 24px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  
  ${disabled && css`
    opacity: 0.6;
    cursor: not-allowed;
  `}
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(139, 69, 19, 0.3);
    border-color: rgba(139, 69, 19, 0.8);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(139, 69, 19, 0.3);
  }
`

const fabricButtonTextStyle = css`
  position: relative;
  z-index: 2;
  font-weight: bold;
  color: #8B4513;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.6);
  font-family: 'Georgia', serif;
`

const fabricButtonStitchingStyle = css`
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  border: 1px dashed rgba(139, 69, 19, 0.5);
  border-radius: 4px;
  pointer-events: none;
`

// ===================== SNAKE STITCHING BACKGROUND =====================

function StitchSnakeBackground() {
  const [segments, setSegments] = useState<Array<{ x: number; y: number }>>([
    { x: 0, y: 0 }
  ])
  const [direction, setDirection] = useState<{ dx: number; dy: number }>({
    dx: 1,
    dy: 0
  })

  // Grid resolution in percentage (size of each segment)
  const cellSize = 2 // 2% of viewport per cell (50×50 grid)
  const maxX = Math.floor(100 / cellSize) - 1
  const maxY = Math.floor(100 / cellSize) - 1
  const maxLength = 60 // maximum length of the snake

  useEffect(() => {
    const interval = setInterval(() => {
      setSegments(prev => {
        const head = prev[0]
        const newHead = {
          x: (head.x + direction.dx + maxX + 1) % (maxX + 1),
          y: (head.y + direction.dy + maxY + 1) % (maxY + 1)
        }

        const next = [newHead, ...prev]
        if (next.length > maxLength) next.pop()
        return next
      })

      // Occasionally change direction (like snake turning)
      if (Math.random() < 0.1) {
        setDirection(prevDir => {
          const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
          ].filter(d => !(d.dx === -prevDir.dx && d.dy === -prevDir.dy)) // avoid 180° turn
          return dirs[Math.floor(Math.random() * dirs.length)]
        })
      }
    }, 180)

    return () => clearInterval(interval)
  }, [direction])

  return (
    <div css={snakeContainerStyle}>
      {segments.map((seg, index) => (
        <div
          key={`${seg.x}-${seg.y}-${index}`}
          css={snakeSegmentStyle({
            x: seg.x * cellSize,
            y: seg.y * cellSize,
            size: cellSize,
            opacity: 1 - index / maxLength
          })}
        />
      ))}
    </div>
  )
}

const snakeContainerStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`

const snakeSegmentStyle = ({
  x,
  y,
  size,
  opacity
}: {
  x: number
  y: number
  size: number
  opacity: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}%;
  height: ${size}%;
  border: 2px dashed rgba(139, 69, 19, ${0.6 * opacity});
  border-radius: 4px;
  opacity: ${opacity};
  box-sizing: border-box;
  transition: left 0.18s linear, top 0.18s linear;
` 