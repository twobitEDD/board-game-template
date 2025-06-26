/** @jsxImportSource @emotion/react */
import { useState, useEffect } from 'react'
import { css } from '@emotion/react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { userService, UserProfile as UserProfileType, SavedGame } from '../services/UserService'

interface UserProfileProps {
  onClose: () => void
  onLoadGame?: (savedGame: SavedGame) => void
}

export function UserProfile({ onClose, onLoadGame }: UserProfileProps) {
  const { user, setShowAuthFlow } = useDynamicContext()
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null)
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'games' | 'stats'>('profile')
  
  const isAuthenticated = !!user

  useEffect(() => {
    const profile = userService.getCurrentUser()
    setUserProfile(profile)
    
    if (profile) {
      setSavedGames(userService.getUserSavedGames())
    }
  }, [])

  const handleLogin = () => {
    setShowAuthFlow(true)
  }

  const handleLogout = async () => {
    await userService.logout()
    setUserProfile(null)
    setSavedGames([])
  }

  const handleDeleteGame = (gameId: string) => {
    if (window.confirm('Are you sure you want to delete this saved game?')) {
      userService.deleteGame(gameId)
      setSavedGames(userService.getUserSavedGames())
    }
  }

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div css={overlayStyle}>
      <div css={modalStyle}>
        <div css={headerStyle}>
          <h2>Player Profile</h2>
          <button css={closeButtonStyle} onClick={onClose}>×</button>
        </div>

        <div css={tabsStyle}>
          <button 
            css={[tabStyle, activeTab === 'profile' && activeTabStyle]}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            css={[tabStyle, activeTab === 'stats' && activeTabStyle]}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
          <button 
            css={[tabStyle, activeTab === 'games' && activeTabStyle]}
            onClick={() => setActiveTab('games')}
          >
            Saved Games ({savedGames.length})
          </button>
        </div>

        <div css={contentStyle}>
          {activeTab === 'profile' && (
            <div css={profileTabStyle}>
              {isAuthenticated && user ? (
                <div css={userInfoStyle}>
                  <div css={avatarStyle}>
                    {userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt="Avatar" />
                    ) : (
                      <div css={defaultAvatarStyle}>
                        {(user.email || user.alias || 'P')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div css={userDetailsStyle}>
                    <h3>{userProfile?.displayName || user.email || user.alias}</h3>
                    <p css={emailStyle}>{user.email}</p>
                                         {userProfile?.walletAddress && (
                       <p css={walletStyle}>
                         Wallet: {userProfile.walletAddress.slice(0, 6)}...{userProfile.walletAddress.slice(-4)}
                       </p>
                     )}
                    <p css={memberSinceStyle}>
                      Member since {formatDate(userProfile?.createdAt || Date.now())}
                    </p>
                  </div>
                  <button css={logoutButtonStyle} onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : (
                <div css={guestInfoStyle}>
                  <div css={guestAvatarStyle}>
                    {(userProfile?.displayName || 'G')[0].toUpperCase()}
                  </div>
                  <div css={userDetailsStyle}>
                    <h3>{userProfile?.displayName || 'Guest Player'}</h3>
                    <p css={guestTextStyle}>Playing as guest</p>
                    <p css={memberSinceStyle}>
                      Session started {formatDate(userProfile?.createdAt || Date.now())}
                    </p>
                  </div>
                  <button css={loginButtonStyle} onClick={handleLogin}>
                    Sign In / Sign Up
                  </button>
                </div>
              )}

              <div css={preferencesStyle}>
                <h4>Preferences</h4>
                <div css={preferenceItemStyle}>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={userProfile?.preferences.autoSave ?? true}
                      onChange={(e) => {
                                                                          userService.updateUserProfile({
                           preferences: {
                             autoSave: e.target.checked
                           }
                         })
                         setUserProfile(userService.getCurrentUser())
                       }}
                     />
                     Auto-save games
                   </label>
                 </div>
                 <div css={preferenceItemStyle}>
                   <label>
                     <input 
                       type="checkbox" 
                       checked={userProfile?.preferences.soundEnabled ?? true}
                       onChange={(e) => {
                         userService.updateUserProfile({
                           preferences: {
                             soundEnabled: e.target.checked
                           }
                         })
                        setUserProfile(userService.getCurrentUser())
                      }}
                    />
                    Sound effects
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && userProfile && (
            <div css={statsTabStyle}>
              <div css={statsGridStyle}>
                <div css={statCardStyle}>
                  <h4>Games Played</h4>
                  <div css={statValueStyle}>{userProfile.gameStats.totalGamesPlayed}</div>
                </div>
                <div css={statCardStyle}>
                  <h4>Total Wins</h4>
                  <div css={statValueStyle}>{userProfile.gameStats.totalWins}</div>
                </div>
                <div css={statCardStyle}>
                  <h4>Win Rate</h4>
                  <div css={statValueStyle}>
                    {userProfile.gameStats.totalGamesPlayed > 0 
                      ? Math.round((userProfile.gameStats.totalWins / userProfile.gameStats.totalGamesPlayed) * 100)
                      : 0}%
                  </div>
                </div>
                <div css={statCardStyle}>
                  <h4>Highest Score</h4>
                  <div css={statValueStyle}>{userProfile.gameStats.highestScore.toLocaleString()}</div>
                </div>
                <div css={statCardStyle}>
                  <h4>Average Score</h4>
                  <div css={statValueStyle}>{Math.round(userProfile.gameStats.averageScore).toLocaleString()}</div>
                </div>
                <div css={statCardStyle}>
                  <h4>Play Time</h4>
                  <div css={statValueStyle}>{formatTime(userProfile.gameStats.totalPlayTime)}</div>
                </div>
                <div css={statCardStyle}>
                  <h4>Win Streak</h4>
                  <div css={statValueStyle}>{userProfile.gameStats.currentWinStreak}</div>
                </div>
                <div css={statCardStyle}>
                  <h4>Best Streak</h4>
                  <div css={statValueStyle}>{userProfile.gameStats.longestWinStreak}</div>
                </div>
              </div>

              {userProfile.gameStats.achievements.length > 0 && (
                <div css={achievementsStyle}>
                  <h4>Achievements</h4>
                  <div css={achievementListStyle}>
                    {userProfile.gameStats.achievements.map((achievement, index) => (
                      <div key={index} css={achievementStyle}>
                        {achievement}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'games' && (
            <div css={gamesTabStyle}>
              {savedGames.length === 0 ? (
                <div css={noGamesStyle}>
                  <p>No saved games yet</p>
                  <p css={hintStyle}>Games are automatically saved when you start playing</p>
                </div>
              ) : (
                <div css={gameListStyle}>
                  {savedGames.map((game) => (
                    <div key={game.id} css={gameItemStyle}>
                      <div css={gameInfoStyle}>
                        <h4>{game.gameMode} Game</h4>
                        <p>Turn {game.turnNumber} • Score: {game.playerScores[0]?.toLocaleString() || 0}</p>
                        <p css={gameDateStyle}>{formatDate(game.savedAt)}</p>
                      </div>
                      <div css={gameActionsStyle}>
                        {onLoadGame && (
                          <button 
                            css={loadButtonStyle}
                            onClick={() => onLoadGame(game)}
                          >
                            Load
                          </button>
                        )}
                        <button 
                          css={deleteButtonStyle}
                          onClick={() => handleDeleteGame(game.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
`

const modalStyle = css`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  width: 90vw;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  
  h2 {
    color: #ffd700;
    margin: 0;
    font-size: 1.5rem;
  }
`

const closeButtonStyle = css`
  background: none;
  border: none;
  color: #ffd700;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  
  &:hover {
    color: #fff;
  }
`

const tabsStyle = css`
  display: flex;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
`

const tabStyle = css`
  flex: 1;
  padding: 12px 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
  }
`

const activeTabStyle = css`
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  border-bottom: 2px solid #ffd700;
`

const contentStyle = css`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`

const profileTabStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const userInfoStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.2);
`

const guestInfoStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const avatarStyle = css`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const defaultAvatarStyle = css`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #1a1a2e;
`

const guestAvatarStyle = css`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #666, #888);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
`

const userDetailsStyle = css`
  flex: 1;
  
  h3 {
    color: #fff;
    margin: 0 0 4px 0;
    font-size: 1.2rem;
  }
`

const emailStyle = css`
  color: #ffd700;
  margin: 0 0 4px 0;
  font-size: 0.9rem;
`

const walletStyle = css`
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 4px 0;
  font-size: 0.8rem;
  font-family: monospace;
`

const memberSinceStyle = css`
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-size: 0.8rem;
`

const guestTextStyle = css`
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 4px 0;
  font-size: 0.9rem;
`

const loginButtonStyle = css`
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #1a1a2e;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`

const logoutButtonStyle = css`
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

const preferencesStyle = css`
  h4 {
    color: #ffd700;
    margin: 0 0 12px 0;
  }
`

const preferenceItemStyle = css`
  margin-bottom: 8px;
  
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #fff;
    cursor: pointer;
    
    input[type="checkbox"] {
      accent-color: #ffd700;
    }
  }
`

const statsTabStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const statsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
`

const statCardStyle = css`
  background: rgba(255, 215, 0, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  
  h4 {
    color: #ffd700;
    margin: 0 0 8px 0;
    font-size: 0.8rem;
    text-transform: uppercase;
  }
`

const statValueStyle = css`
  color: #fff;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
`

const achievementsStyle = css`
  h4 {
    color: #ffd700;
    margin: 0 0 12px 0;
  }
`

const achievementListStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const achievementStyle = css`
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  padding: 4px 12px;
  color: #ffd700;
  font-size: 0.8rem;
`

const gamesTabStyle = css`
  height: 100%;
`

const noGamesStyle = css`
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  padding: 40px 20px;
  
  p {
    margin: 0 0 8px 0;
  }
`

const hintStyle = css`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
`

const gameListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const gameItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`

const gameInfoStyle = css`
  flex: 1;
  
  h4 {
    color: #fff;
    margin: 0 0 4px 0;
    font-size: 1rem;
  }
  
  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.9rem;
  }
`

const gameDateStyle = css`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
`

const gameActionsStyle = css`
  display: flex;
  gap: 8px;
`

const loadButtonStyle = css`
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #1a1a2e;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-1px);
  }
`

const deleteButtonStyle = css`
  background: rgba(255, 0, 0, 0.2);
  color: #ff6b6b;
  border: 1px solid rgba(255, 0, 0, 0.3);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 0, 0, 0.3);
  }
` 