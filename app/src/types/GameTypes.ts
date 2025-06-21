import { NumberTileId } from '../../../rules/src/material/NumberTileId'

export interface TileItem {
  id: NumberTileId
  uniqueId: string
  location: {
    type: string
    x?: number
    y?: number
    player?: any
  }
}

export interface GameConfig {
  playerCount: number
  playerNames: string[]
}

export interface GameState {
  boardTiles: TileItem[]
  handTiles: TileItem[]
  tilesPlacedThisTurn: TileItem[]
  selectedTile: TileItem | null
  drawPile: NumberTileId[]
  playerScores: number[]
  currentPlayerIndex: number
  turnNumber: number
  turnScore: number
  gameMessage: string
  currentTurnDirection: 'horizontal' | 'vertical' | null
  currentTurnRow: number | null
  currentTurnCol: number | null
} 