/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'
import { QuiltingWorkshopTheme } from './QuiltingWorkshopTheme'

interface TileItem {
  id: NumberTileId
  uniqueId: string
  location: {
    type: string
    x?: number
    y?: number
    player?: any
  }
}

interface TurnSequence {
  tiles: TileItem[]
  sum: number
}

interface TurnSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  turnNumber: number
  playerName: string
  tilesPlaced: TileItem[]
  sequences: TurnSequence[]
  turnScore: number
  totalScore: number
  isGameEnd?: boolean
}

export function TurnSummaryModal({ 
  isOpen, 
  onClose, 
  turnNumber, 
  playerName, 
  tilesPlaced, 
  sequences, 
  turnScore, 
  totalScore,
  isGameEnd = false
}: TurnSummaryModalProps) {
  if (!isOpen) return null

  const getTileValue = (tileId: NumberTileId): number => {
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

  return (
    <div css={overlayStyle} onClick={onClose}>
      <div css={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div css={headerStyle}>
          <h2 css={titleStyle}>
            {isGameEnd ? '🏆 Game Complete!' : `⭐ Turn ${turnNumber} Complete!`}
          </h2>
          <div css={playerNameStyle}>{playerName}</div>
        </div>

        <div css={contentStyle}>
          {/* Tiles Placed */}
          <div css={sectionStyle}>
            <h3 css={sectionTitleStyle}>Tiles Placed:</h3>
            <div css={tilesDisplayStyle}>
              {tilesPlaced.map((tile) => (
                <div key={tile.uniqueId} css={tileChipStyle}>
                  {getTileValue(tile.id)}
                  <span css={positionStyle}>
                    ({tile.location.x}, {tile.location.y})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sequences Created */}
          <div css={sectionStyle}>
            <h3 css={sectionTitleStyle}>Sequences Created:</h3>
            {sequences.length > 0 ? (
              <div css={sequencesListStyle}>
                {sequences.map((seq, index) => {
                  const tileValues = seq.tiles.map(t => getTileValue(t.id))
                  const isValid = seq.sum % 5 === 0
                  return (
                    <div key={index} css={[sequenceItemStyle, isValid ? validSequenceStyle : invalidSequenceStyle]}>
                      <div css={sequenceCalculationStyle}>
                        {tileValues.join(' + ')} = {seq.sum}
                      </div>
                      <div css={sequenceScoreStyle}>
                        {isValid ? `${seq.sum} × 10 = ${seq.sum * 10} pts` : 'Invalid (not multiple of 5)'}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div css={noSequencesStyle}>No scoring sequences created</div>
            )}
          </div>

          {/* Score Summary */}
          <div css={scoreSummaryStyle}>
            <div css={scoreRowStyle}>
              <span>Turn Score:</span>
              <span css={turnScoreValueStyle}>+{turnScore} pts</span>
            </div>
            <div css={[scoreRowStyle, totalScoreRowStyle]}>
              <span>Total Score:</span>
              <span css={totalScoreValueStyle}>{totalScore} pts</span>
            </div>
          </div>
        </div>

        <div css={footerStyle}>
          <button css={continueButtonStyle} onClick={onClose}>
            {isGameEnd ? 'View Final Results' : 'Continue Game'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Styles
const overlayStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  padding: 20px;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }
`

const modalStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(139, 69, 19, 0.95) 0%, 
      rgba(160, 82, 45, 0.95) 50%, 
      rgba(218, 165, 32, 0.95) 100%);
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  color: ${QuiltingWorkshopTheme.colors.text};
  overflow: hidden;
  
  /* Warm cozy atmosphere like reference */
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(139, 69, 19, 0.1) 1px, transparent 1px);
  background-size: 30px 30px, 20px 20px;
  
  @media (max-width: 768px) {
    max-height: calc(100vh - 20px);
    border-radius: 12px;
    width: 100%;
    max-width: none;
  }
  
  @media (max-width: 480px) {
    border-radius: 8px;
  }
`

const headerStyle = css`
  flex-shrink: 0;
  padding: 20px;
  background: 
    linear-gradient(135deg, 
      rgba(255, 215, 0, 0.2) 0%, 
      rgba(218, 165, 32, 0.15) 100%);
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`

const titleStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.8rem;
  font-weight: bold;
  color: ${QuiltingWorkshopTheme.colors.accent};
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.3rem;
  }
`

const playerNameStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 1.2rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`

const contentStyle = css`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  @media (max-width: 768px) {
    padding: 15px;
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    gap: 12px;
  }
`

const sectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const sectionTitleStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.title};
  font-size: 1.2rem;
  font-weight: bold;
  color: ${QuiltingWorkshopTheme.colors.accent};
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`

const tilesDisplayStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const tileChipStyle = css`
  padding: 6px 12px;
  background: 
    linear-gradient(135deg, 
      rgba(255, 215, 0, 0.3) 0%, 
      rgba(218, 165, 32, 0.2) 100%);
  border-radius: 8px;
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-weight: bold;
  color: ${QuiltingWorkshopTheme.colors.text};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
`

const positionStyle = css`
  font-size: 0.8rem;
  opacity: 0.8;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
`

const sequencesListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const sequenceItemStyle = css`
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 215, 0, 0.1);
`

const validSequenceStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(34, 197, 94, 0.2) 0%, 
      rgba(22, 163, 74, 0.15) 100%);
`

const invalidSequenceStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(239, 68, 68, 0.2) 0%, 
      rgba(220, 38, 38, 0.15) 100%);
`

const sequenceCalculationStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-weight: bold;
  color: ${QuiltingWorkshopTheme.colors.text};
  margin-bottom: 4px;
`

const sequenceScoreStyle = css`
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-size: 0.9rem;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
`

const noSequencesStyle = css`
  padding: 12px;
  text-align: center;
  color: ${QuiltingWorkshopTheme.colors.textSecondary};
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-style: italic;
`

const scoreSummaryStyle = css`
  background: 
    linear-gradient(135deg, 
      rgba(255, 215, 0, 0.15) 0%, 
      rgba(218, 165, 32, 0.1) 100%);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const scoreRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  color: ${QuiltingWorkshopTheme.colors.text};
`

const turnScoreValueStyle = css`
  font-weight: bold;
  color: ${QuiltingWorkshopTheme.colors.accent};
`

const totalScoreRowStyle = css`
  border-top: 2px solid rgba(255, 215, 0, 0.3);
  padding-top: 8px;
  font-weight: bold;
`

const totalScoreValueStyle = css`
  font-weight: bold;
  color: ${QuiltingWorkshopTheme.colors.accent};
  font-size: 1.1rem;
`

const footerStyle = css`
  flex-shrink: 0;
  padding: 20px;
  display: flex;
  justify-content: center;
  background: 
    linear-gradient(135deg, 
      rgba(139, 69, 19, 0.2) 0%, 
      rgba(160, 82, 45, 0.15) 100%);
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`

const continueButtonStyle = css`
  padding: 12px 24px;
  background: 
    linear-gradient(135deg, 
      ${QuiltingWorkshopTheme.colors.accent} 0%, 
      rgba(218, 165, 32, 0.8) 100%);
  color: ${QuiltingWorkshopTheme.colors.text};
  border: none;
  border-radius: 8px;
  font-family: ${QuiltingWorkshopTheme.fonts.body};
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }
  
  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
  
  @media (max-width: 480px) {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
` 