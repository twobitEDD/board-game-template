/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { DynamicConnectButton } from './DynamicConnectButton'

interface NavigationProps {
  currentPage?: string
  showWalletButton?: boolean
}

export function Navigation({ currentPage, showWalletButton = true }: NavigationProps) {
  const { user } = useDynamicContext()

  const handleNavigation = (path: string) => {
    window.location.pathname = path
  }

  return (
    <nav css={navStyle}>
      <div css={navContainerStyle}>
        {/* Logo and title */}
        <div css={logoSectionStyle} onClick={() => handleNavigation('/')}>
          <h2 css={logoStyle}>SUMMON5</h2>
        </div>

        {/* Navigation links */}
        <div css={navLinksStyle}>
          <button
            css={[navLinkStyle, currentPage === 'home' && activeLinkStyle]}
            onClick={() => handleNavigation('/')}
          >
            🏠 Home
          </button>
          <button
            css={[navLinkStyle, currentPage === 'setup' && activeLinkStyle]}
            onClick={() => handleNavigation('/setup')}
          >
            🎮 Play Solo
          </button>
          <button
            css={[navLinkStyle, currentPage === 'gallery' && activeLinkStyle]}
            onClick={() => handleNavigation('/gallery')}
          >
            🎯 Live Games
          </button>
          <button
            css={[navLinkStyle, currentPage === 'rules' && activeLinkStyle]}
            onClick={() => handleNavigation('/rules')}
          >
            📚 Rules
          </button>
        </div>

        {/* Wallet connection */}
        {showWalletButton && (
          <div css={walletSectionStyle}>
            {user ? (
              <div css={userInfoStyle}>
                <span css={userNameStyle}>
                  {user.email || user.alias || 'Player'}
                </span>
                <DynamicConnectButton />
              </div>
            ) : (
              <DynamicConnectButton />
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

// Styles
const navStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 70px;
`

const navContainerStyle = css`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
    gap: 1rem;
  }
`

const logoSectionStyle = css`
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }
`

const logoStyle = css`
  font-size: 1.5rem;
  font-weight: 900;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  font-family: 'Quicksand', sans-serif;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`

const navLinksStyle = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`

const navLinkStyle = css`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
`

const activeLinkStyle = css`
  color: #FFD700;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
`

const walletSectionStyle = css`
  display: flex;
  align-items: center;
`

const userInfoStyle = css`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`

const userNameStyle = css`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 500;

  @media (max-width: 768px) {
    display: none;
  }
` 