import { PlayerTurnRule } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'

export class DrawTileRule extends PlayerTurnRule<PlayerColor, MaterialType, LocationType> {
  
  getPlayerMoves() {
    // For now, return empty array - we'll implement proper moves later
    return []
  }

  afterMove() {
    // After drawing a tile, player can play a tile
    return [this.rules().startPlayerTurn(RuleId.PlayTile, this.player)]
  }
}
