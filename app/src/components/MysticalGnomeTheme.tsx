/** @jsxImportSource @emotion/react */
import { css, keyframes, Global } from '@emotion/react'

// Mystical Hemp Gnome Workshop - Inspired by ERGnomes.io
export const MysticalGnomeGlobalStyles = () => (
  <Global styles={mysticalGnomeGlobalStyles} />
)

// Floating mystical elements
export function MysticalGnomeDecorations() {
  return (
    <div css={decorationsContainerStyle}>
      <FloatingHempLeaves />
      <MagicalFireflies />
      <EnchantedMist />
      <GnomeHouses />
      <ForestMushrooms />
      <MossyStones />
    </div>
  )
}

// Natural hemp leaves floating
function FloatingHempLeaves() {
  const leaves = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 25,
    duration: 20 + Math.random() * 15,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    size: 15 + Math.random() * 20,
    rotation: Math.random() * 360,
    leafType: Math.floor(Math.random() * 3)
  }))

  return (
    <div css={leavesContainerStyle}>
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          css={hempLeafStyle({
            delay: leaf.delay,
            duration: leaf.duration,
            x: leaf.x,
            y: leaf.y,
            size: leaf.size,
            rotation: leaf.rotation
          })}
        >
          <div css={leafBladeStyle(leaf.leafType)} />
        </div>
      ))}
    </div>
  )
}

// Magical fireflies/light particles
function MagicalFireflies() {
  const fireflies = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 20,
    duration: 8 + Math.random() * 12,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    size: 2 + Math.random() * 4,
    color: ['#FFD700', '#FFA500', '#FFFF88', '#90EE90', '#87CEEB'][i % 5]
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
            color: firefly.color
          })}
        />
      ))}
    </div>
  )
}

// Enchanted forest mist
function EnchantedMist() {
  return (
    <div css={mistContainerStyle}>
      <div css={mistLayerStyle({ x: 15, y: 70, delay: 0, opacity: 0.3 })} />
      <div css={mistLayerStyle({ x: 60, y: 80, delay: 8, opacity: 0.2 })} />
      <div css={mistLayerStyle({ x: 35, y: 85, delay: 15, opacity: 0.25 })} />
    </div>
  )
}

// Gnome houses with glowing windows
function GnomeHouses() {
  const houses = [
    { x: 85, y: 15, size: 25, windowColor: '#FFB347' },
    { x: 12, y: 25, size: 20, windowColor: '#FF6B6B' },
    { x: 75, y: 75, size: 18, windowColor: '#98FB98' }
  ]

  return (
    <div css={housesContainerStyle}>
      {houses.map((house, i) => (
        <div
          key={i}
          css={gnomeHouseStyle({
            x: house.x,
            y: house.y,
            size: house.size
          })}
        >
          <div css={houseDoorStyle} />
          <div css={houseWindowStyle(house.windowColor)} />
          <div css={houseRoofStyle} />
        </div>
      ))}
    </div>
  )
}

// Beautiful forest mushrooms
function ForestMushrooms() {
  const mushrooms = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 60 + Math.random() * 35,
    size: 12 + Math.random() * 15,
    capColor: ['#DC143C', '#FF6347', '#8B0000', '#B22222', '#9370DB'][i % 5],
    delay: Math.random() * 10
  }))

  return (
    <div css={mushroomsContainerStyle}>
      {mushrooms.map(mushroom => (
        <div
          key={mushroom.id}
          css={forestMushroomStyle({
            x: mushroom.x,
            y: mushroom.y,
            size: mushroom.size,
            delay: mushroom.delay
          })}
        >
          <div css={mushroomStemStyle} />
          <div css={mushroomCapStyle(mushroom.capColor)} />
          <div css={mushroomSpotStyle} />
          <div css={mushroomSpotStyle} />
          <div css={mushroomSpotStyle} />
          <div css={mushroomGlowStyle(mushroom.capColor)} />
        </div>
      ))}
    </div>
  )
}

// Mossy stones scattered around
function MossyStones() {
  const stones = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    y: 70 + Math.random() * 25,
    size: 8 + Math.random() * 12,
    mossIntensity: 0.3 + Math.random() * 0.4
  }))

  return (
    <div css={stonesContainerStyle}>
      {stones.map(stone => (
        <div
          key={stone.id}
          css={mossyStoneStyle({
            x: stone.x,
            y: stone.y,
            size: stone.size,
            mossIntensity: stone.mossIntensity
          })}
        />
      ))}
    </div>
  )
}

// Mystical text component
export function EnchantedText({ 
  children, 
  size = '1rem', 
  color = '#E8E8E8' 
}: { 
  children: React.ReactNode
  size?: string
  color?: string 
}) {
  return (
    <span css={enchantedTextStyle(size, color)}>
      {children}
    </span>
  )
}

// Hemp yarn surface component
export function HempYarnSurface({ 
  children, 
  padding = '20px',
  color = '#2C5530' 
}: { 
  children: React.ReactNode
  padding?: string
  color?: string 
}) {
  return (
    <div css={hempYarnSurfaceStyle(padding, color)}>
      <div css={hempFibersOverlayStyle} />
      {children}
    </div>
  )
}

// Mystical button component
export function MysticalButton({ 
  children, 
  onClick, 
  color = '#4A6741',
  disabled = false 
}: { 
  children: React.ReactNode
  onClick?: () => void
  color?: string
  disabled?: boolean 
}) {
  return (
    <button 
      css={mysticalButtonStyle(color, disabled)}
      onClick={onClick}
      disabled={disabled}
    >
      <span css={mysticalButtonTextStyle}>
        {children}
      </span>
      <div css={mysticalButtonAuraStyle} />
    </button>
  )
}

// ============ ANIMATIONS ============

const leafDrift = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(12px, -8px) rotate(45deg); }
  50% { transform: translate(-6px, -15px) rotate(90deg); }
  75% { transform: translate(10px, -12px) rotate(135deg); }
`

const fireflyDance = keyframes`
  0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.7; }
  25% { transform: scale(1.2) translate(8px, -10px); opacity: 1; }
  50% { transform: scale(0.8) translate(-5px, -15px); opacity: 0.8; }
  75% { transform: scale(1.1) translate(12px, -8px); opacity: 1; }
`

const mistFlow = keyframes`
  0% { 
    transform: translateX(0px) scale(1); 
    opacity: 0.2; 
  }
  50% {
    transform: translateX(30px) scale(1.2);
    opacity: 0.4;
  }
  100% { 
    transform: translateX(60px) scale(1.1); 
    opacity: 0.1; 
  }
`

const windowGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(255, 179, 71, 0.6); }
  50% { box-shadow: 0 0 15px rgba(255, 179, 71, 0.9); }
`

const mushroomPulse = keyframes`
  0%, 100% { 
    transform: scale(1); 
    filter: drop-shadow(0 0 5px rgba(220, 20, 60, 0.4));
  }
  50% { 
    transform: scale(1.05); 
    filter: drop-shadow(0 0 12px rgba(220, 20, 60, 0.7));
  }
`

// ============ GLOBAL STYLES ============

const mysticalGnomeGlobalStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Griffy:wght@400&family=Creepster&display=swap');
  
  * {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="7" cy="7" r="5" fill="%23FFD700" stroke="%23654321" stroke-width="2"/><path d="M12 7 L18 1" stroke="%23654321" stroke-width="3" stroke-linecap="round"/><circle cx="7" cy="7" r="2" fill="%23FFA500"/></svg>') 7 7, auto;
  }
  
  button, [role="button"], .clickable {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="7" cy="7" r="5" fill="%23FFB347" stroke="%23654321" stroke-width="2"/><path d="M12 7 L18 1" stroke="%23654321" stroke-width="3" stroke-linecap="round"/><circle cx="7" cy="7" r="2" fill="%23FF6B47"/></svg>') 7 7, pointer;
  }
  
  body {
    background: 
      radial-gradient(circle at 30% 30%, rgba(64, 224, 208, 0.2) 0%, transparent 60%),
      radial-gradient(circle at 70% 70%, rgba(72, 209, 204, 0.15) 0%, transparent 50%),
      linear-gradient(135deg, 
        #20B2AA 0%,     /* Light sea green */
        #48D1CC 25%,    /* Medium turquoise */
        #40E0D0 50%,    /* Turquoise */
        #48D1CC 75%,    /* Medium turquoise */
        #20B2AA 100%    /* Light sea green */
      );
    
    /* Forest floor texture */
    background-image: 
      repeating-linear-gradient(45deg, 
        rgba(74, 103, 65, 0.1) 0px, 
        rgba(74, 103, 65, 0.1) 3px, 
        transparent 3px, 
        transparent 18px),
      repeating-linear-gradient(-30deg, 
        rgba(139, 69, 19, 0.08) 0px, 
        rgba(139, 69, 19, 0.08) 2px, 
        transparent 2px, 
        transparent 25px),
      radial-gradient(circle at 30% 70%, rgba(34, 85, 136, 0.1) 0%, transparent 60%);
    
    background-attachment: fixed;
    min-height: 100vh;
    font-family: 'Griffy', cursive;
    color: #E8E8E8;
  }
  
  /* Mystical forest scrollbars */
  ::-webkit-scrollbar {
    width: 14px;
  }
  
  ::-webkit-scrollbar-track {
    background: linear-gradient(180deg, #2C4A2C 0%, #1B2F1B 100%);
    border-radius: 7px;
    border: 1px solid rgba(255, 215, 0, 0.3);
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #74A374 0%, #4A6741 100%);
    border-radius: 7px;
    border: 2px solid #2C4A2C;
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.4);
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #8FBC8F 0%, #6B8E23 100%);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
  }
  
  /* Selection styling */
  ::selection {
    background: rgba(255, 215, 0, 0.3);
    color: #E8E8E8;
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

const leavesContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const hempLeafStyle = ({ delay, duration, x, y, size, rotation }: {
  delay: number, duration: number, x: number, y: number, size: number, rotation: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}px;
  height: ${size}px;
  animation: ${leafDrift} ${duration}s ease-in-out infinite;
  animation-delay: ${delay}s;
  transform: rotate(${rotation}deg);
  opacity: 0.7;
`

const leafBladeStyle = (leafType: number) => css`
  width: 100%;
  height: 100%;
  background: ${leafType === 0 
    ? 'linear-gradient(45deg, #228B22 0%, #32CD32 50%, #006400 100%)'
    : leafType === 1
    ? 'linear-gradient(45deg, #2E8B57 0%, #3CB371 50%, #008B00 100%)'
    : 'linear-gradient(45deg, #6B8E23 0%, #9ACD32 50%, #556B2F 100%)'
  };
  
  /* Hemp leaf shape */
  clip-path: polygon(
    50% 0%, 60% 35%, 98% 35%, 68% 57%, 
    79% 91%, 50% 70%, 21% 91%, 32% 57%, 
    2% 35%, 40% 35%
  );
  
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
`

const firefliesContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const fireflyStyle = ({ delay, duration, x, y, size, color }: {
  delay: number, duration: number, x: number, y: number, size: number, color: string
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}px;
  height: ${size}px;
  background: radial-gradient(circle, ${color} 0%, transparent 70%);
  border-radius: 50%;
  animation: ${fireflyDance} ${duration}s ease-in-out infinite;
  animation-delay: ${delay}s;
  box-shadow: 
    0 0 ${size * 2}px ${color}80,
    0 0 ${size * 4}px ${color}40;
`

const mistContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const mistLayerStyle = ({ x, y, delay, opacity }: { 
  x: number, y: number, delay: number, opacity: number 
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: 150px;
  height: 40px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(176, 196, 222, ${opacity}) 50%,
    transparent 100%);
  border-radius: 50%;
  animation: ${mistFlow} 25s ease-in-out infinite;
  animation-delay: ${delay}s;
  filter: blur(3px);
`

const housesContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const gnomeHouseStyle = ({ x, y, size }: { x: number, y: number, size: number }) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}px;
  height: ${size}px;
`

const houseDoorStyle = css`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30%;
  height: 40%;
  background: linear-gradient(180deg, #8B4513 0%, #654321 100%);
  border-radius: 50% 50% 0 0;
  border: 1px solid #4A2C17;
`

const houseWindowStyle = (color: string) => css`
  position: absolute;
  top: 25%;
  right: 20%;
  width: 25%;
  height: 25%;
  background: ${color};
  border-radius: 50%;
  border: 2px solid #654321;
  animation: ${windowGlow} 3s ease-in-out infinite;
  box-shadow: 0 0 8px ${color}80;
`

const houseRoofStyle = css`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 60%;
  background: linear-gradient(135deg, #8FBC8F 0%, #556B2F 100%);
  border-radius: 50% 50% 20% 20%;
  border: 2px solid #6B8E23;
  
  /* Moss texture */
  background-image: 
    radial-gradient(circle at 30% 30%, rgba(144, 238, 144, 0.3) 2px, transparent 2px),
    radial-gradient(circle at 70% 60%, rgba(154, 205, 50, 0.2) 1px, transparent 1px);
  background-size: 8px 8px, 5px 5px;
`

const mushroomsContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const forestMushroomStyle = ({ x, y, size, delay }: {
  x: number, y: number, size: number, delay: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}px;
  height: ${size}px;
  animation: ${mushroomPulse} 6s ease-in-out infinite;
  animation-delay: ${delay}s;
`

const mushroomCapStyle = (color: string) => css`
  position: absolute;
  top: 0;
  width: 100%;
  height: 65%;
  background: linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.4) 100%);
  border-radius: 50% 50% 50% 50% / 100% 100% 20% 20%;
  border: 1px solid rgba(0,0,0,0.3);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
`

const mushroomStemStyle = css`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 35%;
  height: 45%;
  background: linear-gradient(180deg, #F5F5DC 0%, #DDD 50%, #C0C0C0 100%);
  border-radius: 0 0 40% 40%;
  border: 1px solid rgba(0,0,0,0.2);
`

const mushroomSpotStyle = css`
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  
  &:nth-of-type(3) {
    top: 15%;
    left: 25%;
    width: 20%;
    height: 20%;
  }
  &:nth-of-type(4) {
    top: 35%;
    right: 25%;
    width: 15%;
    height: 15%;
  }
  &:nth-of-type(5) {
    top: 25%;
    left: 60%;
    width: 12%;
    height: 12%;
  }
`

const mushroomGlowStyle = (color: string) => css`
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: 35%;
  border-radius: 50% 50% 50% 50% / 100% 100% 20% 20%;
  background: radial-gradient(ellipse at center, ${color}40 0%, transparent 70%);
  pointer-events: none;
`

const stonesContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const mossyStoneStyle = ({ x, y, size, mossIntensity }: {
  x: number, y: number, size: number, mossIntensity: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}px;
  height: ${size * 0.7}px;
  background: linear-gradient(135deg, 
    #696969 0%, 
    #808080 30%, 
    #556B2F ${50 + mossIntensity * 30}%, 
    #8FBC8F ${70 + mossIntensity * 20}%, 
    #A9A9A9 100%);
  border-radius: 50% 40% 60% 30%;
  opacity: 0.8;
  transform: rotate(${Math.random() * 360}deg);
  
  /* Stone texture */
  background-image: 
    radial-gradient(circle at 30% 30%, rgba(144, 238, 144, ${mossIntensity}) 1px, transparent 1px),
    radial-gradient(circle at 70% 60%, rgba(105, 105, 105, 0.5) 1px, transparent 1px);
  background-size: 4px 4px, 3px 3px;
`

const enchantedTextStyle = (size: string, color: string) => css`
  font-size: ${size};
  font-weight: bold;
  color: ${color};
  text-shadow: 
    0 0 3px rgba(255, 215, 0, 0.6),
    1px 1px 0 rgba(139, 69, 19, 0.8),
    2px 2px 2px rgba(0, 0, 0, 0.5);
  font-family: 'Griffy', cursive;
  letter-spacing: 0.5px;
`

const hempYarnSurfaceStyle = (padding: string, color: string) => css`
  background: ${color};
  padding: ${padding};
  border-radius: 15px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(255, 215, 0, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(74, 103, 65, 0.3);
  position: relative;
  overflow: hidden;
  
  /* Forest floor texture */
  background-image: 
    repeating-linear-gradient(45deg, 
      rgba(139, 69, 19, 0.2) 0px, 
      rgba(139, 69, 19, 0.2) 2px, 
      transparent 2px, 
      transparent 12px),
    repeating-linear-gradient(-45deg, 
      rgba(74, 103, 65, 0.15) 0px, 
      rgba(74, 103, 65, 0.15) 1px, 
      transparent 1px, 
      transparent 8px);
`

const hempFibersOverlayStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 25% 25%, rgba(144, 238, 144, 0.2) 1px, transparent 1px),
    radial-gradient(circle at 60% 70%, rgba(139, 69, 19, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 80% 20%, rgba(74, 103, 65, 0.15) 1px, transparent 1px);
  background-size: 15px 15px, 8px 8px, 12px 12px;
  pointer-events: none;
  opacity: 0.6;
`

const mysticalButtonStyle = (color: string, disabled: boolean) => css`
  background: linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.4) 100%);
  border: 2px solid rgba(255, 215, 0, 0.5);
  border-radius: 12px;
  padding: 12px 24px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  font-family: 'Griffy', cursive;
  
  ${disabled && css`
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(0.5);
  `}
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 
      0 8px 25px rgba(255, 215, 0, 0.4),
      0 0 30px rgba(74, 103, 65, 0.3);
    border-color: rgba(255, 215, 0, 0.8);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0px);
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  }
`

const mysticalButtonTextStyle = css`
  position: relative;
  z-index: 2;
  font-weight: bold;
  color: #E8E8E8;
  text-shadow: 
    0 0 5px rgba(255, 215, 0, 0.8),
    1px 1px 0 rgba(0, 0, 0, 0.5);
  font-family: 'Griffy', cursive;
`

const mysticalButtonAuraStyle = css`
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  pointer-events: none;
  background: linear-gradient(45deg, 
    transparent 0%, 
    rgba(255, 215, 0, 0.1) 50%, 
    transparent 100%);
` 