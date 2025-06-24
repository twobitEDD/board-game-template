// Centralized Game Configuration
// This file manages configurable game parameters

export interface GameConfiguration {
  sacredNumber: number
  handSize: number
  boardSize: number
  tileDistribution: Record<number, number>
}

// Default configuration matching current implementation
export const DEFAULT_GAME_CONFIG: GameConfiguration = {
  sacredNumber: 5,        // Default to multiples of 5
  handSize: 5,           // Default to 5 tiles per hand (current implementation)
  boardSize: 15,         // 15x15 grid
  tileDistribution: {    // 4 of each number 0-9 (40 total tiles)
    0: 4, 1: 4, 2: 4, 3: 4, 4: 4,
    5: 4, 6: 4, 7: 4, 8: 4, 9: 4
  }
}

// Game configuration presets
export const GAME_PRESETS = {
  classic: {
    name: "Classic Weaving",
    description: "Standard game with 5 tiles per hand, Sacred Number 5",
    config: { ...DEFAULT_GAME_CONFIG }
  },
  
  originalGamePark: {
    name: "Original Game Park",
    description: "Original design with 7 tiles per hand, Sacred Number 5", 
    config: { ...DEFAULT_GAME_CONFIG, handSize: 7 }
  },
  
  sacredThree: {
    name: "Sacred Three Path",
    description: "Faster scoring with multiples of 3, 5 tiles per hand",
    config: { ...DEFAULT_GAME_CONFIG, sacredNumber: 3 }
  },
  
  cursedSeven: {
    name: "Cursed Seven Path", 
    description: "High risk/reward with multiples of 7, 5 tiles per hand",
    config: { ...DEFAULT_GAME_CONFIG, sacredNumber: 7 }
  },
  
  masterWeaver: {
    name: "Master Weaver",
    description: "Advanced play with 7 tiles, Sacred Number 7",
    config: { ...DEFAULT_GAME_CONFIG, sacredNumber: 7, handSize: 7 }
  },
  
  quickWeave: {
    name: "Quick Weave",
    description: "Fast games with 3 tiles, Sacred Number 3",
    config: { ...DEFAULT_GAME_CONFIG, sacredNumber: 3, handSize: 3 }
  }
}

// Validation functions
export function isValidSacredNumber(num: number): boolean {
  return [3, 5, 7].includes(num)
}

export function isValidHandSize(size: number): boolean {
  return size >= 3 && size <= 7
}

export function validateGameConfig(config: GameConfiguration): string[] {
  const errors: string[] = []
  
  if (!isValidSacredNumber(config.sacredNumber)) {
    errors.push(`Invalid Sacred Number: ${config.sacredNumber}. Must be 3, 5, or 7.`)
  }
  
  if (!isValidHandSize(config.handSize)) {
    errors.push(`Invalid Hand Size: ${config.handSize}. Must be between 3 and 7.`)
  }
  
  if (config.boardSize < 11 || config.boardSize > 21) {
    errors.push(`Invalid Board Size: ${config.boardSize}. Must be between 11 and 21.`)
  }
  
  return errors
}

// Helper functions for game logic
export function getValidSequenceSums(sacredNumber: number, maxLength: number = 5): number[] {
  const sums: number[] = []
  for (let multiplier = 1; multiplier <= 9; multiplier++) {
    const sum = sacredNumber * multiplier
    if (sum <= maxLength * 9) { // Maximum possible sum with tiles 0-9
      sums.push(sum)
    }
  }
  return sums
}

export function isValidSequenceSum(sum: number, sacredNumber: number): boolean {
  return sum > 0 && sum % sacredNumber === 0
}

// Configuration management
let currentGameConfig: GameConfiguration = { ...DEFAULT_GAME_CONFIG }

export function getCurrentGameConfig(): GameConfiguration {
  return { ...currentGameConfig }
}

export function updateGameConfig(newConfig: Partial<GameConfiguration>): GameConfiguration {
  currentGameConfig = { ...currentGameConfig, ...newConfig }
  return { ...currentGameConfig }
}

export function resetGameConfig(): GameConfiguration {
  currentGameConfig = { ...DEFAULT_GAME_CONFIG }
  return { ...currentGameConfig }
}

// Integration helpers for existing components
export function getConfigForGameSetup() {
  return {
    sacredNumber: currentGameConfig.sacredNumber,
    handSize: currentGameConfig.handSize,
    tilesPerPlayer: currentGameConfig.handSize * 3, // Rough estimate for total tiles needed
    boardSize: currentGameConfig.boardSize
  }
} 