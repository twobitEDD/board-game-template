import { LocationType } from '../../../rules/src/material/LocationType'
import { MaterialType } from '../../../rules/src/material/MaterialType'
import { PlayerColor } from '../../../rules/src/PlayerColor'
import { Locator, PileLocator, HandLocator } from '@gamepark/react-game'

export const Locators: Partial<Record<LocationType, Locator<PlayerColor, MaterialType, LocationType>>> = {
  [LocationType.DrawPile]: new PileLocator({
    coordinates: { x: -20, y: 0, z: 0 }
  }),
  [LocationType.Hand]: new HandLocator({
    coordinates: { x: 0, y: 15, z: 0 }
  }),
  [LocationType.Board]: new PileLocator({
    coordinates: { x: 0, y: 0, z: 0 }
  })
}
