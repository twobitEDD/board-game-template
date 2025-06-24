# Configuration System Integration Guide

## ✅ What We've Accomplished

### 1. **Configurable Rules System**
- **Sacred Number**: Configurable (3, 5, 7) with default 5
- **Hand Size**: Configurable (3-7) with default 5 to match current implementation
- **Rules Documentation**: Updated to reflect configurable parameters

### 2. **Files Created/Updated**
- ✅ `gameRules.ts`: Added `handSize` parameter and configuration functions
- ✅ `gameConfig.ts`: Centralized configuration management with presets
- ✅ `RulesPage.tsx`: Shows both Sacred Number and Hand Size controls
- ✅ `configurationIntegration.md`: This integration guide

### 3. **Game Presets Available**
- **Classic Weaving**: Sacred 5, Hand 5 (current default)
- **Original Game Park**: Sacred 5, Hand 7 (matches Game Park rules)
- **Sacred Three Path**: Sacred 3, Hand 5 (faster scoring)
- **Cursed Seven Path**: Sacred 7, Hand 5 (higher difficulty)
- **Master Weaver**: Sacred 7, Hand 7 (advanced)
- **Quick Weave**: Sacred 3, Hand 3 (fast games)

---

## 🔧 Integration Points

### Where Sacred Number is Currently Hardcoded (Needs Fixing)

1. **NewAgeGameBoard.tsx**:
   ```typescript
   // Line 590, 334, 346 - Replace with:
   const SACRED_NUMBER = getCurrentGameConfig().sacredNumber
   if (seq.sum % SACRED_NUMBER === 0 && seq.sum > 0) {
   ```

2. **FivesGameBoard.tsx**:
   ```typescript
   // Line 161, 550, 827, 839 - Replace with:
   const SACRED_NUMBER = getCurrentGameConfig().sacredNumber
   if (seq.sum % SACRED_NUMBER === 0 && seq.sum > 0) {
   ```

3. **TurnSummaryModal.tsx**:
   ```typescript
   // Line 95 - Replace with:
   const SACRED_NUMBER = getCurrentGameConfig().sacredNumber
   const isValid = seq.sum % SACRED_NUMBER === 0
   ```

### Where Hand Size is Currently Hardcoded (Needs Fixing)

1. **NewAgeGameBoard.tsx**:
   ```typescript
   // Line 101 - Replace with:
   const HAND_SIZE = getCurrentGameConfig().handSize
   const playerHand = initialPile.slice(tileIndex, tileIndex + HAND_SIZE)
   
   // Line 734, 841 - Replace with:
   if (personalPile.length > 0 && handTiles.length < HAND_SIZE) {
   {gameConfig.playerNames[currentPlayer]}'s Threads ({handTiles.length}/{HAND_SIZE})
   ```

2. **FivesGameBoard.tsx**:
   ```typescript
   // Line 262, 674 - Replace with:
   const HAND_SIZE = getCurrentGameConfig().handSize
   const playerHand = initialPile.slice(tileIndex, tileIndex + HAND_SIZE)
   if (personalPile.length > 0 && handTiles.length < HAND_SIZE) {
   ```

---

## 🎯 Quick Integration Steps

### Step 1: Add Import to Game Components
```typescript
import { getCurrentGameConfig, isValidSequenceSum } from '../data/gameConfig'
```

### Step 2: Replace Hardcoded Values
```typescript
// Instead of hardcoded % 5
const config = getCurrentGameConfig()
const SACRED_NUMBER = config.sacredNumber
const HAND_SIZE = config.handSize

// Use helper function for validation
if (isValidSequenceSum(seq.sum, SACRED_NUMBER)) {
  // sequence is valid
}
```

### Step 3: Update Game Setup
```typescript
// In game setup components, use:
const gameConfig = getConfigForGameSetup()
// This provides: { sacredNumber, handSize, tilesPerPlayer, boardSize }
```

---

## 🚀 Advanced Integration (Future)

### Game Setup UI Enhancement
```typescript
// Add preset selection to GameSetup.tsx
import { GAME_PRESETS, updateGameConfig } from '../data/gameConfig'

const handlePresetSelect = (presetKey: string) => {
  const preset = GAME_PRESETS[presetKey]
  updateGameConfig(preset.config)
  // Update UI to reflect new settings
}
```

### Dynamic Rules Display
The Rules page already shows the current configuration and updates examples based on Sacred Number and Hand Size selections.

### Validation Integration
```typescript
import { validateGameConfig } from '../data/gameConfig'

const errors = validateGameConfig(currentConfig)
if (errors.length > 0) {
  // Show validation errors to user
}
```

---

## 📋 Current Status

### ✅ Completed
- Rules documentation with configurable parameters
- Centralized configuration system
- Game presets for different play styles
- Rules page with live configuration preview
- Validation functions for all parameters

### ⚠️ Next Steps (Safe, Low-Risk Changes)
1. **Replace hardcoded Sacred Number** in game logic (5 locations)
2. **Replace hardcoded Hand Size** in game logic (4 locations)
3. **Add preset selection** to game setup UI
4. **Test different configurations** to ensure game balance

### 🎮 How to Test
1. Visit `/rules` page
2. Change Sacred Number and Hand Size settings
3. See how examples and descriptions update
4. Use different presets to understand gameplay variations

---

## 🔄 Backward Compatibility

The system maintains full backward compatibility:
- **Default values** match current implementation (Sacred 5, Hand 5)
- **Existing game logic** continues to work unchanged
- **Configuration is optional** - games work without explicit configuration
- **Gradual migration** - can update components one at a time

---

## 🎯 Benefits

### For Players
- **Game Variety**: 6 different preset configurations
- **Difficulty Options**: From Quick Weave (easy) to Master Weaver (hard)
- **Clear Rules**: Documentation updates based on current settings

### For Developers  
- **Centralized Config**: All game parameters in one place
- **Type Safety**: TypeScript interfaces for all configurations
- **Validation**: Built-in validation for all parameters
- **Presets**: Ready-made configurations for different play styles

### For Future Development
- **Multiplayer Ready**: Configuration can be shared between players
- **Tournament Mode**: Standardized configurations for competitive play
- **Easy Testing**: Quick switching between different game modes
- **Extensible**: Easy to add new parameters (board size, tile distribution, etc.)

The configuration system is now ready for integration and provides a solid foundation for making the game truly configurable while maintaining the current working implementation! 