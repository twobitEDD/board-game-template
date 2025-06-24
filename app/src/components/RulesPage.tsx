/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState } from 'react'
import { getRulesForConfiguration } from '../data/gameRules'

interface RulesPageProps {
  onBackToGame?: () => void
}

export function RulesPage({ onBackToGame }: RulesPageProps) {
  const [sacredNumber, setSacredNumber] = useState(5)
  const [handSize, setHandSize] = useState(5)
  const [currentSection, setCurrentSection] = useState('overview')
  
  const rules = getRulesForConfiguration(sacredNumber, handSize)
  const currentSectionData = rules.sections.find(s => s.id === currentSection)

  return (
    <div css={containerStyle}>
      {/* Ancient Book Cover */}
      <div css={bookStyle}>
        <div css={bookCoverStyle}>
          <div css={bookTitleStyle}>
            <div css={mainTitleStyle}>{rules.title}</div>
            <div css={subtitleStyle}>{rules.subtitle}</div>
            <div css={versionStyle}>Tome {rules.version}</div>
          </div>
          
                     <div css={configPanelStyle}>
             <div css={configGroupStyle}>
               <div css={configLabelStyle}>Sacred Number:</div>
               <div css={configButtonsStyle}>
                 {[3, 5, 7].map(num => (
                   <button
                     key={num}
                     css={[configButtonStyle, sacredNumber === num && activeConfigButtonStyle]}
                     onClick={() => setSacredNumber(num)}
                   >
                     {num}
                   </button>
                 ))}
               </div>
             </div>
             
             <div css={configGroupStyle}>
               <div css={configLabelStyle}>Hand Size:</div>
               <div css={configButtonsStyle}>
                 {[3, 5, 7].map(num => (
                   <button
                     key={num}
                     css={[configButtonStyle, handSize === num && activeConfigButtonStyle]}
                     onClick={() => setHandSize(num)}
                   >
                     {num}
                   </button>
                 ))}
               </div>
             </div>
           </div>

          {onBackToGame && (
            <button onClick={onBackToGame} css={backButtonStyle}>
              ← Return to The Great Loom
            </button>
          )}
        </div>

        {/* Table of Contents */}
        <div css={tocStyle}>
          <h3 css={tocTitleStyle}>Table of Contents</h3>
          <div css={tocListStyle}>
            {rules.sections.map((section, index) => (
              <div
                key={section.id}
                css={[tocItemStyle, currentSection === section.id && activeTocItemStyle]}
                onClick={() => setCurrentSection(section.id)}
              >
                <span css={tocNumberStyle}>{(index + 1).toString().padStart(2, '0')}</span>
                <span css={tocTextStyle}>{section.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Pages */}
        <div css={pagesStyle}>
          {currentSectionData && (
            <div css={pageStyle}>
              <div css={pageHeaderStyle}>
                <h2 css={pageTitleStyle}>{currentSectionData.title}</h2>
                <div css={pageNumberStyle}>
                  {rules.sections.findIndex(s => s.id === currentSection) + 1} / {rules.sections.length}
                </div>
              </div>

              <div css={pageContentStyle}>
                {/* Main Content */}
                <div css={contentSectionStyle}>
                  {currentSectionData.content.map((paragraph, index) => (
                    <p key={index} css={paragraphStyle}>
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Examples */}
                {currentSectionData.examples && currentSectionData.examples.length > 0 && (
                  <div css={examplesStyle}>
                    <h4 css={examplesTitleStyle}>📜 Ancient Examples</h4>
                    {currentSectionData.examples.map((example, index) => (
                      <div key={index} css={exampleStyle}>
                        <div css={exampleHeaderStyle}>{example.description}</div>
                        {example.setup && (
                          <div css={exampleSetupStyle}>
                            <strong>Setup:</strong> {example.setup}
                          </div>
                        )}
                        <div css={exampleResultStyle}>
                          <strong>Result:</strong> {example.result}
                        </div>
                        {example.points !== undefined && (
                          <div css={examplePointsStyle}>
                            <strong>Points:</strong> {example.points}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {currentSectionData.notes && currentSectionData.notes.length > 0 && (
                  <div css={notesStyle}>
                    <h4 css={notesTitleStyle}>🔮 Weaver's Notes</h4>
                    {currentSectionData.notes.map((note, index) => (
                      <div key={index} css={noteStyle}>
                        • {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div css={navigationStyle}>
                <button
                  css={navButtonStyle}
                  onClick={() => {
                    const currentIndex = rules.sections.findIndex(s => s.id === currentSection)
                    if (currentIndex > 0) {
                      setCurrentSection(rules.sections[currentIndex - 1].id)
                    }
                  }}
                  disabled={rules.sections.findIndex(s => s.id === currentSection) === 0}
                >
                  ← Previous
                </button>
                
                <button
                  css={navButtonStyle}
                  onClick={() => {
                    const currentIndex = rules.sections.findIndex(s => s.id === currentSection)
                    if (currentIndex < rules.sections.length - 1) {
                      setCurrentSection(rules.sections[currentIndex + 1].id)
                    }
                  }}
                  disabled={rules.sections.findIndex(s => s.id === currentSection) === rules.sections.length - 1}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ancient Background */}
      <div css={backgroundStyle} />
    </div>
  )
}

const containerStyle = css`
  height: 100vh !important;
  background: radial-gradient(ellipse at center, #2d3748 0%, #1a202c 70%, #0f1419 100%);
  display: block !important;
  padding: 2rem;
  position: relative;
  overflow-y: scroll !important;
  overflow-x: hidden !important;
`

const backgroundStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(32, 178, 170, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(139, 69, 19, 0.02) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
`

const bookStyle = css`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  background: linear-gradient(145deg, #f7e6c8 0%, #e8d5b7 50%, #d4c4a8 100%);
  border-radius: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: visible !important;
  margin-bottom: 4rem;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 20px,
        rgba(139, 69, 19, 0.03) 20px,
        rgba(139, 69, 19, 0.03) 21px
      );
    pointer-events: none;
  }
`

const bookCoverStyle = css`
  padding: 3rem;
  text-align: center;
  border-bottom: 3px solid rgba(139, 69, 19, 0.2);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, transparent 50%);
`

const bookTitleStyle = css`
  margin-bottom: 2rem;
`

const mainTitleStyle = css`
  font-family: 'Fredoka One', serif;
  font-size: 3.5rem;
  color: #8B4513;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
`

const subtitleStyle = css`
  font-family: 'Quicksand', serif;
  font-size: 1.5rem;
  color: #A0522D;
  font-style: italic;
  margin-bottom: 1rem;
`

const versionStyle = css`
  font-size: 1rem;
  color: #8B7355;
  font-weight: 600;
`

const configPanelStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
  padding: 1rem;
  background: rgba(139, 69, 19, 0.1);
  border-radius: 12px;
  border: 2px solid rgba(139, 69, 19, 0.2);
`

const configGroupStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`

const configLabelStyle = css`
  font-family: 'Quicksand', serif;
  font-weight: 600;
  color: #8B4513;
  font-size: 1.1rem;
`

const configButtonsStyle = css`
  display: flex;
  gap: 0.5rem;
`

const configButtonStyle = css`
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(139, 69, 19, 0.3);
  border-radius: 8px;
  color: #8B4513;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const activeConfigButtonStyle = css`
  background: rgba(255, 215, 0, 0.3);
  border-color: #FFD700;
  color: #B8860B;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
`

const backButtonStyle = css`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #2E8B57, #20B2AA);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`

const tocStyle = css`
  padding: 2rem;
  background: rgba(139, 69, 19, 0.05);
  border-bottom: 2px solid rgba(139, 69, 19, 0.1);
`

const tocTitleStyle = css`
  font-family: 'Fredoka One', serif;
  color: #8B4513;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
`

const tocListStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 0.5rem;
`

const tocItemStyle = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
  }
`

const activeTocItemStyle = css`
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
  color: #B8860B;
  font-weight: 600;
`

const tocNumberStyle = css`
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #A0522D;
  font-size: 0.9rem;
`

const tocTextStyle = css`
  font-family: 'Quicksand', serif;
  color: #8B4513;
`

const pagesStyle = css`
  min-height: 600px;
  overflow: visible !important;
  height: auto !important;
`

const pageStyle = css`
  padding: 3rem;
  color: #4A4A4A;
  line-height: 1.6;
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
`

const pageHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(139, 69, 19, 0.2);
`

const pageTitleStyle = css`
  font-family: 'Fredoka One', serif;
  color: #8B4513;
  font-size: 2rem;
  margin: 0;
`

const pageNumberStyle = css`
  font-family: 'Courier New', monospace;
  color: #A0522D;
  font-weight: bold;
  background: rgba(139, 69, 19, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 6px;
`

const pageContentStyle = css`
  margin-bottom: 2rem;
`

const contentSectionStyle = css`
  margin-bottom: 2rem;
`

const paragraphStyle = css`
  margin-bottom: 1rem;
  font-size: 1.1rem;
  text-align: justify;
`

const examplesStyle = css`
  background: rgba(32, 178, 170, 0.05);
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #20B2AA;
  margin: 1.5rem 0;
`

const examplesTitleStyle = css`
  font-family: 'Fredoka One', serif;
  color: #20B2AA;
  margin-bottom: 1rem;
  font-size: 1.2rem;
`

const exampleStyle = css`
  background: rgba(255, 255, 255, 0.3);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid rgba(32, 178, 170, 0.2);
  
  &:last-child {
    margin-bottom: 0;
  }
`

const exampleHeaderStyle = css`
  font-weight: 600;
  color: #2C7A7B;
  margin-bottom: 0.5rem;
`

const exampleSetupStyle = css`
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
`

const exampleResultStyle = css`
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
`

const examplePointsStyle = css`
  font-size: 0.95rem;
  color: #2C7A7B;
`

const notesStyle = css`
  background: rgba(255, 215, 0, 0.05);
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #FFD700;
  margin: 1.5rem 0;
`

const notesTitleStyle = css`
  font-family: 'Fredoka One', serif;
  color: #B8860B;
  margin-bottom: 1rem;
  font-size: 1.2rem;
`

const noteStyle = css`
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  color: #8B7355;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const navigationStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 2px solid rgba(139, 69, 19, 0.1);
`

const navButtonStyle = css`
  padding: 0.75rem 1.5rem;
  background: rgba(139, 69, 19, 0.1);
  border: 2px solid rgba(139, 69, 19, 0.2);
  border-radius: 8px;
  color: #8B4513;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(139, 69, 19, 0.2);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
` 