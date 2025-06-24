/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'

export function NewAgeTheme() {
  return (
    <>
      <Global styles={globalStyles} />
      <div css={backgroundStyle}>
        {/* Parallax layers */}
        <div css={layer1Style} className="parallax-layer-1" />
        <div css={layer2Style} className="parallax-layer-2" />
        <div css={layer3Style} className="parallax-layer-3" />
        <div css={layer4Style} className="parallax-layer-4" />
        
        {/* Floating magical elements */}
        <div css={magicalElementsStyle}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} css={floatingOrbStyle(i)} />
          ))}
        </div>
      </div>
    </>
  )
}

const globalStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Quicksand:wght@300;400;500;600;700&display=swap');

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Quicksand', sans-serif;
    overflow-x: hidden;
    background: transparent;
  }

  html {
    height: 100%;
  }

  #root {
    position: relative;
    z-index: 1;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(139, 69, 19, 0.2);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.6);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 215, 0, 0.8);
  }

  /* Custom animations */
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }

  @keyframes glow {
    0%, 100% { opacity: 0.6; filter: blur(2px); }
    50% { opacity: 1; filter: blur(1px); }
  }

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes burn {
    0% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.05) rotate(1deg); }
    50% { transform: scale(1.02) rotate(-1deg); }
    75% { transform: scale(1.08) rotate(0.5deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  @keyframes countdown-pulse {
    0%, 100% { transform: scale(1); background-color: rgba(255, 69, 0, 0.9); }
    50% { transform: scale(1.2); background-color: rgba(255, 140, 0, 1); }
  }
`

const backgroundStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: linear-gradient(135deg, 
    #2F4F4F 0%,    /* Dark slate gray */
    #1C3B3B 25%,   /* Darker teal */
    #2C5F5F 50%,   /* Medium teal */
    #1A4D4D 75%,   /* Deep teal */
    #123838 100%   /* Very dark teal */
  );
  overflow: hidden;
`

const layer1Style = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 120%;
  height: 120%;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.1) 0%, transparent 30%),
    radial-gradient(circle at 80% 40%, rgba(139, 69, 19, 0.08) 0%, transparent 25%),
    radial-gradient(circle at 40% 80%, rgba(255, 215, 0, 0.06) 0%, transparent 35%);
  animation: float 20s ease-in-out infinite;
`

const layer2Style = css`
  position: absolute;
  top: -20%;
  left: -10%;
  width: 130%;
  height: 140%;
  background: 
    radial-gradient(ellipse at 30% 70%, rgba(34, 139, 34, 0.15) 0%, transparent 40%),
    radial-gradient(ellipse at 70% 30%, rgba(107, 142, 35, 0.12) 0%, transparent 35%),
    radial-gradient(ellipse at 50% 90%, rgba(85, 107, 47, 0.1) 0%, transparent 30%);
  animation: float 25s ease-in-out infinite reverse;
`

const layer3Style = css`
  position: absolute;
  bottom: -10%;
  left: -5%;
  width: 110%;
  height: 60%;
  background: 
    linear-gradient(0deg, rgba(34, 139, 34, 0.2) 0%, transparent 70%),
    radial-gradient(ellipse at 20% 100%, rgba(107, 142, 35, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(85, 107, 47, 0.18) 0%, transparent 45%);
  animation: float 30s ease-in-out infinite;
`

const layer4Style = css`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  background: 
    linear-gradient(0deg, rgba(139, 69, 19, 0.15) 0%, transparent 100%),
    radial-gradient(ellipse at 30% 100%, rgba(160, 82, 45, 0.1) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 100%, rgba(210, 180, 140, 0.08) 0%, transparent 50%);
`

const magicalElementsStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`

const floatingOrbStyle = (index: number) => {
  // Ensure index is a valid number with bounds checking
  const safeIndex = typeof index === 'number' && !isNaN(index) && index >= 0 ? index : 0
  const orbSize = Math.round(4 + (safeIndex % 3) * 2)
  const leftPosition = Math.round((safeIndex * 73) % 100)
  const topPosition = Math.round((safeIndex * 47) % 100)
  const floatDuration = Math.round(15 + (safeIndex % 5) * 3)
  const glowDuration = Math.round(8 + (safeIndex % 4) * 2)
  const animDelay = Math.round(safeIndex * 0.5 * 10) / 10 // Round to 1 decimal place
  
  return css`
    position: absolute;
    width: ${orbSize}px;
    height: ${orbSize}px;
    border-radius: 50%;
    background: radial-gradient(circle, 
      rgba(255, 215, 0, 0.8) 0%, 
      rgba(255, 215, 0, 0.4) 50%, 
      transparent 100%
    );
    left: ${leftPosition}%;
    top: ${topPosition}%;
    animation: 
      float ${floatDuration}s ease-in-out infinite,
      glow ${glowDuration}s ease-in-out infinite;
    animation-delay: ${animDelay}s;
  `
} 