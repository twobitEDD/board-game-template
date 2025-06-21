/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'

interface NumberTileProps {
  tileId: NumberTileId
  size?: 'normal' | 'large' | 'massive' | 'huge'
  isSelected?: boolean
  onClick?: () => void
}

export function NumberTile({ tileId, size = 'normal', isSelected = false, onClick }: NumberTileProps) {
  const value = getTileValue(tileId)
  const colors = getTileColors(tileId)
  
  const combinedStyle = css`
    ${tileBaseStyle}
    ${sizeStyles[size]}
    ${getTileStyle(colors)}
    ${isSelected ? selectedStyle : ''}
    ${onClick ? clickableStyle : ''}
  `

  const glowStyle = css`
    ${tileGlowStyle}
    background: ${colors.glow};
  `

  return (
    <div 
      css={combinedStyle}
      onClick={onClick}
    >
      <div css={tileContentStyle}>
        <span css={tileNumberStyle}>{value}</span>
        <div css={tileShineStyle} />
        <div css={glowStyle} />
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

function getTileColors(tileId: NumberTileId) {
  switch (tileId) {
    case NumberTileId.Zero:
      return { 
        primary: '#8B5CF6', 
        secondary: '#A78BFA', 
        glow: '#8B5CF6',
        shadow: 'rgba(139, 92, 246, 0.5)'
      }
    case NumberTileId.One:
      return { 
        primary: '#EC4899', 
        secondary: '#F472B6', 
        glow: '#EC4899',
        shadow: 'rgba(236, 72, 153, 0.5)'
      }
    case NumberTileId.Two:
      return { 
        primary: '#14B8A6', 
        secondary: '#2DD4BF', 
        glow: '#14B8A6',
        shadow: 'rgba(20, 184, 166, 0.5)'
      }
    case NumberTileId.Three:
      return { 
        primary: '#F59E0B', 
        secondary: '#FBBF24', 
        glow: '#F59E0B',
        shadow: 'rgba(245, 158, 11, 0.5)'
      }
    case NumberTileId.Four:
      return { 
        primary: '#FF6B35', 
        secondary: '#FF8A5B', 
        glow: '#FF6B35',
        shadow: 'rgba(255, 107, 53, 0.5)'
      }
    case NumberTileId.Five:
      return { 
        primary: '#EF4444', 
        secondary: '#F87171', 
        glow: '#EF4444',
        shadow: 'rgba(239, 68, 68, 0.5)'
      }
    case NumberTileId.Six:
      return { 
        primary: '#3B82F6', 
        secondary: '#60A5FA', 
        glow: '#3B82F6',
        shadow: 'rgba(59, 130, 246, 0.5)'
      }
    case NumberTileId.Seven:
      return { 
        primary: '#10B981', 
        secondary: '#34D399', 
        glow: '#10B981',
        shadow: 'rgba(16, 185, 129, 0.5)'
      }
    case NumberTileId.Eight:
      return { 
        primary: '#8B5CF6', 
        secondary: '#A78BFA', 
        glow: '#8B5CF6',
        shadow: 'rgba(139, 92, 246, 0.5)'
      }
    case NumberTileId.Nine:
      return { 
        primary: '#F97316', 
        secondary: '#FB923C', 
        glow: '#F97316',
        shadow: 'rgba(249, 115, 22, 0.5)'
      }
    default:
      return { 
        primary: '#6B7280', 
        secondary: '#9CA3AF', 
        glow: '#6B7280',
        shadow: 'rgba(107, 114, 128, 0.5)'
      }
  }
}

const tileBaseStyle = css`
  position: relative;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  perspective: 1000px;
  user-select: none;
  
  &:hover {
    transform: translateY(-8px) scale(1.05);
    filter: brightness(1.1);
  }
  
  &:active {
    transform: translateY(-4px) scale(0.98);
    transition: all 0.1s;
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

const getTileStyle = (colors: { primary: string; secondary: string; shadow: string }) => css`
  background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary});
  box-shadow: 
    0 10px 20px ${colors.shadow},
    0 6px 6px ${colors.shadow},
    inset 0 -2px 6px rgba(0,0,0,0.1),
    inset 0 2px 6px rgba(255,255,255,0.3);
  border: 2px solid rgba(255,255,255,0.3);
`

const selectedStyle = css`
  transform: translateY(-12px) scale(1.15);
  box-shadow: 
    0 20px 40px rgba(255,255,255,0.3),
    0 10px 20px rgba(255,255,255,0.2);
  filter: brightness(1.2) saturate(1.2);
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { transform: translateY(-12px) scale(1.15); }
    50% { transform: translateY(-15px) scale(1.18); }
  }
`

const clickableStyle = css`
  &:hover {
    transform: translateY(-10px) scale(1.08);
  }
`

const tileContentStyle = css`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 18px;
`

const tileNumberStyle = css`
  position: relative;
  z-index: 3;
  font-weight: 900;
  color: white;
  text-shadow: 
    2px 2px 4px rgba(0,0,0,0.8),
    0 0 10px rgba(255,255,255,0.3);
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  line-height: 1;
`

const tileShineStyle = css`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255,255,255,0.1),
    transparent
  );
  transform: rotate(45deg);
  animation: shine 3s ease-in-out infinite;
  
  @keyframes shine {
    0%, 100% { transform: rotate(45deg) translateX(-100%); }
    50% { transform: rotate(45deg) translateX(100%); }
  }
`

const tileGlowStyle = css`
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 25px;
  z-index: -1;
  opacity: 0.6;
  filter: blur(8px);
`

 