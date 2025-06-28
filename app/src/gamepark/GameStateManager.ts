import { GameState, GameTile, TilePlacement, GameOptions, positionKey } from './GameTypes'
import { FivesGameLogic } from './FivesGameLogic'
import { NumberTileId } from './material/NumberTileId'
import { LocationType } from './material/LocationType'
import { PlayerColor } from './PlayerColor'

export class GameStateManager {
  private gameState: GameState | null = null
  
  /**
   * Initialize a new game
   */
  initializeGame(options: GameOptions): GameState {
    this.gameState = FivesGameLogic.createInitialGameState(
      options.playerNames,
      {
        allowIslands: options.allowIslands,
        tilesPerPlayer: options.tilesPerPlayer
      }
    )
    
    return this.gameState
  }
  
  /**
   * Get current game state
   */
  getGameState(): GameState | null {
    return this.gameState
  }
  
  /**
   * Validate a tile placement
   */
  validatePlacement(placement: TilePlacement, allPlacements: TilePlacement[] = []): { valid: boolean; error?: string } {
    if (!this.gameState) {
      return { valid: false, error: 'Game not initialized' }
    }
    
    return FivesGameLogic.validateTilePlacement(this.gameState, placement, allPlacements)
  }
  
  /**
   * Calculate score for placements
   */
  calculateScore(placements: TilePlacement[]): number {
    if (!this.gameState) return 0
    
    return FivesGameLogic.calculatePlacementScore(this.gameState, placements)
  }
  
  /**
   * Apply placements to game state
   */
  applyPlacements(placements: TilePlacement[]): GameState {
    if (!this.gameState) {
      throw new Error('Game not initialized')
    }
    
    this.gameState = FivesGameLogic.applyMove(this.gameState, placements)
    return this.gameState
  }
  
  /**
   * Get current player
   */
  getCurrentPlayer(): { color: PlayerColor; name: string; index: number } | null {
    if (!this.gameState) return null
    
    const player = this.gameState.players[this.gameState.currentPlayerIndex]
    return {
      color: player.color,
      name: player.name,
      index: this.gameState.currentPlayerIndex
    }
  }
  
  /**
   * Get player's hand
   */
  getPlayerHand(playerColor: PlayerColor): GameTile[] {
    if (!this.gameState) return []
    
    const player = this.gameState.players.find(p => p.color === playerColor)
    return player ? player.hand : []
  }
  
  /**
   * Get board tiles
   */
  getBoardTiles(): Array<{ tile: GameTile; x: number; y: number }> {
    if (!this.gameState) return []
    
    const boardTiles: Array<{ tile: GameTile; x: number; y: number }> = []
    
    for (const [key, tile] of this.gameState.board.entries()) {
      const [x, y] = key.split(',').map(Number)
      boardTiles.push({ tile, x, y })
    }
    
    return boardTiles
  }
  
  /**
   * Get game scores
   */
  getScores(): Array<{ player: string; color: PlayerColor; score: number }> {
    if (!this.gameState) return []
    
    return this.gameState.players.map(player => ({
      player: player.name,
      color: player.color,
      score: player.score
    }))
  }
  
  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    if (!this.gameState) return false
    
    return FivesGameLogic.isGameOver(this.gameState)
  }
  
  /**
   * Get winner
   */
  getWinner(): { color: PlayerColor; name: string; score: number } | null {
    if (!this.gameState || !this.isGameOver()) return null
    
    const winnerColor = FivesGameLogic.getWinner(this.gameState)
    if (!winnerColor) return null
    
    const winner = this.gameState.players.find(p => p.color === winnerColor)
    return winner ? {
      color: winner.color,
      name: winner.name,
      score: winner.score
    } : null
  }
  
  /**
   * Convert blockchain data to game state (for syncing with blockchain)
   */
  syncFromBlockchain(blockchainData: {
    gameId: number
    players: Array<{ address: string; name: string; score: number; hand: number[] }>
    currentPlayerIndex: number
    turnNumber: number
    boardTiles: Array<{ x: number; y: number; number: number }>
    allowIslands: boolean
  }): GameState {
    const playerColors = [PlayerColor.Red, PlayerColor.Blue, PlayerColor.Green, PlayerColor.Yellow]
    
    // Convert blockchain data to our game state format
    const players = blockchainData.players.map((bcPlayer, index) => ({
      color: playerColors[index],
      name: bcPlayer.name,
      score: bcPlayer.score,
      hand: bcPlayer.hand.map((tileNumber, handIndex) => ({
        id: this.numberToTileId(tileNumber),
        uniqueId: `blockchain-hand-${index}-${handIndex}`,
        location: { type: LocationType.Hand, player: playerColors[index] }
      }))
    }))
    
    // Convert board tiles
    const board = new Map<string, GameTile>()
    blockchainData.boardTiles.forEach((bcTile, index) => {
      const key = positionKey(bcTile.x, bcTile.y)
      board.set(key, {
        id: this.numberToTileId(bcTile.number),
        uniqueId: `blockchain-board-${index}`,
        location: { type: LocationType.Board, x: bcTile.x, y: bcTile.y }
      })
    })
    
    this.gameState = {
      players,
      currentPlayerIndex: blockchainData.currentPlayerIndex,
      turnNumber: blockchainData.turnNumber,
      board,
      drawPile: [], // We don't track draw pile from blockchain
      gamePhase: 'playing'
    }
    
    return this.gameState
  }
  
  /**
   * Convert placements to blockchain format
   */
  placementsToBlockchainFormat(placements: TilePlacement[]): Array<{ x: number; y: number; number: number }> {
    if (!this.gameState) return []
    
    return placements.map(placement => {
      const tile = this.findTileById(placement.tileId)
      return {
        x: placement.position.x,
        y: placement.position.y,
        number: tile ? this.tileIdToNumber(tile.id) : 0
      }
    })
  }
  
  /**
   * Helper: Convert number to tile ID
   */
  private numberToTileId(num: number): NumberTileId {
    switch (num) {
      case 0: return NumberTileId.Zero
      case 1: return NumberTileId.One
      case 2: return NumberTileId.Two
      case 3: return NumberTileId.Three
      case 4: return NumberTileId.Four
      case 5: return NumberTileId.Five
      case 6: return NumberTileId.Six
      case 7: return NumberTileId.Seven
      case 8: return NumberTileId.Eight
      case 9: return NumberTileId.Nine
      default: return NumberTileId.Zero
    }
  }
  
  /**
   * Helper: Convert tile ID to number
   */
  private tileIdToNumber(tileId: NumberTileId): number {
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
  
  /**
   * Helper: Find tile by ID
   */
  private findTileById(tileId: string): GameTile | null {
    if (!this.gameState) return null
    
    // Check player hands
    for (const player of this.gameState.players) {
      const tile = player.hand.find(t => t.uniqueId === tileId)
      if (tile) return tile
    }
    
    // Check board
    for (const tile of this.gameState.board.values()) {
      if (tile.uniqueId === tileId) return tile
    }
    
    return null
  }
} 