/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'
import { RUNE_THREAD_CONFIG, DEFAULT_THREAD } from '../config/RuneThreadConfig'

interface NumberTileProps {
  tileId: NumberTileId
  size?: 'normal' | 'large' | 'massive' | 'huge'
  isSelected?: boolean
  isPlaced?: boolean
  onClick?: () => void
  useTextures?: boolean
}

export function NumberTile({ tileId, size = 'normal', isSelected = false, isPlaced = false, onClick, useTextures = false }: NumberTileProps) {
  const value = getTileValue(tileId)
  const fabricData = getFabricData(tileId)
  
  const combinedStyle = css`
    ${knittingPatchBaseStyle}
    ${sizeStyles[size]}
    ${useTextures 
      ? getTexturedPatchStyle(fabricData, isPlaced) 
      : (isPlaced ? getKnittedPatchStyle(fabricData) : getLoosePatchStyle(fabricData))
    }
    ${isSelected ? selectedPatchStyle : ''}
    ${onClick ? clickablePatchStyle : ''}
  `

  return (
    <div 
      css={combinedStyle}
      onClick={onClick}
      title={`${fabricData.name} (${value})`}
    >
      <div css={fabricSurfaceStyle}>
        <span css={isPlaced ? embroideredNumberStyle : chalkNumberStyle}>{value}</span>
        {isPlaced && <div css={stitchingOverlayStyle} />}
        {!isPlaced && <div css={loosePatchOverlayStyle} />}
        {isPlaced && fabricData.isSpecial && <div css={specialStitchingStyle}>✂️</div>}
      </div>
    </div>
  )
}

function getTileValue(tileId: NumberTileId): number {
  switch (tileId) {
    case NumberTileId.Zero: return 0
    case NumberTileId.One: return 1
    case NumberTileId.Two: return 2
    case NumberTileId.Three: return 3
    case NumberTileId.Four: return 4
    case NumberTileId.Five: return 5
    case NumberTileId.Six: return 6
    case NumberTileId.Seven: return 7
    case NumberTileId.Eight: return 8
    case NumberTileId.Nine: return 9
    default: return 0
  }
}

function getFabricData(tileId: NumberTileId) {
  return RUNE_THREAD_CONFIG[tileId] || DEFAULT_THREAD
}

// NEW: Textured patch style using actual texture files
const getTexturedPatchStyle = (fabricData: { textureFile: string; accent: string; primary: string }, isPlaced: boolean) => css`
  /* Use actual texture file as background */
  background-image: url('/textures/${fabricData.textureFile}');
  background-size: 64px 64px;
  background-repeat: repeat;
  
  /* Overlay color tint to maintain some color identity */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, ${fabricData.primary}40 0%, ${fabricData.primary}20 100%);
    pointer-events: none;
    z-index: 1;
  }
  
  /* Thick stitching border treatment for placed vs loose */
  border: ${isPlaced ? '6px solid' : '5px dashed'} ${fabricData.accent};
  ${isPlaced ? css`
    border-image: repeating-linear-gradient(
      0deg,
      ${fabricData.accent} 0px,
      ${fabricData.accent} 8px,
      rgba(139, 69, 19, 0.8) 8px,
      rgba(139, 69, 19, 0.8) 12px
    ) 6;
  ` : css`
    border-image: repeating-linear-gradient(
      45deg,
      ${fabricData.accent} 0px,
      ${fabricData.accent} 6px,
      transparent 6px,
      transparent 10px
    ) 5;
  `}
  
  /* Enhanced shadow for textured tiles */
  box-shadow: 
    0 ${isPlaced ? '6px 12px' : '3px 6px'} rgba(139, 69, 19, 0.4),
    inset 0 2px 4px rgba(255,255,255,0.3),
    inset 0 -2px 4px rgba(0,0,0,0.2),
    inset 0 0 0 2px rgba(139, 69, 19, ${isPlaced ? '0.6' : '0.4'});
  
  /* Texture quality */
  image-rendering: ${window.devicePixelRatio > 1 ? 'auto' : 'pixelated'};
  
  /* Animation for placed tiles */
  ${isPlaced && css`
    animation: ${patchToQuilt} 0.8s ease-out;
  `}
`

// Cozy knitting animations
const gentleFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(0.5deg); }
`

const patchToQuilt = keyframes`
  0% { 
    transform: scale(0.95) rotate(-2deg);
    filter: brightness(0.9);
  }
  50% {
    transform: scale(1.05) rotate(1deg);
    filter: brightness(1.1);
  }
  100% { 
    transform: scale(1) rotate(0deg);
    filter: brightness(1);
  }
`

const stitchingAnimation = keyframes`
  0% { 
    border-style: dashed;
    border-color: transparent;
  }
  50% {
    border-style: solid;
    border-color: rgba(139, 69, 19, 0.6);
  }
  100% { 
    border-style: solid;
    border-color: rgba(139, 69, 19, 0.8);
  }
`

const knittingPatchBaseStyle = css`
  position: relative;
  border-radius: 50% 40% 60% 30%; /* Organic, irregular shape */
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="%23FFD700" stroke="%23654321" stroke-width="2"/><path d="M6 6 L14 14 M14 6 L6 14" stroke="%23654321" stroke-width="2" stroke-linecap="round"/></svg>') 10 10, pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  transform-origin: center;
  
  /* Mystical hemp stone texture with magical sparkles */
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.4) 1px, transparent 2px),
    radial-gradient(circle at 75% 75%, rgba(144, 238, 144, 0.3) 1px, transparent 2px),
    radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.6) 0.5px, transparent 1px),
    repeating-linear-gradient(45deg, 
      rgba(139, 69, 19, 0.1) 0px, 
      rgba(139, 69, 19, 0.1) 2px, 
      transparent 2px, 
      transparent 8px);
  background-size: 15px 15px, 12px 12px, 8px 8px, 20px 20px;
  
  /* Organic, flowing border like hemp fibers */
  border: 3px solid rgba(74, 103, 65, 0.8);
  box-shadow: 
    0 4px 8px rgba(139, 69, 19, 0.3),
    0 0 12px rgba(255, 215, 0, 0.2),
    inset 0 1px 3px rgba(255, 255, 255, 0.3),
    inset 0 -1px 3px rgba(0, 0, 0, 0.2);
  
  /* Subtle floating animation */
  animation: ${gentleFloat} 6s ease-in-out infinite;
  
  &:hover {
    transform: translateY(-6px) scale(1.05) rotate(2deg);
    border-radius: 45% 50% 55% 40%; /* Shape shifts on hover */
    box-shadow: 
      0 12px 24px rgba(139, 69, 19, 0.4),
      0 0 20px rgba(255, 215, 0, 0.5),
      0 0 35px rgba(144, 238, 144, 0.3),
      inset 0 2px 6px rgba(255, 255, 255, 0.4);
    z-index: 10;
    animation: none; /* Stop floating on hover */
  }
  
  &:active {
    transform: translateY(-3px) scale(1.02) rotate(-1deg);
    transition: all 0.15s;
    border-radius: 60% 35% 45% 55%;
  }
`

const sizeStyles = {
  normal: css`
    width: 50px;
    height: 50px;
  `,
  large: css`
    width: 70px;
    height: 70px;
    
    @media (max-width: 768px) {
      width: 50px;
      height: 50px;
    }
    
    @media (max-width: 480px) {
      width: 40px;
      height: 40px;
    }
  `,
  massive: css`
    width: 90px;
    height: 90px;
  `,
  huge: css`
    width: min(12vw, 110px);
    height: min(12vw, 110px);
  `
}

// KNITTED patch style - stitched into quilt
const getKnittedPatchStyle = (fabricData: { primary: string; secondary: string; accent: string; pattern: string }) => css`
  background: 
    linear-gradient(45deg, ${fabricData.primary} 0%, ${fabricData.secondary} 50%, ${fabricData.primary} 100%);
  
  /* Knitted fabric texture based on pattern */
  ${fabricData.pattern === 'ribbed' && css`
    background-image: 
      repeating-linear-gradient(90deg, 
        rgba(255,255,255,0.1) 0px, 
        rgba(255,255,255,0.1) 2px, 
        transparent 2px, 
        transparent 4px);
  `}
  
  ${fabricData.pattern === 'cable' && css`
    background-image: 
      repeating-linear-gradient(45deg, 
        rgba(255,255,255,0.15) 0px, 
        rgba(255,255,255,0.15) 3px, 
        transparent 3px, 
        transparent 6px);
  `}
  
  ${fabricData.pattern === 'seed' && css`
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px),
      radial-gradient(circle at 75% 75%, rgba(0,0,0,0.1) 1px, transparent 1px);
    background-size: 4px 4px, 4px 4px;
  `}
  
  /* Thick stitched border - connected to quilt */
  border: 6px solid ${fabricData.accent};
  border-style: solid;
  border-image: repeating-linear-gradient(
    0deg,
    ${fabricData.accent} 0px,
    ${fabricData.accent} 8px,
    rgba(139, 69, 19, 0.8) 8px,
    rgba(139, 69, 19, 0.8) 12px
  ) 6;
  box-shadow: 
    0 4px 8px rgba(139, 69, 19, 0.3),
    inset 0 2px 4px rgba(255,255,255,0.4),
    inset 0 -2px 4px rgba(0,0,0,0.2),
    inset 0 0 0 2px rgba(139, 69, 19, 0.6);
  
  /* Knitting together animation */
  animation: ${patchToQuilt} 0.8s ease-out;
`

// LOOSE patch style - not yet stitched
const getLoosePatchStyle = (fabricData: { primary: string; secondary: string; accent: string }) => css`
  background: 
    linear-gradient(135deg, 
      ${fabricData.primary} 0%, 
      ${fabricData.secondary} 100%);
  
  /* Thick loose stitching border */
  border: 5px dashed ${fabricData.accent};
  border-image: repeating-linear-gradient(
    45deg,
    ${fabricData.accent} 0px,
    ${fabricData.accent} 6px,
    transparent 6px,
    transparent 10px
  ) 5;
  opacity: 0.9;
  
  /* Rough, unfinished edges */
  box-shadow: 
    0 2px 6px rgba(139, 69, 19, 0.2),
    inset 0 1px 2px rgba(255,255,255,0.3),
    inset 0 -1px 2px rgba(0,0,0,0.2),
    inset 0 0 0 2px rgba(139, 69, 19, 0.4);
  
  /* Slightly frayed appearance */
  filter: contrast(0.9) brightness(0.95);
`

const selectedPatchStyle = css`
  transform: translateY(-8px) scale(1.08) rotate(2deg);
  animation: ${gentleFloat} 2s ease-in-out infinite;
  z-index: 100; /* High z-index to prevent layout interference */
  position: relative; /* Ensure it's above other elements */
  
  /* Glowing like it's being held by knitting needles */
  box-shadow: 0 0 20px rgba(218, 165, 32, 0.6) !important;
  border-color: #DAA520 !important;
  
  /* Remove loose state when selected */
  filter: contrast(1) brightness(1) !important;
  opacity: 1 !important;
`

const clickablePatchStyle = css`
  &:hover {
    transform: translateY(-6px) scale(1.05);
    filter: brightness(1.05);
    z-index: 20; /* Prevent layout interference */
    position: relative;
  }
`

const fabricSurfaceStyle = css`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6px;
`

// EMBROIDERED number style - stitched into fabric
const embroideredNumberStyle = css`
  position: relative;
  z-index: 5;
  font-weight: 900;
  color: #F5E6A3;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
  font-family: 'Quicksand', 'Arial', sans-serif !important;
  
  /* Warm quilting glow effect */
  text-shadow: 
    0 0 8px rgba(255, 215, 0, 0.6),
    1px 1px 2px rgba(139, 69, 19, 0.8),
    0 0 15px rgba(218, 165, 32, 0.4);
  
  /* Quilted gold appearance */
  background: linear-gradient(45deg, #DAA520, #FFD700, #B8860B);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: brightness(1.1) saturate(1.2);
`

// CHALK number style - temporary marking
const chalkNumberStyle = css`
  position: relative;
  z-index: 5;
  font-weight: 700;
  color: #8B4513;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
  font-family: 'Quicksand', 'Arial', sans-serif !important;
  
  /* Warm, temporary appearance */
  text-shadow: 
    1px 1px 2px rgba(139, 69, 19, 0.6),
    0 0 5px rgba(218, 165, 32, 0.3);
  opacity: 0.9;
`

const stitchingOverlayStyle = css`
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border: 1px solid rgba(139, 69, 19, 0.6);
  border-radius: 4px;
  z-index: 2;
  pointer-events: none;
  
  /* Stitching pattern */
  border-style: dashed;
  animation: ${stitchingAnimation} 0.8s ease-out;
  
  /* Cross-stitch corners */
  &::before {
    content: '✂';
    position: absolute;
    top: -3px;
    left: -3px;
    font-size: 8px;
    color: rgba(139, 69, 19, 0.7);
  }
  
  &::after {
    content: '✂';
    position: absolute;
    bottom: -3px;
    right: -3px;
    font-size: 8px;
    color: rgba(139, 69, 19, 0.7);
    transform: rotate(180deg);
  }
`

const specialStitchingStyle = css`
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 12px;
  z-index: 6;
  animation: ${gentleFloat} 3s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
`

const loosePatchOverlayStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 30%, rgba(139,69,19,0.1) 0%, transparent 70%);
  border-radius: 6px;
  z-index: 3;
  pointer-events: none;
  
  /* Fabric fuzz and loose threads */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(139,69,19,0.1) 1px, transparent 2px),
      radial-gradient(circle at 80% 70%, rgba(139,69,19,0.1) 1px, transparent 2px);
    background-size: 12px 12px, 8px 8px;
    border-radius: inherit;
  }
` 