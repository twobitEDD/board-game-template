/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"

export function DynamicConnectButton() {
  const { setShowAuthFlow, user, handleLogOut } = useDynamicContext()

  const handleConnect = () => {
    setShowAuthFlow(true)
  }

  if (user) {
    return (
      <div css={connectedContainerStyle}>
        <span css={userInfoStyle}>
          {user.email || user.alias || 'Connected'}
        </span>
        <button css={disconnectButtonStyle} onClick={handleLogOut} title="Disconnect Wallet">
          ⚡
        </button>
      </div>
    )
  }

  return (
    <button css={connectButtonStyle} onClick={handleConnect} title="Connect Wallet">
      🔗 Connect
    </button>
  )
}

const connectButtonStyle = css`
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 12px;
  padding: 8px 16px;
  color: #FFD700;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.2));
    border-color: #FFD700;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const connectedContainerStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 128, 0, 0.1);
  border: 2px solid rgba(0, 255, 0, 0.3);
  border-radius: 12px;
  padding: 6px 12px;
  backdrop-filter: blur(5px);
`

const userInfoStyle = css`
  color: #90EE90;
  font-size: 0.8rem;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const disconnectButtonStyle = css`
  background: rgba(255, 99, 71, 0.2);
  border: 1px solid rgba(255, 99, 71, 0.4);
  border-radius: 6px;
  padding: 4px 8px;
  color: #FF6347;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 99, 71, 0.3);
    border-color: #FF6347;
    transform: scale(1.05);
  }
` 