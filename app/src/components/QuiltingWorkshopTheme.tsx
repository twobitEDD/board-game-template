/** @jsxImportSource @emotion/react */
import { css, keyframes, Global } from '@emotion/react'

// Quilting Workshop Theme - Inspired by cozy crafting nights
export const QuiltingWorkshopTheme = {
  colors: {
    text: '#FFF8DC',           // Cream text
    textSecondary: '#F5DEB3',  // Wheat secondary text
    accent: '#FFD700',         // Golden accent
    primary: '#8B4513',        // Saddle brown primary
    secondary: '#A0522D',      // Sienna secondary
    success: '#228B22',        // Forest green
    warning: '#DAA520',        // Goldenrod
    error: '#DC143C'           // Crimson
  },
  fonts: {
    title: "'Fredoka One', cursive",
    body: "'Quicksand', sans-serif"
  }
}

export const QuiltingWorkshopGlobalStyles = () => (
  <Global styles={quiltingWorkshopGlobalStyles} />
)

// Clean atmosphere with glowing fireflies
export function QuiltingWorkshopDecorations() {
  return (
    <div css={decorationsContainerStyle}>
      <NightSkyStars />
      <CrescentMoon />
      <FloatingFireflies />
    </div>
  )
}

// Minimal stars scattered across night sky  
function NightSkyStars() {
  const stars = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 60,
    size: 1 + Math.random() * 2,
    brightness: 0.7 + Math.random() * 0.3
  }))

  return (
    <div css={starsContainerStyle}>
      {stars.map(star => (
        <div
          key={star.id}
          css={starStyle({
            x: star.x,
            y: star.y,
            size: star.size,
            brightness: star.brightness
          })}
        />
      ))}
    </div>
  )
}



// Crescent moon in upper right
function CrescentMoon() {
  return (
    <div css={moonContainerStyle}>
      <div css={moonStyle} />
    </div>
  )
}

// Warm glowing fireflies floating around
function FloatingFireflies() {
  const fireflies = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: Math.random() * 15,
    duration: 6 + Math.random() * 8,
    x: 15 + Math.random() * 70,
    y: 20 + Math.random() * 60,
    size: 2 + Math.random() * 3,
    warmth: Math.random() > 0.5 ? 'warm' : 'golden'
  }))

  return (
    <div css={firefliesContainerStyle}>
      {fireflies.map(firefly => (
        <div
          key={firefly.id}
          css={fireflyStyle({
            delay: firefly.delay,
            duration: firefly.duration,
            x: firefly.x,
            y: firefly.y,
            size: firefly.size,
            warmth: firefly.warmth
          })}
        />
      ))}
    </div>
  )
}



// Quilting-themed text component
export function QuiltingText({ 
  children, 
  size = '1rem', 
  style = 'normal'
}: { 
  children: React.ReactNode
  size?: string
  style?: 'normal' | 'title' | 'score'
}) {
  return (
    <span css={quiltingTextStyle(size, style)}>
      {children}
    </span>
  )
}

// Wooden quilting surface component
export function WoodenQuiltingSurface({ 
  children, 
  padding = '20px'
}: { 
  children: React.ReactNode
  padding?: string
}) {
  return (
    <div css={woodenSurfaceStyle(padding)}>
      <div css={ropeFrameStyle} />
      {children}
    </div>
  )
}

// Quilting button component
export function QuiltingButton({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: { 
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean 
}) {
  return (
    <button 
      css={quiltingButtonStyle(variant, disabled)}
      onClick={onClick}
      disabled={disabled}
    >
      <span css={quiltingButtonTextStyle}>
        {children}
      </span>
      <div css={quiltingButtonStitchingStyle} />
    </button>
  )
}

// ============ ANIMATIONS ============

const fireflyGlow = keyframes`
  0%, 100% { 
    transform: scale(1) translate(0, 0); 
    opacity: 0.6; 
    box-shadow: 0 0 8px currentColor;
  }
  25% { 
    transform: scale(1.3) translate(5px, -8px); 
    opacity: 1; 
    box-shadow: 0 0 15px currentColor;
  }
  50% { 
    transform: scale(0.9) translate(-3px, -12px); 
    opacity: 0.8; 
    box-shadow: 0 0 12px currentColor;
  }
  75% { 
    transform: scale(1.1) translate(8px, -5px); 
    opacity: 1; 
    box-shadow: 0 0 10px currentColor;
  }
`





// ============ GLOBAL STYLES ============

const quiltingWorkshopGlobalStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One:wght@400&family=Quicksand:wght@400;600;700&display=swap');
  
  body {
    background: 
      /* Warm cozy night sky matching reference */
      linear-gradient(180deg, 
        #2d1810 0%,     /* Deep warm brown night sky */
        #3d2415 30%,    /* Mid warm brown */
        #4a2c18 60%,    /* Lighter warm brown */
        #3d2415 100%    /* Back to deep warm brown */
      );
    
    background-attachment: fixed;
    min-height: 100vh;
    font-family: 'Quicksand', sans-serif;
    color: #F5E6A3; /* Warm cream color */
  }
  
  /* Warm quilting scrollbars */
  ::-webkit-scrollbar {
    width: 12px;
  }
  
  ::-webkit-scrollbar-track {
    background: linear-gradient(180deg, #8B4513 0%, #A0522D 100%);
    border-radius: 6px;
    border: 1px solid rgba(255, 215, 0, 0.3);
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #DAA520 0%, #B8860B 100%);
    border-radius: 6px;
    border: 1px solid #8B4513;
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.4);
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #FFD700 0%, #DAA520 100%);
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
  }
  
  /* Selection styling */
  ::selection {
    background: rgba(255, 215, 0, 0.3);
    color: #F5E6A3;
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





const quiltingTextStyle = (size: string, style: string) => css`
  font-size: ${size};
  font-weight: ${style === 'title' ? '700' : style === 'score' ? '600' : '400'};
  color: ${style === 'title' ? '#FFD700' : style === 'score' ? '#DAA520' : '#F5E6A3'};
  text-shadow: 
    ${style === 'title' 
      ? '0 0 10px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.8)' 
      : '0 0 5px rgba(255, 215, 0, 0.5), 1px 1px 2px rgba(139, 69, 19, 0.6)'
    };
  font-family: ${style === 'title' ? "'Fredoka One', cursive" : "'Quicksand', sans-serif"};
  letter-spacing: ${style === 'title' ? '2px' : '0.5px'};
`

const woodenSurfaceStyle = (padding: string) => css`
  background: 
    /* Clean wooden board */
    linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #8B4513 100%);
  padding: ${padding};
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(255, 215, 0, 0.1);
  
  /* Subtle wood grain */
  background-image: 
    repeating-linear-gradient(90deg, 
      rgba(139, 69, 19, 0.2) 0px, 
      rgba(139, 69, 19, 0.2) 1px, 
      transparent 1px, 
      transparent 6px);
  background-size: 8px 8px;
`

const ropeFrameStyle = css`
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  border: 3px solid rgba(210, 105, 30, 0.6);
  border-radius: 6px;
  pointer-events: none;
`

const quiltingButtonStyle = (variant: string, disabled: boolean) => css`
  background: linear-gradient(135deg, 
    ${variant === 'primary' ? '#DAA520' : '#8B4513'} 0%, 
    ${variant === 'primary' ? '#B8860B' : '#A0522D'} 100%);
  border: 2px solid ${variant === 'primary' ? '#FFD700' : '#D2691E'};
  border-radius: 8px;
  padding: 10px 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  font-family: 'Quicksand', sans-serif;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  
  ${disabled && css`
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(0.3);
  `}
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(218, 165, 32, 0.4);
    border-color: ${variant === 'primary' ? '#FFD700' : '#DAA520'};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0px);
    box-shadow: 0 3px 8px rgba(218, 165, 32, 0.4);
  }
`

const quiltingButtonTextStyle = css`
  position: relative;
  z-index: 2;
  font-weight: 600;
  color: #F5E6A3;
  text-shadow: 1px 1px 2px rgba(139, 69, 19, 0.8);
  font-family: 'Quicksand', sans-serif;
`

const quiltingButtonStitchingStyle = css`
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  border: 1px dashed rgba(245, 230, 163, 0.4);
  border-radius: 4px;
  pointer-events: none;
`

// Night sky star styles
const starsContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const firefliesContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const fireflyStyle = ({ delay, duration, x, y, size, warmth }: {
  delay: number, duration: number, x: number, y: number, size: number, warmth: string
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}px;
  height: ${size}px;
  background: ${warmth === 'warm' ? '#FFD700' : '#FFA500'};
  border-radius: 50%;
  animation: ${fireflyGlow} ${duration}s ease-in-out infinite;
  animation-delay: ${delay}s;
  box-shadow: 0 0 ${size * 3}px currentColor;
`

const starStyle = ({ x, y, size, brightness }: {
  x: number, y: number, size: number, brightness: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}px;
  height: ${size}px;
  background: #FFD700;
  border-radius: 50%;
  opacity: ${brightness};
  box-shadow: 0 0 ${size * 2}px rgba(255, 215, 0, 0.6);
`



// Crescent moon styles
const moonContainerStyle = css`
  position: absolute;
  top: 15%;
  right: 15%;
  width: 60px;
  height: 60px;
`

const moonStyle = css`
  width: 100%;
  height: 100%;
  background: #FFD700;
  border-radius: 50%;
  position: relative;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  
  /* Crescent shape */
  &::before {
    content: '';
    position: absolute;
    top: 5px;
    right: 8px;
    width: 70%;
    height: 70%;
    background: rgba(45, 80, 22, 0.9);
    border-radius: 50%;
  }
`