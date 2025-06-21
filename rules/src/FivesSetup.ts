import { MaterialGameSetup } from '@gamepark/rules-api'
import { FivesOptions } from './FivesOptions'
import { FivesRules } from './FivesRules'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { NumberTileId } from './material/NumberTileId'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'

/**
 * This class creates a new Game based on the game options
 */
export class FivesSetup extends MaterialGameSetup<PlayerColor, MaterialType, LocationType, FivesOptions> {
  Rules = FivesRules

  setupMaterial(options: FivesOptions) {
    // Create number tiles for the draw pile (4 of each number 0-9)
    const numberTiles = [
      ...Array(4).fill(NumberTileId.Zero),
      ...Array(4).fill(NumberTileId.One),
      ...Array(4).fill(NumberTileId.Two),
      ...Array(4).fill(NumberTileId.Three),
      ...Array(4).fill(NumberTileId.Four),
      ...Array(4).fill(NumberTileId.Five),
      ...Array(4).fill(NumberTileId.Six),
      ...Array(4).fill(NumberTileId.Seven),
      ...Array(4).fill(NumberTileId.Eight),
      ...Array(4).fill(NumberTileId.Nine)
    ]

    // Shuffle the tiles
    const shuffledTiles = this.shuffle(numberTiles)

    // Create tiles in draw pile
    this.material(MaterialType.NumberTile).createItems(
      shuffledTiles.map((tileId) => ({
        id: tileId,
        location: { type: LocationType.DrawPile }
      }))
    )

    // Deal initial tiles to each player (7 tiles each)
    options.players.forEach(player => {
      for (let i = 0; i < 7; i++) {
        const drawPileTiles = this.material(MaterialType.NumberTile).location(LocationType.DrawPile)
        if (drawPileTiles.length > 0) {
          drawPileTiles.getItem()!.location = { 
            type: LocationType.Hand, 
            player: player.id 
          }
        }
      }
    })

    // Place the starting tile (5) in the center of the board
    const centerTile = this.material(MaterialType.NumberTile).location(LocationType.DrawPile)
      .id(NumberTileId.Five).getItem()
    
    if (centerTile) {
      centerTile.location = {
        type: LocationType.Board,
        x: 3,
        y: 3
      }
    }
  }

  start() {
    // Start with the first player's turn
    this.startPlayerTurn(RuleId.PlayTile, this.players[0])
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
