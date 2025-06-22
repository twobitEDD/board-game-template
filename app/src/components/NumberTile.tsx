/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'

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
  switch (tileId) {
    case NumberTileId.Zero:
      return { 
        name: 'Cream Wool',
        primary: '#F5F5DC', 
        secondary: '#FFFACD', 
        accent: '#DDD5C7',
        pattern: 'plain',
        isSpecial: true,
        textureFile: 'cream-wool-plain.png'
      }
    case NumberTileId.One:
      return { 
        name: 'Rose Cotton',
        primary: '#FFB6C1', 
        secondary: '#FFC0CB', 
        accent: '#F08080',
        pattern: 'ribbed',
        isSpecial: false,
        textureFile: 'rose-cotton-ribbed.png'
      }
    case NumberTileId.Two:
      return { 
        name: 'Sage Linen',
        primary: '#98FB98', 
        secondary: '#90EE90', 
        accent: '#8FBC8F',
        pattern: 'cable',
        isSpecial: false,
        textureFile: 'sage-linen-cable.png'
      }
    case NumberTileId.Three:
      return { 
        name: 'Sunshine Yarn',
        primary: '#FFE135', 
        secondary: '#FFED4A', 
        accent: '#F59E0B',
        pattern: 'seed',
        isSpecial: false,
        textureFile: 'sunshine-yarn-seed.png'
      }
    case NumberTileId.Four:
      return { 
        name: 'Coral Mohair',
        primary: '#FF7F7F', 
        secondary: '#FF9999', 
        accent: '#CD5C5C',
        pattern: 'moss',
        isSpecial: false,
        textureFile: 'coral-mohair-moss.png'
      }
    case NumberTileId.Five:
      return { 
        name: 'Lavender Silk',
        primary: '#DDA0DD', 
        secondary: '#E6E6FA', 
        accent: '#BA55D3',
        pattern: 'lace',
        isSpecial: false,
        textureFile: 'lavender-silk-lace.png'
      }
    case NumberTileId.Six:
      return { 
        name: 'Sky Cashmere',
        primary: '#87CEEB', 
        secondary: '#B0E0E6', 
        accent: '#4682B4',
        pattern: 'fisherman',
        isSpecial: false,
        textureFile: 'sky-cashmere-fisherman.png'
      }
    case NumberTileId.Seven:
      return { 
        name: 'Forest Alpaca',
        primary: '#228B22', 
        secondary: '#32CD32', 
        accent: '#006400',
        pattern: 'aran',
        isSpecial: false,
        textureFile: 'forest-alpaca-aran.png'
      }
    case NumberTileId.Eight:
      return { 
        name: 'Violet Merino',
        primary: '#8A2BE2', 
        secondary: '#9370DB', 
        accent: '#663399',
        pattern: 'fair-isle',
        isSpecial: false,
        textureFile: 'violet-merino-fair-isle.png'
      }
    case NumberTileId.Nine:
      return { 
        name: 'Golden Angora',
        primary: '#DAA520', 
        secondary: '#FFD700', 
        accent: '#B8860B',
        pattern: 'intarsia',
        isSpecial: true,
        textureFile: 'golden-angora-intarsia.png'
      }
    default:
      return { 
        name: 'Grey Wool',
        primary: '#A9A9A9', 
        secondary: '#C0C0C0', 
        accent: '#808080',
        pattern: 'plain',
        isSpecial: false,
        textureFile: 'grey-wool-plain.png'
      }
  }
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
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.4s ease;
  user-select: none;
  
  /* Fabric-like texture */
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 1px, transparent 1px),
    radial-gradient(circle at 80% 50%, rgba(0,0,0,0.1) 1px, transparent 1px);
  background-size: 8px 8px, 6px 6px;
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 16px rgba(139, 69, 19, 0.3);
  }
  
  &:active {
    transform: translateY(-2px) scale(0.98);
    transition: all 0.15s;
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
  z-index: 10;
  
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
  color: #8B4513;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  line-height: 1;
  font-family: 'Orbitron', 'Arial Black', sans-serif !important;
  
  /* Embroidered effect */
  text-shadow: 
    1px 1px 0 rgba(255,255,255,0.8),
    2px 2px 0 rgba(139,69,19,0.6),
    1px 1px 3px rgba(0,0,0,0.3);
  
  /* Raised embroidery appearance */
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%);
  background-clip: text;
  -webkit-background-clip: text;
`

// CHALK number style - temporary marking
const chalkNumberStyle = css`
  position: relative;
  z-index: 5;
  font-weight: 700;
  color: #654321;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  line-height: 1;
  font-family: 'Orbitron', 'Arial Black', sans-serif !important;
  
  /* Chalky, temporary appearance */
  text-shadow: 1px 1px 2px rgba(0,0,0,0.4);
  opacity: 0.8;
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