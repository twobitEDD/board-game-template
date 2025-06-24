/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'
import { RUNE_THREAD_CONFIG, DEFAULT_THREAD } from '../config/RuneThreadConfig'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'

export type TileState = 'unplayed' | 'played' | 'burning' | 'empty'

interface NewAgeTileProps {
  value: number
  state: TileState
  isSelected?: boolean
  countdownTurns?: number
  onClick?: () => void
  size?: number
}

export function NewAgeTile({ 
  value, 
  state, 
  isSelected = false, 
  countdownTurns,
  onClick,
  size = 36
}: NewAgeTileProps) {
  // Ensure value is a valid number and within expected range
  const safeValue = typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 9 ? value : 1
  const tileConfig = RUNE_THREAD_CONFIG[safeValue as NumberTileId] || DEFAULT_THREAD
  
  // Map Norse colors to beautiful color themes
  const getColorTheme = () => {
    const primary = tileConfig?.primary || '#2E8B57'
    
    // Map colors to theme names for consistent beautiful styling
    if (primary.includes('#E8E8E8') || primary.includes('#B8860B') || primary.includes('#DAA520')) return 'sage' // Wyrd Stone & Sacred Gold
    if (primary.includes('#2E8B57') || primary.includes('#20B2AA')) return 'forest' // Forest Hemp & Freedom Teal  
    if (primary.includes('#87CEEB') || primary.includes('#4682B4')) return 'teal' // Sage Loom & Deep Myst
    if (primary.includes('#CD853F') || primary.includes('#8B7355')) return 'orange' // Ember Thread & Earth Rune
    if (primary.includes('#8B0000')) return 'purple' // Cursed Crimson
    
    return 'forest' // Default
  }
  
  const colorTheme = getColorTheme()
  
  return (
    <>
      <Global styles={globalAnimations} />
      <div
        css={[
          getMagicalTileStyle(colorTheme, state, size),
          isSelected && selectedGlowStyle
        ]}
        onClick={onClick}
      >
        {safeValue}
        {/* Burning countdown badge */}
        {state === 'burning' && countdownTurns !== undefined && (
          <div css={countdownBadgeStyle}>
            {countdownTurns}
          </div>
        )}
      </div>
    </>
  )
}

const selectedGlowStyle = css`
  box-shadow: 
    0 0 24px rgba(255, 215, 0, 0.8),
    0 0 36px rgba(255, 215, 0, 0.4),
    inset 0 0 12px rgba(255, 215, 0, 0.2) !important;
  border-color: #FFD700 !important;
  transform: scale(1.1);
  z-index: 10;
`



const countdownBadgeStyle = css`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  background: rgba(255, 69, 0, 0.9);
  border: 1px solid rgba(255, 140, 0, 1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  animation: countdown-pulse 1s ease-in-out infinite;
  z-index: 5;
`

// Beautiful magical tile styling adapted from NewAgeDisplay
const getMagicalTileStyle = (colorName: string, state: TileState, size: number = 36) => {
  const colorMap: { [key: string]: { bg: string; bgSecondary: string; border: string; text: string; pattern: string } } = {
    forest: { bg: '#2E8B57', bgSecondary: '#20B2AA', border: '#1F4F4F', text: '#FFD700', pattern: 'crosshatch' },
    sage: { bg: '#9CAF88', bgSecondary: '#7CB342', border: '#558B2F', text: '#FFD700', pattern: 'diamond' },
    orange: { bg: '#D2691E', bgSecondary: '#FF8C00', border: '#8B4513', text: '#FFD700', pattern: 'crosshatch' },
    teal: { bg: '#20B2AA', bgSecondary: '#00CED1', border: '#008B8B', text: '#FFD700', pattern: 'crosshatch' },
    purple: { bg: '#8A2BE2', bgSecondary: '#9932CC', border: '#4B0082', text: '#FFD700', pattern: 'diamond' }
  }
  
  const colors = colorMap[colorName] || colorMap.forest
  const tileSize = Math.round(size)
  
  const getStateStyles = () => {
    switch(state) {
      case 'unplayed': 
        return { 
          border: 'none', 
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2)', 
          animation: 'none', 
          extraStyles: `
            position: relative;
            border-radius: 8px;
            
            /* Frayed edge effect */
            &::before {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              background: linear-gradient(45deg, 
                ${colors.border}80 0%, transparent 5%, ${colors.border}60 10%, transparent 15%,
                ${colors.border}70 20%, transparent 25%, ${colors.border}50 30%, transparent 35%,
                ${colors.border}80 40%, transparent 45%, ${colors.border}60 50%, transparent 55%,
                ${colors.border}70 60%, transparent 65%, ${colors.border}80 70%, transparent 75%,
                ${colors.border}60 80%, transparent 85%, ${colors.border}70 90%, transparent 95%,
                ${colors.border}80 100%
              );
              border-radius: 12px;
              z-index: -1;
              filter: blur(0.5px);
            }
            
            /* Thread texture overlay */
            &::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: 
                radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 2px),
                radial-gradient(circle at 75% 75%, rgba(255,255,255,0.15) 1px, transparent 2px),
                linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.1) 50%, transparent 52%);
              background-size: 12px 12px, 16px 16px, 8px 8px;
              opacity: 0.4;
              border-radius: 8px;
              pointer-events: none;
            }
            
            &:hover {
              transform: scale(1.05);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 215, 0, 0.3);
              filter: brightness(1.1);
            }
          `
        }
      
      case 'played': 
        return { 
          border: '2px solid #00FF00', 
          boxShadow: '0 0 25px rgba(0, 255, 0, 0.8), 0 0 35px rgba(255, 215, 0, 0.6)', 
          animation: 'magicalGlow 3s ease-in-out infinite', 
          extraStyles: `
            border-radius: 4px;
            position: relative;
            
            /* Weaving pattern for played tiles */
            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6) 2px, transparent 3px),
                               radial-gradient(circle at 70% 70%, rgba(0,255,0,0.4) 1px, transparent 2px),
                               ${colors.pattern === 'crosshatch' 
                                 ? `linear-gradient(45deg, transparent 40%, rgba(0,255,0,0.1) 50%, transparent 60%),
                                    linear-gradient(-45deg, transparent 40%, rgba(0,255,0,0.1) 50%, transparent 60%)`
                                 : `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,255,0,0.1) 4px, rgba(0,255,0,0.1) 8px)`
                               };
              background-size: 12px 12px;
              opacity: 0.3;
              border-radius: 2px;
              pointer-events: none;
            }
            
            /* Inner stitching border */
            &::after {
              content: '';
              position: absolute;
              top: 4px;
              left: 4px;
              right: 4px;
              bottom: 4px;
              border: 1px dashed rgba(255, 255, 255, 0.4);
              border-radius: 4px;
              pointer-events: none;
            }
          `
        }
      
      case 'burning': 
        return { 
          border: '2px solid #FF0000', 
          boxShadow: '0 0 30px rgba(255, 0, 0, 1)', 
          animation: 'burnCountdown 0.8s ease-in-out infinite', 
          extraStyles: `
            background: linear-gradient(135deg, #FF0000 0%, #FF6600 25%, #FF4500 50%, #FF6600 75%, #FF0000 100%) !important;
            color: #FFFFFF !important;
            font-weight: 900 !important;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 1), 0 0 8px rgba(255, 255, 255, 0.8) !important;
            border-radius: 4px;
            position: relative;
            
            &::after {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              border-radius: 8px;
              border: 2px solid #FFD700;
              animation: urgentPulse 0.4s ease-in-out infinite;
              z-index: -1;
              pointer-events: none;
            }
          `
        }
      
      case 'empty': 
        return { 
          border: '2px dashed rgba(255, 215, 0, 0.4)', 
          boxShadow: 'none', 
          animation: 'none', 
          extraStyles: `
            background: rgba(0, 0, 0, 0.1) !important;
            color: rgba(255, 215, 0, 0.3) !important;
            border-radius: 4px;
            opacity: 0.5;
            
            &:hover {
              border: 2px dashed rgba(255, 215, 0, 0.7);
              background: rgba(255, 215, 0, 0.1) !important;
              opacity: 0.8;
            }
          `
        }
      
      default: 
        return { border: `3px solid ${colors.border}`, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', animation: 'none', extraStyles: '' }
    }
  }
  
  const stateStyles = getStateStyles()
  
  return css`
    width: ${tileSize}px;
    height: ${tileSize}px;
    background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgSecondary} 50%, ${colors.bg} 100%);
    border: ${stateStyles.border};
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${colors.text};
    font-size: ${Math.round(tileSize * 0.6)}px;
    font-weight: bold;
    font-family: 'Fredoka One', 'Arial', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    opacity: 1;
    box-shadow: ${stateStyles.boxShadow};
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    animation: ${stateStyles.animation};
    user-select: none;
    overflow: visible;
    
    ${stateStyles.extraStyles}
  `
}

const globalAnimations = css`
  @keyframes magicalGlow {
    0%, 100% { 
      box-shadow: 0 0 25px rgba(0, 255, 0, 0.8), 0 0 35px rgba(255, 215, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3);
    }
    50% { 
      box-shadow: 0 0 35px rgba(0, 255, 0, 1), 0 0 45px rgba(255, 215, 0, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.5);
    }
  }
  
  @keyframes burnCountdown {
    0% { 
      filter: brightness(1.3) contrast(1.2);
      transform: scale(1);
      box-shadow: 0 0 30px rgba(255, 0, 0, 1), 0 0 40px rgba(255, 69, 0, 0.8);
    }
    25% { 
      filter: brightness(1.5) contrast(1.3);
      transform: scale(1.05);
      box-shadow: 0 0 40px rgba(255, 0, 0, 1), 0 0 50px rgba(255, 69, 0, 0.9);
    }
    50% { 
      filter: brightness(1.8) contrast(1.4);
      transform: scale(1.08);
      box-shadow: 0 0 50px rgba(255, 0, 0, 1), 0 0 60px rgba(255, 69, 0, 1);
    }
    75% { 
      filter: brightness(1.5) contrast(1.3);
      transform: scale(1.05);
      box-shadow: 0 0 40px rgba(255, 0, 0, 1), 0 0 50px rgba(255, 69, 0, 0.9);
    }
    100% { 
      filter: brightness(1.3) contrast(1.2);
      transform: scale(1);
      box-shadow: 0 0 30px rgba(255, 0, 0, 1), 0 0 40px rgba(255, 69, 0, 0.8);
    }
  }
  
  @keyframes urgentPulse {
    0% { 
      opacity: 0.6;
      transform: scale(1);
    }
    50% { 
      opacity: 1;
      transform: scale(1.02);
    }
    100% { 
      opacity: 0.6;
      transform: scale(1);
    }
  }
  
  @keyframes countdown-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
`

 