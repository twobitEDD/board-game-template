/** @jsxImportSource @emotion/react */
import { css, keyframes, Global } from '@emotion/react'

// Mystical Forest Night Theme
export const PsychedelicCannabisFabricGlobalStyles = () => (
  <Global styles={mysticalForestGlobalStyles} />
)

export function PsychedelicCannabisFabricDecorations() {
  return (
    <div css={parallaxContainerStyle}>
      <NightSkyBackground />
      <ForestSilhouette />
      <GrassyField />
      <ForegroundPlants />
      <FloatingCannabisLeaves />
      <SparkleOverlay />
    </div>
  )
}

// Night sky background with stars - parallax layer 1 (slowest)
function NightSkyBackground() {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60,
    size: Math.random() * 3 + 1,
    opacity: Math.random() * 0.8 + 0.2,
    twinkleDelay: Math.random() * 8
  }))

  return (
    <div css={nightSkyLayerStyle}>
      {stars.map(star => (
        <div
          key={star.id}
          css={starStyle({
            x: star.x,
            y: star.y,
            size: star.size,
            opacity: star.opacity,
            delay: star.twinkleDelay
          })}
        />
      ))}
    </div>
  )
}

// Forest silhouette layer - parallax layer 2
function ForestSilhouette() {
  const trees = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: (i * 8) + Math.random() * 6,
    height: 60 + Math.random() * 40,
    width: 15 + Math.random() * 20
  }))

  return (
    <div css={forestLayerStyle}>
      {trees.map(tree => (
        <div
          key={tree.id}
          css={treeStyle({
            x: tree.x,
            height: tree.height,
            width: tree.width
          })}
        />
      ))}
    </div>
  )
}

// Grassy field layer - parallax layer 3
function GrassyField() {
  const grassPatches = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 75 + Math.random() * 15,
    width: 10 + Math.random() * 15,
    height: 8 + Math.random() * 10
  }))

  return (
    <div css={grassFieldLayerStyle}>
      {grassPatches.map(patch => (
        <div
          key={patch.id}
          css={grassPatchStyle({
            x: patch.x,
            y: patch.y,
            width: patch.width,
            height: patch.height
          })}
        />
      ))}
    </div>
  )
}

// Foreground plants layer - parallax layer 4 (fastest)
function ForegroundPlants() {
  const plants = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 85 + Math.random() * 10,
    size: 20 + Math.random() * 25,
    type: Math.floor(Math.random() * 3)
  }))

  return (
    <div css={foregroundPlantsLayerStyle}>
      {plants.map(plant => (
        <div
          key={plant.id}
          css={plantStyle({
            x: plant.x,
            y: plant.y,
            size: plant.size
          })}
        >
          {plant.type === 0 ? '🌿' : plant.type === 1 ? '🍀' : '🌱'}
        </div>
      ))}
    </div>
  )
}

// Floating cannabis leaves
function FloatingCannabisLeaves() {
  const leaves = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: Math.random() * 12,
    duration: 15 + Math.random() * 8,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    size: 15 + Math.random() * 10,
    rotation: Math.random() * 360,
    hue: [120, 320, 200, 60, 280, 180, 300, 40][i]
  }))

  return (
    <div css={cannabisLeavesContainerStyle}>
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          css={cannabisLeafStyle({
            delay: leaf.delay,
            duration: leaf.duration,
            x: leaf.x,
            y: leaf.y,
            size: leaf.size,
            rotation: leaf.rotation,
            hue: leaf.hue
          })}
        >
          🍁
        </div>
      ))}
    </div>
  )
}

// Sparkle overlay for mystical effect
function SparkleOverlay() {
  const sparkles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    delay: Math.random() * 8,
    duration: 3 + Math.random() * 4,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4
  }))

  return (
    <div css={sparkleOverlayContainerStyle}>
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          css={sparkleStyle({
            delay: sparkle.delay,
            duration: sparkle.duration,
            x: sparkle.x,
            y: sparkle.y,
            size: sparkle.size
          })}
        >
          ✨
        </div>
      ))}
    </div>
  )
}

// Mystical fabric components
export function PsychedelicEmbroideredText({ 
  children, 
  size = '1rem', 
  color = '#E0E0E0' 
}: { 
  children: React.ReactNode
  size?: string
  color?: string 
}) {
  return (
    <span css={mysticalEmbroideredStyle(size, color)}>
      {children}
    </span>
  )
}

export function PsychedelicQuiltedSurface({ 
  children, 
  padding = '16px',
  color = 'rgba(42, 27, 61, 0.8)' 
}: { 
  children: React.ReactNode
  padding?: string
  color?: string 
}) {
  return (
    <div css={mysticalQuiltedStyle(padding, color)}>
      {children}
    </div>
  )
}

export function PsychedelicFabricButton({ 
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
      css={mysticalFabricButtonStyle(color, disabled)}
      onClick={onClick}
      disabled={disabled}
    >
      <span css={mysticalButtonTextStyle}>
        {children}
      </span>
    </button>
  )
}

// ============ ANIMATIONS ============

// Parallax layer animations (different speeds create depth)
const parallaxSlow = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-10px); }
`

const parallaxMedium = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-20px); }
`

const parallaxFast = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-30px); }
`

const parallaxFastest = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50px); }
`

// Star twinkling animation
const twinkle = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
`

// Plant swaying animation
const gentleSway = keyframes`
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(2px) rotate(1deg); }
  50% { transform: translateX(0) rotate(0deg); }
  75% { transform: translateX(-2px) rotate(-1deg); }
`

// Cannabis leaf floating
const mysticalFloat = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
  25% { transform: translate(8px, -12px) rotate(5deg); opacity: 1; }
  50% { transform: translate(-5px, -20px) rotate(-3deg); opacity: 0.8; }
  75% { transform: translate(12px, -8px) rotate(8deg); opacity: 1; }
`

// Sparkle shimmer animation
const sparkleShimmer = keyframes`
  0%, 100% { 
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% { 
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
`

// ============ GLOBAL STYLES ============

const mysticalForestGlobalStyles = css`
  body {
    /* Mystical night forest background - matches reference image */
    background: 
      radial-gradient(circle at 30% 20%, rgba(0, 100, 100, 0.4) 0%, transparent 60%),
      radial-gradient(circle at 70% 80%, rgba(20, 60, 80, 0.3) 0%, transparent 50%),
      linear-gradient(180deg, 
        #0a1a2a 0%,     /* Deep night sky */
        #1a3c4a 25%,    /* Darker teal */
        #2a5a6a 50%,    /* Mid teal */
        #1a4a5a 75%,    /* Forest depth */
        #0a2a3a 100%    /* Deep forest base */
      );
    
    background-attachment: fixed;
    min-height: 100vh;
    font-family: 'Orbitron', 'Arial Black', sans-serif;
    color: #E0E0E0;
    
    /* Subtle mystical glow */
    filter: contrast(1.1) brightness(1.0);
  }
  
  /* Mystical scrollbars */
  ::-webkit-scrollbar {
    width: 16px;
  }
  
  ::-webkit-scrollbar-track {
    background: linear-gradient(180deg, #0a1a2a 0%, #1a3c4a 100%);
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #4A6741 0%, #6B8E23 100%);
    border-radius: 8px;
    border: 2px solid #0a1a2a;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #6B8E23 0%, #8FBC8F 100%);
  }
  
  /* Mystical selection */
  ::selection {
    background: rgba(74, 103, 65, 0.6);
    color: #E0E0E0;
  }
`

// ============ COMPONENT STYLES ============

// Main parallax container
const parallaxContainerStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`

// Night sky layer (slowest parallax)
const nightSkyLayerStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: translateZ(0); /* Force hardware acceleration */
  animation: ${parallaxSlow} 60s linear infinite;
`

// Star styling with twinkling
const starStyle = ({ x, y, size, opacity, delay }: {
  x: number, y: number, size: number, opacity: number, delay: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${size}px;
  height: ${size}px;
  background: radial-gradient(circle, rgba(255, 255, 255, ${opacity}) 0%, transparent 70%);
  border-radius: 50%;
  animation: ${twinkle} 4s ease-in-out infinite;
  animation-delay: ${delay}s;
  box-shadow: 0 0 ${size * 2}px rgba(255, 255, 255, ${opacity * 0.5});
`

// Forest silhouette layer (medium parallax)
const forestLayerStyle = css`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%; /* Keep within viewport to prevent scrollbars */
  height: 60%;
  animation: ${parallaxMedium} 40s linear infinite;
  overflow: hidden; /* Prevent content from extending beyond bounds */
`

// Tree silhouette styling
const treeStyle = ({ x, height, width }: {
  x: number, height: number, width: number
}) => css`
  position: absolute;
  left: ${x}%;
  bottom: 0;
  width: ${width}px;
  height: ${height}%;
  background: linear-gradient(180deg, 
    rgba(10, 30, 40, 0.9) 0%,
    rgba(5, 20, 30, 1) 100%);
  
  /* Tree shape using clip-path */
  clip-path: polygon(
    40% 100%, 45% 80%, 35% 70%, 40% 60%, 30% 50%, 
    35% 40%, 25% 30%, 30% 20%, 20% 10%, 25% 0%, 
    75% 0%, 80% 10%, 70% 20%, 75% 30%, 65% 40%, 
    70% 50%, 60% 60%, 65% 70%, 55% 80%, 60% 100%
  );
  
  opacity: 0.8;
  filter: blur(1px);
`

// Grassy field layer (faster parallax)
const grassFieldLayerStyle = css`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  animation: ${parallaxFast} 25s linear infinite;
  overflow: hidden;
`

// Grass patch styling
const grassPatchStyle = ({ x, y, width, height }: {
  x: number, y: number, width: number, height: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  width: ${width}px;
  height: ${height}px;
  background: linear-gradient(180deg, 
    rgba(40, 80, 60, 0.6) 0%,
    rgba(20, 60, 40, 0.8) 100%);
  border-radius: 50% 50% 20% 20%;
  opacity: 0.7;
  transform: skewX(${Math.random() * 20 - 10}deg);
`

// Foreground plants layer (fastest parallax)
const foregroundPlantsLayerStyle = css`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20%;
  animation: ${parallaxFastest} 15s linear infinite;
  overflow: hidden;
`

// Plant styling
const plantStyle = ({ x, y, size }: {
  x: number, y: number, size: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  font-size: ${size}px;
  opacity: 0.6;
  filter: hue-rotate(120deg) brightness(0.8);
  animation: ${gentleSway} 8s ease-in-out infinite;
  animation-delay: ${Math.random() * 4}s;
`

const cannabisLeavesContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const cannabisLeafStyle = ({ delay, duration, x, y, size, rotation, hue }: {
  delay: number, duration: number, x: number, y: number, size: number, rotation: number, hue: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  font-size: ${size}px;
  animation: ${mysticalFloat} ${duration}s ease-in-out infinite;
  animation-delay: ${delay}s;
  transform: rotate(${rotation}deg);
  filter: hue-rotate(${hue}deg) brightness(1.2) saturate(1.5);
  opacity: 0.8;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
`

const sparkleOverlayContainerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
`

const sparkleStyle = ({ delay, duration, x, y, size }: {
  delay: number, duration: number, x: number, y: number, size: number
}) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  font-size: ${size}px;
  animation: ${sparkleShimmer} ${duration}s ease-in-out infinite;
  animation-delay: ${delay}s;
  filter: hue-rotate(${Math.random() * 360}deg);
`

const mysticalEmbroideredStyle = (size: string, color: string) => css`
  font-size: ${size};
  font-weight: bold;
  color: ${color};
  text-shadow: 
    0 0 5px rgba(255, 215, 0, 0.6),
    1px 1px 0 rgba(0, 0, 0, 0.8),
    2px 2px 2px rgba(0, 0, 0, 0.5);
  font-family: 'Orbitron', 'Arial Black', sans-serif;
  letter-spacing: 1px;
  filter: brightness(1.1) saturate(1.2);
`

const mysticalQuiltedStyle = (padding: string, color: string) => css`
  background: ${color};
  padding: ${padding};
  border: 3px solid rgba(74, 103, 65, 0.6);
  border-radius: 12px;
  box-shadow: 
    0 0 20px rgba(74, 103, 65, 0.4),
    inset 0 0 20px rgba(255, 215, 0, 0.2),
    0 8px 16px rgba(0, 0, 0, 0.4);
  
  /* Mystical quilted pattern */
  background-image: 
    repeating-linear-gradient(45deg, 
      rgba(74, 103, 65, 0.1) 0px, 
      rgba(74, 103, 65, 0.1) 3px, 
      transparent 3px, 
      transparent 24px),
    repeating-linear-gradient(-45deg, 
      rgba(255, 215, 0, 0.05) 0px, 
      rgba(255, 215, 0, 0.05) 3px, 
      transparent 3px, 
      transparent 24px);
  
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
`

const mysticalFabricButtonStyle = (color: string, disabled: boolean) => css`
  background: linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.2) 100%);
  border: 3px solid ${color};
  border-radius: 12px;
  padding: 12px 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  font-family: 'Orbitron', 'Arial Black', sans-serif;
  
  box-shadow: 
    0 0 15px ${color}40,
    0 4px 8px rgba(0, 0, 0, 0.4);
  
  ${disabled && css`
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(0.5);
  `}
  
  &:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 
      0 0 25px ${color}60,
      0 8px 16px rgba(0, 0, 0, 0.4);
    filter: brightness(1.2);
  }
  
  &:active:not(:disabled) {
    transform: translateY(-1px) scale(1.02);
  }
`

const mysticalButtonTextStyle = css`
  position: relative;
  z-index: 2;
  font-weight: bold;
  color: #E0E0E0;
  text-shadow: 
    0 0 5px rgba(255, 215, 0, 0.8),
    1px 1px 0 rgba(0, 0, 0, 0.8);
  font-family: 'Orbitron', 'Arial Black', sans-serif;
` 