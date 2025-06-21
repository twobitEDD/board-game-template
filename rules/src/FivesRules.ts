import { MaterialGame, MaterialMove, MaterialRules, TimeLimit } from '@gamepark/rules-api'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'
import { PlayTileRule } from './rules/PlayTileRule'
import { DrawTileRule } from './rules/DrawTileRule'

/**
 * This class implements the rules of the Fives board game.
 * It must follow Game Park "Rules" API so that the Game Park server can enforce the rules.
 */
export class FivesRules
  extends MaterialRules<PlayerColor, MaterialType, LocationType>
  implements TimeLimit<MaterialGame<PlayerColor, MaterialType, LocationType>, MaterialMove<PlayerColor, MaterialType, LocationType>, PlayerColor>
{
  rules = {
    [RuleId.PlayTile]: PlayTileRule,
    [RuleId.DrawTile]: DrawTileRule
  }

  giveTime(): number {
    return 60 // 60 seconds per turn
  }

  /**
   * Get the current scores for all players
   */
  getScore(_player: PlayerColor): number {
    // For now, return 0 - we'll implement proper scoring later
    // when we have the game state tracking in place
    return 0
  }

  /**
   * Check if the game has ended
   */
  isGameOver(): boolean {
    // Game ends when:
    // 1. Draw pile is empty and no player can make a move
    // 2. A player reaches a certain score threshold
    // 3. All players pass their turns
    
    const drawPile = this.material(MaterialType.NumberTile).location(LocationType.DrawPile)
    const isDrawPileEmpty = drawPile.length === 0
    
    if (isDrawPileEmpty) {
      // Check if any player has tiles in hand
      const playersWithTiles = this.players.filter(player => 
        this.material(MaterialType.NumberTile)
          .location(LocationType.Hand)
          .player(player)
          .length > 0
      )
      
      return playersWithTiles.length === 0
    }
    
    return false
  }

  /**
   * Get the winners when game ends
   */
  getWinners(): PlayerColor[] {
    if (!this.isGameOver()) return []
    
    // For now, return the first player as winner
    // We'll implement proper scoring later
    return [this.players[0]]
  }

  /**
   * Get the next player in turn order
   */
  getNextPlayer(currentPlayer: PlayerColor): PlayerColor {
    const currentIndex = this.players.indexOf(currentPlayer)
    const nextIndex = (currentIndex + 1) % this.players.length
    return this.players[nextIndex]
  }
}
