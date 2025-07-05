# SUMMON5: Game Rules

## Overview
**SUMMON5** is a tile-placement game where players weave mathematical patterns to channel mystical energy. Players place numbered tiles (0-9) on a grid to form sequences that sum to the **Sacred Number** (configurable, default: 5).

## Game Components
- **The Great Loom**: 15×15 grid board
- **Rune Threads**: 40 numbered tiles (4 each of 0-9)
- **Thread Reservoir**: Player hands (7 tiles each)
- **Draw Pile**: Shared pool of remaining tiles

## Setup
1. **Shuffle** all 40 rune threads
2. **Deal 7 tiles** to each player's Thread Reservoir
3. **Place tile 5** at center of The Great Loom (position 7,7)
4. **Remaining tiles** form the shared Draw Pile
5. **First player** begins their Weaving Turn

## Sacred Number Configuration
- **Default Sacred Number**: 5 (multiples of 5 score points)
- **Future Game Modes** may use different Sacred Numbers (3, 7, etc.)
- **Scoring Formula**: `(Sequence Sum ÷ Sacred Number) × 10 points`

## Turn Structure
Each turn consists of two phases:

### Phase 1: Weaving (Tile Placement)
1. **Select** one Rune Thread from your Thread Reservoir
2. **Place** it on The Great Loom following Placement Rules
3. **Calculate** any completed sequences for scoring
4. **Optional**: Continue placing more tiles this turn

### Phase 2: Gathering (Draw Tiles)
1. **Draw tiles** from Draw Pile to refill hand with tiles
2. **Pass turn** to next player

## Placement Rules

### Basic Placement
- **Adjacency**: New tiles must be adjacent (horizontally/vertically) to existing tiles
- **No Diagonal**: Diagonal placement not allowed
- **Grid Bounds**: Must stay within 15×15 grid
- **No Overlap**: Cannot place on occupied positions

### First Move Special Rules
- **First tile** must be placed on center (7,7) OR adjacent to center
- **Center tile (5)** is pre-placed at game start

### Turn Contiguity
- **All tiles placed in one turn** must form a single straight line
- **Same Row OR Same Column**: Cannot place in both directions in one turn
- **Continuous**: No gaps allowed in the line of tiles placed

## Scoring System

### Sequence Formation
- **Horizontal Sequences**: 2-5 consecutive tiles in same row
- **Vertical Sequences**: 2-5 consecutive tiles in same column
- **Minimum Length**: 2 tiles required to form a sequence
- **Maximum Length**: 5 tiles maximum per sequence

### Scoring Calculation
1. **Sum** all tile values in sequence
2. **Check** if sum is multiple of Sacred Number
3. **Award Points**: `(Sum ÷ Sacred Number) × 10`
4. **Example**: Sequence [2,1,2] = Sum 5 = 5÷5×10 = 10 points

### Scoring Examples (Sacred Number = 5)
- **[1,4]** → Sum 5 → 10 points
- **[2,1,2]** → Sum 5 → 10 points  
- **[3,2,5]** → Sum 10 → 20 points
- **[1,2,3,4]** → Sum 10 → 20 points
- **[2,2,2,2,2]** → Sum 10 → 20 points
- **[1,2,3]** → Sum 6 → 0 points (not multiple of 5)

### Multiple Sequences Per Turn
- **Each valid sequence** scores independently
- **Cross-sequences** both count if formed in same turn
- **Maximum**: One horizontal + one vertical sequence per tile placement

## Advanced Rules

### Tile Return
- **During Turn**: Can click placed tiles to return them to hand
- **Restriction**: Only tiles placed THIS turn can be returned
- **Recalculation**: Scores update when tiles are returned

### Turn Validation
- **Invalid Placement**: Turn cannot be completed if placement rules violated
- **Must Score**: At least one valid sequence must be formed to end turn
- **Undo Available**: Can undo entire turn before ending

### Game End Conditions
1. **Draw Pile Empty**: No more tiles to draw
2. **No Valid Moves**: Current player cannot place any tiles
3. **Score Threshold**: First player to reach target score (future mode)

### Victory
- **Highest Score**: Player with most Mystical Energy wins
- **Tiebreaker**: Fewest tiles remaining in hand
- **Perfect Game**: Emptying hand completely grants bonus

## Strategy Notes

### Placement Strategy
- **Build Multiple Sequences**: Place tiles to create both horizontal and vertical scoring
- **Block Opponents**: Prevent opponents from completing high-value sequences  
- **Hand Management**: Balance between scoring now vs. saving tiles for bigger plays

### Scoring Optimization
- **High-Value Sequences**: Longer sequences with larger sums score more
- **Cross-Scoring**: Single tile placement that completes multiple sequences
- **Tile Efficiency**: Use high-value tiles (6,7,8,9) strategically

### Risk Management
- **Committed Placement**: Once turn is ended, tiles cannot be moved
- **Hand Depletion**: Running out of playable tiles ends your participation
- **Blocking Risk**: Aggressive blocking may limit your own future options

## Game Variants (Future)

### Sacred Number Variants
- **Sacred 3**: Target multiples of 3 (more frequent scoring)
- **Sacred 7**: Target multiples of 7 (higher risk/reward)
- **Mixed Paths**: Multiple Sacred Numbers active simultaneously

### Board Variants  
- **Smaller Grid**: 11×11 for faster games
- **Obstacle Tiles**: Pre-placed blocking tiles
- **Portal Tiles**: Special tiles that modify sequences

### Scoring Variants
- **Progressive Scoring**: Later sequences worth more points
- **Tile Value Multipliers**: Different tiles worth different base values
- **Pattern Bonuses**: Special arrangements grant extra points 