import { NumberTileId } from './material/NumberTileId'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { PlayerColor } from './PlayerColor'

// Simplified game types without external dependencies

export interface Position {
  x: number
  y: number
}

export interface TileLocation {
  type: LocationType
  player?: PlayerColor
  x?: number
  y?: number
}

export interface GameTile {
  id: NumberTileId
  uniqueId: string
  location: TileLocation
}

export interface Player {
  color: PlayerColor
  name: string
  score: number
  hand: GameTile[]
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  turnNumber: number
  board: Map<string, GameTile> // key: "x,y", value: tile
  drawPile: GameTile[]
  gamePhase: 'setup' | 'playing' | 'finished'
  winner?: PlayerColor
}

export interface TilePlacement {
  tileId: string
  position: Position
}

export interface GameMove {
  type: 'playTile' | 'drawTile' | 'pass'
  player: PlayerColor
  placements?: TilePlacement[]
}

// Game configuration
export interface GameOptions {
  playerCount: number
  playerNames: string[]
  allowIslands: boolean
  tilesPerPlayer: number
  winningScore: number
}

// Utility functions
export const getTileValue = (tileId: NumberTileId): number => {
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

export const getNumberTileId = (value: number): NumberTileId => {
  switch (value) {
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

export const positionKey = (x: number, y: number): string => `${x},${y}`

export const parsePositionKey = (key: string): Position => {
  const [x, y] = key.split(',').map(Number)
  return { x, y }
} 