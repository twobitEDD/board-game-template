import { PlayerTurnRule } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'

export class PlayTileRule extends PlayerTurnRule<PlayerColor, MaterialType, LocationType> {
  
  getPlayerMoves() {
    // For now, return empty array - we'll implement proper moves later
    // when we understand the correct GamePark API patterns
    return []
  }

  afterMove() {
    // After playing a tile, switch to draw tile rule
    return [this.rules().startPlayerTurn(RuleId.DrawTile, this.player)]
  }
}
