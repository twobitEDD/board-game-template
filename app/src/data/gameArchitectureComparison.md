# Game Architecture Comparison: Game Park Rules vs Current Implementation

## Overview
This document compares the **Game Park Rules API** (in `rules/` folder) with the **Current React Implementation** (in `app/src/components/`) to understand how to integrate them safely without breaking existing functionality.

## Current Sacred Number Configuration
- **Default Value**: 5 (configurable in `gameRules.ts`)
- **Location**: `app/src/data/gameRules.ts` - line 30: `sacredNumber: 5`
- **Usage**: All scoring validation uses `seq.sum % sacredNumber === 0`

---

## 1. Game State Management

### Game Park Rules API (`rules/` folder)
```typescript
// Uses MaterialGame state management
class FivesRules extends MaterialRules {
  // State stored in material items with locations
  material(MaterialType.NumberTile).location(LocationType.Hand).player(player)
  
  // Turn management through rule transitions
  rules = {
    [RuleId.PlayTile]: PlayTileRule,
    [RuleId.DrawTile]: DrawTileRule
  }
}
```

**Characteristics:**
- ✅ **Authoritative**: Server-enforced rules
- ✅ **Multiplayer Ready**: Built for online play
- ✅ **Standardized**: Follows Game Park patterns
- ❌ **Incomplete**: Rules are stubbed out (empty `getPlayerMoves()`)
- ❌ **Not Connected**: React components don't use this system

### Current React Implementation (`app/src/components/`)
```typescript
// Direct state management in React components
const [boardTiles, setBoardTiles] = useState<TileItem[]>()
const [playerHands, setPlayerHands] = useState<TileItem[][]>()
const [currentPlayer, setCurrentPlayer] = useState<number>()

// Game logic directly in components
const validateTurnPlacement = (placedTiles, existingTiles) => {
  // Validation logic here
}
```

**Characteristics:**
- ✅ **Complete**: Fully functional game
- ✅ **Working**: Players can actually play
- ✅ **Rich UI**: Beautiful visual feedback
- ❌ **Client-Only**: No server validation
- ❌ **Duplicate Logic**: Rules implemented twice

---

## 2. Turn Structure Comparison

### Game Park Rules (Intended)
```typescript
// Two-phase turn system
[RuleId.PlayTile]: PlayTileRule    // Place one tile
[RuleId.DrawTile]: DrawTileRule    // Draw one tile
// Then next player
```

**Turn Flow:**
1. **Play Phase**: Place exactly ONE tile
2. **Draw Phase**: Draw exactly ONE tile  
3. **Next Player**: Automatic transition

### Current Implementation (Actual)
```typescript
// Multi-tile turn system
handleEndTurn() {
  // Can place multiple tiles per turn
  // Draws to refill hand to 5(or more) tiles
  // Manual "End Turn" button
}
```

**Turn Flow:**
1. **Weaving Phase**: Place 1+ tiles in same row/column
2. **Validation**: All sequences must sum to multiples of Sacred Number
3. **Scoring**: Calculate points for all valid sequences
4. **Gathering**: Draw tiles to refill hand to 5
5. **Manual End**: Player clicks "End Turn"

**KEY DIFFERENCE**: Game Park = 1 tile per turn, Current = Multiple tiles per turn

---

## 3. Tile Distribution & Setup

### Game Park Rules
```typescript
// FivesSetup.ts - lines 17-28
const numberTiles = [
  ...Array(4).fill(NumberTileId.Zero),   // 4 of each number
  ...Array(4).fill(NumberTileId.One),
  // ... etc for 0-9
]

// Deal 7 tiles to each player
for (let i = 0; i < 7; i++) {
  // Move from DrawPile to player Hand
}
```

**Setup:**
- ✅ **Shared Draw Pile**: All players draw from same pile
- ✅ **Standard Distribution**: 4 of each number (0-9) = 40 tiles
- ✅ **7 Tiles Per Player**: Matches current implementation

### Current Implementation  
```typescript
// NewAgeGameBoard.tsx - lines 45-86
const createInitialDrawPile = (): NumberTileId[] => {
  // Creates individual draw piles per player
  const totalTilesNeeded = gameConfig.playerCount * gameConfig.tilesPerPlayer + 20
  
  // Scales distribution based on player count
  const scaleFactor = totalTilesNeeded / 36
}
```

**Setup:**
- ❌ **Individual Draw Piles**: Each player has their own pile
- ❌ **Scaled Distribution**: Changes tile counts based on player count
- ✅ **7 Tiles Per Player**: Matches Game Park rules

**KEY DIFFERENCE**: Game Park = Shared pile, Current = Individual piles

---

## 4. Scoring System

### Sacred Number Integration
Both systems can support configurable Sacred Numbers, but implementation differs:

**Game Park Rules (Potential)**:
```typescript
// Would need to add Sacred Number to game options
interface FivesOptions {
  players: PlayerSetup[]
  sacredNumber?: number  // Add this
}

// Scoring logic would go in rules
getScore(player: PlayerColor): number {
  // Calculate based on sequences and sacredNumber
}
```

**Current Implementation (Working)**:
```typescript
// gameRules.ts - line 30
sacredNumber: 5, // Configurable

// NewAgeGameBoard.tsx - validation
if (seq.sum % 5 === 0 && seq.sum > 0) {  // Hardcoded 5
  hasValidSequence = true
}
```

**ISSUE**: Current code hardcodes `% 5` instead of using configurable Sacred Number

---

## 5. Validation Rules Comparison

### Placement Rules (Both Match)
- ✅ **Adjacency**: Must touch existing tiles
- ✅ **Boundaries**: Stay within 15×15 grid  
- ✅ **No Overlap**: Can't place on occupied spaces
- ✅ **First Move**: Must be on/adjacent to center

### Turn Validation (Different)
**Game Park**: Would validate single tile placement
**Current**: Validates multiple tiles must be in same row/column

### Sequence Validation (Current Only)
**Current Implementation**:
```typescript
// All sequences involving new tiles must sum to multiples of Sacred Number
for (const seq of sequences) {
  if (seq.sum % 5 === 0 && seq.sum > 0) {
    hasValidSequence = true
  } else {
    hasInvalidSequence = true  // Entire turn invalid
  }
}
```

**Game Park**: No sequence validation implemented yet

---

## 6. Integration Strategy

### Option A: Enhance Game Park Rules (Recommended)
1. **Complete the Game Park implementation** with current game logic
2. **Add Sacred Number to FivesOptions**
3. **Implement proper sequence validation in rules**
4. **Connect React components to use Game Park state**
5. **Keep current turn structure** (multiple tiles per turn)

### Option B: Extract Rules to Shared Module
1. **Create shared rules module** used by both systems
2. **Keep React implementation as-is**
3. **Add Game Park wrapper** that uses shared rules
4. **Gradually migrate** to Game Park system

### Option C: Dual System (Current State)
1. **Keep both systems separate**
2. **Use React for UI/gameplay**
3. **Use Game Park for multiplayer/server validation**
4. **Accept some code duplication**

---

## 7. Sacred Number Configuration Points

To make Sacred Number truly configurable without breaking things:

### Required Changes:
1. **gameRules.ts**: ✅ Already configurable
2. **NewAgeGameBoard.tsx**: ❌ Hardcoded `% 5` on lines 590, 334, 346
3. **FivesGameBoard.tsx**: ❌ Hardcoded `% 5` on lines 161, 550, 827, 839  
4. **TurnSummaryModal.tsx**: ❌ Hardcoded `% 5` on line 95

### Safe Implementation:
```typescript
// Add to game config
interface GameConfig {
  sacredNumber: number  // Add this
  // ... existing fields
}

// Replace hardcoded validation
const SACRED_NUMBER = gameConfig.sacredNumber || 5
if (seq.sum % SACRED_NUMBER === 0 && seq.sum > 0) {
  // validation logic
}
```

---

## 8. Recommendations

### Immediate Actions (Safe Changes):
1. ✅ **Rules Documentation**: Complete (ancient book style)
2. ⚠️ **Sacred Number Config**: Replace hardcoded `% 5` with configurable value
3. ⚠️ **Game Park Rules**: Complete the stubbed implementations
4. ✅ **Keep Current UI**: Don't break working gameplay

### Future Enhancements:
1. **Multiplayer Support**: Use Game Park Rules for server validation
2. **Game Variants**: Easy Sacred Number switching (3, 5, 7)
3. **Rule Variants**: Different scoring systems, board sizes
4. **Tournament Mode**: Server-enforced rules for competitive play

### Critical: Don't Break Current System
The current React implementation is **fully functional** and players can enjoy it. Any changes should be **additive** rather than **destructive**.

---

## Conclusion

The **Current React Implementation** is a complete, working game that happens to use different architecture than the **Game Park Rules API**. The Sacred Number is configurable in the rules data but hardcoded in the game logic.

**Priority Order:**
1. **Fix Sacred Number hardcoding** (low risk, high value)
2. **Complete Game Park Rules** (medium risk, future value)  
3. **Integrate systems** (high risk, long-term value)

The ancient book rules system provides excellent documentation and the configurable Sacred Number system is ready - we just need to connect the game logic to use it properly. 