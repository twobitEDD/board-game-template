import { MaterialType } from '../../../rules/src/material/MaterialType'
import { MaterialDescription } from '@gamepark/react-game'
import { NumberTileId } from '../../../rules/src/material/NumberTileId'

// Simple Material export to satisfy framework requirements
export const Material: Partial<Record<MaterialType, MaterialDescription>> = {}

export function getNumberTileText(tileId: NumberTileId): string {
  switch (tileId) {
    case NumberTileId.Zero: return '0'
    case NumberTileId.One: return '1'
    case NumberTileId.Two: return '2'
    case NumberTileId.Three: return '3'
    case NumberTileId.Four: return '4'
    case NumberTileId.Five: return '5'
    case NumberTileId.Six: return '6'
    case NumberTileId.Seven: return '7'
    case NumberTileId.Eight: return '8'
    case NumberTileId.Nine: return '9'
    default: return '?'
  }
}
