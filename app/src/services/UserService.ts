// User Authentication and Data Persistence Service
// Integrates Dynamic for user accounts with enhanced local storage

export interface UserProfile {
  id: string
  email?: string
  displayName: string
  avatar?: string
  walletAddress?: string
  createdAt: number
  lastLoginAt: number
  gameStats: GameStats
  preferences: UserPreferences
}

export interface GameStats {
  totalGamesPlayed: number
  totalWins: number
  totalScore: number
  highestScore: number
  averageScore: number
  totalPlayTime: number // in milliseconds
  achievements: string[]
  favoriteGameMode?: string
  longestWinStreak: number
  currentWinStreak: number
}

export interface UserPreferences {
  theme: 'newage' | 'mystical' | 'retro' | 'simple'
  soundEnabled: boolean
  animationsEnabled: boolean
  autoSave: boolean
  gameSpeed: 'slow' | 'normal' | 'fast'
  showTutorials: boolean
  preferredPlayerCount: number
  defaultGameMode: 'classic' | 'speedrun' | 'perfectionist' | 'minimalist'
}

export interface SavedGame {
  id: string
  userId: string
  gameConfig: any // GameConfig type
  gameState: any // GameState type
  savedAt: number
  gameStartedAt: number
  turnNumber: number
  playerScores: number[]
  gameMode: string
  isCompleted: boolean
  completedAt?: number
}

class UserService {
  private static instance: UserService
  private currentUser: UserProfile | null = null
  private isInitialized = false

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  // Initialize the service - call this on app startup
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Load user from localStorage if exists
      const savedUser = this.loadUserFromStorage()
      if (savedUser) {
        this.currentUser = savedUser
        this.updateLastLogin()
      }

      this.isInitialized = true
      console.log('🔐 UserService initialized', this.currentUser ? 'with user' : 'without user')
    } catch (error) {
      console.error('Failed to initialize UserService:', error)
    }
  }

  // Create a new guest user (for offline play)
  createGuestUser(displayName: string = 'Guest Player'): UserProfile {
    const guestUser: UserProfile = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      displayName,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      gameStats: this.createEmptyGameStats(),
      preferences: this.createDefaultPreferences()
    }

    this.currentUser = guestUser
    this.saveUserToStorage()
    return guestUser
  }

  // Dynamic authentication methods (placeholder for when Dynamic is installed)
  async authenticateWithDynamic(): Promise<UserProfile | null> {
    // TODO: Implement Dynamic authentication
    console.log('🔄 Dynamic authentication not yet implemented')
    return null
  }

  async logout(): Promise<void> {
    if (this.currentUser) {
      console.log('👋 User logged out:', this.currentUser.displayName)
      this.currentUser = null
      this.clearUserFromStorage()
    }
  }

  // User profile management
  getCurrentUser(): UserProfile | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  updateUserProfile(updates: Partial<Omit<UserProfile, 'preferences'>> & { preferences?: Partial<UserPreferences> }): void {
    if (!this.currentUser) return

    this.currentUser = { 
      ...this.currentUser, 
      ...updates,
      preferences: updates.preferences ? {
        ...this.currentUser.preferences,
        ...updates.preferences
      } : this.currentUser.preferences
    }
    this.saveUserToStorage()
  }

  updateGameStats(gameResult: {
    score: number
    won: boolean
    playTime: number
    gameMode: string
  }): void {
    if (!this.currentUser) return

    const stats = this.currentUser.gameStats
    stats.totalGamesPlayed++
    stats.totalScore += gameResult.score
    stats.totalPlayTime += gameResult.playTime

    if (gameResult.won) {
      stats.totalWins++
      stats.currentWinStreak++
      stats.longestWinStreak = Math.max(stats.longestWinStreak, stats.currentWinStreak)
    } else {
      stats.currentWinStreak = 0
    }

    stats.highestScore = Math.max(stats.highestScore, gameResult.score)
    stats.averageScore = stats.totalScore / stats.totalGamesPlayed
    stats.favoriteGameMode = gameResult.gameMode

    this.saveUserToStorage()
  }

  addAchievement(achievement: string): void {
    if (!this.currentUser) return

    if (!this.currentUser.gameStats.achievements.includes(achievement)) {
      this.currentUser.gameStats.achievements.push(achievement)
      this.saveUserToStorage()
      console.log('🏆 New achievement unlocked:', achievement)
    }
  }

  // Game save/load functionality
  saveGame(gameConfig: any, gameState: any, gameMode: string): string {
    if (!this.currentUser) {
      throw new Error('No user authenticated')
    }

    const savedGame: SavedGame = {
      id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      gameConfig,
      gameState,
      savedAt: Date.now(),
      gameStartedAt: Date.now(), // TODO: Pass actual game start time
      turnNumber: gameState.turnNumber || 1,
      playerScores: gameState.scores || gameState.playerScores || [0],
      gameMode,
      isCompleted: false
    }

    const savedGames = this.getSavedGames()
    savedGames.push(savedGame)
    
    // Keep only the last 10 saves per user to prevent storage bloat
    const userSaves = savedGames
      .filter(save => save.userId === this.currentUser!.id)
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, 10)
    
    const otherUserSaves = savedGames.filter(save => save.userId !== this.currentUser!.id)
    const finalSaves = [...otherUserSaves, ...userSaves]

    localStorage.setItem('fives_saved_games', JSON.stringify(finalSaves))
    console.log('💾 Game saved:', savedGame.id)
    return savedGame.id
  }

  getSavedGames(): SavedGame[] {
    try {
      const saved = localStorage.getItem('fives_saved_games')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Failed to load saved games:', error)
      return []
    }
  }

  getUserSavedGames(): SavedGame[] {
    if (!this.currentUser) return []
    
    return this.getSavedGames()
      .filter(save => save.userId === this.currentUser!.id)
      .sort((a, b) => b.savedAt - a.savedAt)
  }

  loadGame(saveId: string): SavedGame | null {
    const savedGames = this.getSavedGames()
    const game = savedGames.find(save => save.id === saveId)
    
    if (game && this.currentUser && game.userId === this.currentUser.id) {
      console.log('📂 Game loaded:', saveId)
      return game
    }
    
    return null
  }

  deleteGame(saveId: string): boolean {
    const savedGames = this.getSavedGames()
    const gameIndex = savedGames.findIndex(save => 
      save.id === saveId && 
      this.currentUser && 
      save.userId === this.currentUser.id
    )
    
    if (gameIndex !== -1) {
      savedGames.splice(gameIndex, 1)
      localStorage.setItem('fives_saved_games', JSON.stringify(savedGames))
      console.log('🗑️ Game deleted:', saveId)
      return true
    }
    
    return false
  }

  // Auto-save functionality
  autoSaveGame(gameConfig: any, gameState: any, gameMode: string): void {
    if (!this.currentUser?.preferences.autoSave) return

    try {
      const autoSaveKey = `fives_autosave_${this.currentUser.id}`
      const autoSave = {
        gameConfig,
        gameState,
        gameMode,
        savedAt: Date.now()
      }
      localStorage.setItem(autoSaveKey, JSON.stringify(autoSave))
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }

  loadAutoSave(): any | null {
    if (!this.currentUser) return null

    try {
      const autoSaveKey = `fives_autosave_${this.currentUser.id}`
      const saved = localStorage.getItem(autoSaveKey)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Failed to load auto-save:', error)
      return null
    }
  }

  clearAutoSave(): void {
    if (!this.currentUser) return

    const autoSaveKey = `fives_autosave_${this.currentUser.id}`
    localStorage.removeItem(autoSaveKey)
  }

  // Private helper methods
  private createEmptyGameStats(): GameStats {
    return {
      totalGamesPlayed: 0,
      totalWins: 0,
      totalScore: 0,
      highestScore: 0,
      averageScore: 0,
      totalPlayTime: 0,
      achievements: [],
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  }

  private createDefaultPreferences(): UserPreferences {
    return {
      theme: 'newage',
      soundEnabled: true,
      animationsEnabled: true,
      autoSave: true,
      gameSpeed: 'normal',
      showTutorials: true,
      preferredPlayerCount: 1,
      defaultGameMode: 'classic'
    }
  }

  private saveUserToStorage(): void {
    if (!this.currentUser) return

    try {
      localStorage.setItem('fives_user_profile', JSON.stringify(this.currentUser))
    } catch (error) {
      console.error('Failed to save user to storage:', error)
    }
  }

  private loadUserFromStorage(): UserProfile | null {
    try {
      const saved = localStorage.getItem('fives_user_profile')
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Failed to load user from storage:', error)
      return null
    }
  }

  private clearUserFromStorage(): void {
    localStorage.removeItem('fives_user_profile')
  }

  private updateLastLogin(): void {
    if (!this.currentUser) return

    this.currentUser.lastLoginAt = Date.now()
    this.saveUserToStorage()
  }

  // Analytics and insights
  getPlayTimeToday(): number {
    // TODO: Implement daily play time tracking
    return 0
  }

  getRecentAchievements(_days: number = 7): string[] {
    if (!this.currentUser) return []
    
    // TODO: Add timestamp to achievements and filter by date
    return this.currentUser.gameStats.achievements.slice(-5)
  }

  exportUserData(): string {
    if (!this.currentUser) return '{}'
    
    const exportData = {
      profile: this.currentUser,
      savedGames: this.getUserSavedGames(),
      exportedAt: Date.now()
    }
    
    return JSON.stringify(exportData, null, 2)
  }
}

// Export singleton instance
export const userService = UserService.getInstance() 