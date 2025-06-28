import { GameState, GameTile, TilePlacement, Position, positionKey, getTileValue, getNumberTileId } from './GameTypes'
import { NumberTileId } from './material/NumberTileId'
import { LocationType } from './material/LocationType'
import { PlayerColor } from './PlayerColor'

export class FivesGameLogic {
  
  /**
   * Validate if a tile placement is legal according to Fives/Quinto rules
   */
  static validateTilePlacement(
    gameState: GameState, 
    placement: TilePlacement, 
    allPlacements: TilePlacement[] = []
  ): { valid: boolean; error?: string; score?: number } {
    const { position } = placement
    const { x, y } = position
    
    // Basic bounds check (15x15 board)
    if (x < 0 || x >= 15 || y < 0 || y >= 15) {
      return { valid: false, error: 'Position outside board boundaries' }
    }
    
    // Check if position is already occupied
    const posKey = positionKey(x, y)
    if (gameState.board.has(posKey)) {
      return { valid: false, error: 'Position already occupied' }
    }
    
    // Check if any of the staged placements occupy this position
    if (allPlacements.some(p => p.position.x === x && p.position.y === y && p.tileId !== placement.tileId)) {
      return { valid: false, error: 'Position conflicts with other staged placements' }
    }
    
    // First tile must be on or adjacent to center (7,7)
    if (gameState.board.size === 0 && allPlacements.length === 1) {
      const distanceFromCenter = Math.abs(x - 7) + Math.abs(y - 7)
      if (distanceFromCenter > 1) {
        return { valid: false, error: 'First tile must be on or adjacent to center (7,7)' }
      }
    }
    
    // For subsequent placements, ensure connectivity
    if (gameState.board.size > 0 || allPlacements.length > 1) {
      if (!this.isConnectedToExistingTiles(gameState, position, allPlacements)) {
        return { valid: false, error: 'Tile must be adjacent to existing tiles' }
      }
    }
    
    return { valid: true }
  }
  
  /**
   * Check if a position is connected to existing tiles on the board
   */
  private static isConnectedToExistingTiles(
    gameState: GameState, 
    position: Position, 
    allPlacements: TilePlacement[]
  ): boolean {
    const { x, y } = position
    const adjacentPositions = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 }
    ]
    
    // Check connectivity to existing board tiles
    for (const adjPos of adjacentPositions) {
      const adjKey = positionKey(adjPos.x, adjPos.y)
      if (gameState.board.has(adjKey)) {
        return true
      }
    }
    
    // Check connectivity to other staged placements
    for (const adjPos of adjacentPositions) {
      if (allPlacements.some(p => p.position.x === adjPos.x && p.position.y === adjPos.y)) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Calculate score for a tile placement (simplified Quinto scoring)
   */
  static calculatePlacementScore(
    gameState: GameState, 
    placements: TilePlacement[]
  ): number {
    let totalScore = 0
    
    // Create a temporary board state with all placements
    const tempBoard = new Map(gameState.board)
    
    for (const placement of placements) {
      const tile = this.findTileById(gameState, placement.tileId)
      if (tile) {
        const key = positionKey(placement.position.x, placement.position.y)
        tempBoard.set(key, {
          ...tile,
          location: {
            type: LocationType.Board,
            x: placement.position.x,
            y: placement.position.y
          }
        })
      }
    }
    
    // Calculate scores for each placed tile
    for (const placement of placements) {
      const { x, y } = placement.position
      
      // Check horizontal sequence
      const horizontalScore = this.calculateSequenceScore(tempBoard, x, y, 'horizontal')
      
      // Check vertical sequence  
      const verticalScore = this.calculateSequenceScore(tempBoard, x, y, 'vertical')
      
      totalScore += horizontalScore + verticalScore
    }
    
    return totalScore
  }
  
  /**
   * Calculate score for a sequence (horizontal or vertical)
   */
  private static calculateSequenceScore(
    board: Map<string, GameTile>, 
    x: number, 
    y: number, 
    direction: 'horizontal' | 'vertical'
  ): number {
    const sequence = this.getSequence(board, x, y, direction)
    
    if (sequence.length < 2) return 0
    
    // Calculate sum of sequence
    const sum = sequence.reduce((total, tile) => total + getTileValue(tile.id), 0)
    
    // Score is sum × length multiplier
    return sum * sequence.length
  }
  
  /**
   * Get the complete sequence including the tile at the given position
   */
  private static getSequence(
    board: Map<string, GameTile>, 
    x: number, 
    y: number, 
    direction: 'horizontal' | 'vertical'
  ): GameTile[] {
    const sequence: GameTile[] = []
    const dx = direction === 'horizontal' ? 1 : 0
    const dy = direction === 'vertical' ? 1 : 0
    
    // Get tiles to the left/up
    let currentX = x - dx
    let currentY = y - dy
    const leftTiles: GameTile[] = []
    
    while (currentX >= 0 && currentY >= 0 && currentX < 15 && currentY < 15) {
      const key = positionKey(currentX, currentY)
      const tile = board.get(key)
      if (!tile) break
      
      leftTiles.unshift(tile)
      currentX -= dx
      currentY -= dy
    }
    
    // Add the center tile
    const centerKey = positionKey(x, y)
    const centerTile = board.get(centerKey)
    
    // Get tiles to the right/down
    currentX = x + dx
    currentY = y + dy
    const rightTiles: GameTile[] = []
    
    while (currentX >= 0 && currentY >= 0 && currentX < 15 && currentY < 15) {
      const key = positionKey(currentX, currentY)
      const tile = board.get(key)
      if (!tile) break
      
      rightTiles.push(tile)
      currentX += dx
      currentY += dy
    }
    
    // Combine all tiles
    if (centerTile) {
      sequence.push(...leftTiles, centerTile, ...rightTiles)
    }
    
    return sequence
  }
  
  /**
   * Find a tile by its unique ID in the game state
   */
  private static findTileById(gameState: GameState, tileId: string): GameTile | null {
    // Check player hands
    for (const player of gameState.players) {
      const tile = player.hand.find(t => t.uniqueId === tileId)
      if (tile) return tile
    }
    
    // Check draw pile
    const tile = gameState.drawPile.find(t => t.uniqueId === tileId)
    if (tile) return tile
    
    // Check board
    for (const boardTile of gameState.board.values()) {
      if (boardTile.uniqueId === tileId) return boardTile
    }
    
    return null
  }
  
  /**
   * Create initial game state
   */
  static createInitialGameState(
    playerNames: string[], 
    options: { allowIslands: boolean; tilesPerPlayer: number }
  ): GameState {
    // Create all tiles (4 of each number 0-9)
    const allTiles: GameTile[] = []
    let tileCounter = 0
    
    for (let value = 0; value <= 9; value++) {
      for (let copy = 0; copy < 4; copy++) {
        allTiles.push({
          id: getNumberTileId(value),
          uniqueId: `tile-${tileCounter++}`,
          location: { type: LocationType.DrawPile }
        })
      }
    }
    
    // Shuffle tiles
    this.shuffleArray(allTiles)
    
    // Create players
    const playerColors = [PlayerColor.Red, PlayerColor.Blue, PlayerColor.Green, PlayerColor.Yellow]
    const players = playerNames.map((name, index) => ({
      color: playerColors[index],
      name,
      score: 0,
      hand: allTiles.splice(0, options.tilesPerPlayer) // Deal tiles to hand
    }))
    
    // Update tile locations for dealt tiles
    players.forEach(player => {
      player.hand.forEach(tile => {
        tile.location = { type: LocationType.Hand, player: player.color }
      })
    })
    
    return {
      players,
      currentPlayerIndex: 0,
      turnNumber: 1,
      board: new Map(),
      drawPile: allTiles, // Remaining tiles
      gamePhase: 'playing'
    }
  }
  
  /**
   * Shuffle an array in place
   */
  private static shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }
  
  /**
   * Apply a move to the game state
   */
  static applyMove(gameState: GameState, placements: TilePlacement[]): GameState {
    const newState: GameState = {
      ...gameState,
      board: new Map(gameState.board),
      players: gameState.players.map(p => ({
        ...p,
        hand: [...p.hand]
      })),
      drawPile: [...gameState.drawPile]
    }
    
    const currentPlayer = newState.players[newState.currentPlayerIndex]
    let totalScore = 0
    
    // Apply each placement
    for (const placement of placements) {
      // Find and remove tile from player's hand
      const tileIndex = currentPlayer.hand.findIndex(t => t.uniqueId === placement.tileId)
      if (tileIndex >= 0) {
        const tile = currentPlayer.hand.splice(tileIndex, 1)[0]
        
        // Place tile on board
        const key = positionKey(placement.position.x, placement.position.y)
        tile.location = {
          type: LocationType.Board,
          x: placement.position.x,
          y: placement.position.y
        }
        newState.board.set(key, tile)
      }
    }
    
    // Calculate and add score
    totalScore = this.calculatePlacementScore(gameState, placements)
    currentPlayer.score += totalScore
    
    // Next player's turn
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length
    newState.turnNumber++
    
    // Check for game end
    if (this.isGameOver(newState)) {
      newState.gamePhase = 'finished'
      newState.winner = this.getWinner(newState)
    }
    
    return newState
  }
  
  /**
   * Check if the game is over
   */
  static isGameOver(gameState: GameState): boolean {
    // Game ends when draw pile is empty and a player has no tiles
    return gameState.drawPile.length === 0 && 
           gameState.players.some(p => p.hand.length === 0)
  }
  
  /**
   * Get the winner (player with highest score)
   */
  static getWinner(gameState: GameState): PlayerColor | undefined {
    if (!this.isGameOver(gameState)) return undefined
    
    const winner = gameState.players.reduce((best, current) => 
      current.score > best.score ? current : best
    )
    
    return winner.color
  }
} 