/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'

export function SimpleTheme() {
  return (
    <>
      <Global styles={globalStyles} />
      <div css={backgroundStyle} />
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
    background: #2F4F4F;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes glow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes burn {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
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
  background: linear-gradient(135deg, #2F4F4F 0%, #1C3B3B 100%);
` 