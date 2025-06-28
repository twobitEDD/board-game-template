// Simplified GamePark implementation for Fives
// Contains only the essential game logic without external dependencies

// Core types and utilities
export * from './GameTypes'
export * from './FivesGameLogic'
export * from './GameStateManager'

// Material types
export { NumberTileId } from './material/NumberTileId'
export { LocationType } from './material/LocationType'
export { MaterialType } from './material/MaterialType'
export { PlayerColor } from './PlayerColor'

// Utility functions for easy access
import { getTileValue, getNumberTileId, positionKey, parsePositionKey } from './GameTypes'
export const GameParkUtils = {
  getTileValue,
  getNumberTileId,
  positionKey,
  parsePositionKey
} 