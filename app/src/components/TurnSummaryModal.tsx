/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'

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
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: 20px;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }
`

const modalStyle = css`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  color: white;
  overflow: hidden;
  
  @media (max-width: 768px) {
    max-height: calc(100vh - 20px);
    border-radius: 15px;
    width: 100%;
    max-width: none;
  }
  
  @media (max-width: 480px) {
    border-radius: 10px;
  }
`

const headerStyle = css`
  flex-shrink: 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`

const titleStyle = css`
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
  
  @media (max-width: 480px) {
    font-size: 18px;
  }
`

const playerNameStyle = css`
  font-size: 14px;
  opacity: 0.8;
  font-weight: 600;
  
  @media (max-width: 480px) {
    font-size: 12px;
  }
`

const contentStyle = css`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`

const sectionStyle = css`
  margin-bottom: 20px;
`

const sectionTitleStyle = css`
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 700;
  color: #4CAF50;
`

const tilesDisplayStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  @media (max-width: 480px) {
    gap: 6px;
  }
`

const tileChipStyle = css`
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  display: flex;
  align-items: center;
  gap: 6px;
  
  @media (max-width: 480px) {
    padding: 6px 10px;
    font-size: 12px;
    border-radius: 8px;
    gap: 4px;
  }
`

const positionStyle = css`
  font-size: 10px;
  opacity: 0.8;
  font-weight: 500;
`

const sequencesListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const sequenceItemStyle = css`
  padding: 12px;
  border-radius: 10px;
  border: 1px solid transparent;
`

const validSequenceStyle = css`
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.4);
`

const invalidSequenceStyle = css`
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.4);
`

const sequenceCalculationStyle = css`
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 4px;
`

const sequenceScoreStyle = css`
  font-size: 12px;
  opacity: 0.9;
  font-weight: 600;
`

const noSequencesStyle = css`
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  text-align: center;
  padding: 20px;
`

const scoreSummaryStyle = css`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
`

const scoreRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-weight: 600;
`

const totalScoreRowStyle = css`
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 8px;
  padding-top: 12px;
  font-size: 18px;
`

const turnScoreValueStyle = css`
  color: #4CAF50;
  font-weight: 700;
`

const totalScoreValueStyle = css`
  color: #FFD700;
  font-weight: 900;
  font-size: 20px;
`

const footerStyle = css`
  flex-shrink: 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`

const continueButtonStyle = css`
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  min-height: 44px; /* Touch target size */
  
  @media (max-width: 768px) {
    padding: 14px 28px;
    font-size: 16px;
    border-radius: 10px;
  }
  
  @media (max-width: 480px) {
    padding: 16px 32px;
    font-size: 14px;
    width: 100%;
    max-width: 280px;
  }

  &:hover {
    background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
  
  @media (hover: none) {
    &:hover {
      transform: none;
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    }
  }
` 