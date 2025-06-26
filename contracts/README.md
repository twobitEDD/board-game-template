# Fives Game Smart Contracts

This directory contains the smart contracts for the Fives tile weaving game, built with Hardhat and Solidity.

## 🎮 About Fives Game

Fives is a strategic tile placement game where players must place numbered tiles (1-50) following mathematical rules. Tiles must be placed adjacent to existing tiles such that the sum or absolute difference equals 5.

## 📋 Contract Features

### Core Functionality
- **Game Creation**: Players can create new games with customizable settings
- **Player Management**: Support for 1-4 players per game
- **Turn-based Gameplay**: Enforced turn order with timeout mechanisms
- **Tile Placement**: On-chain validation of placement rules
- **Scoring System**: Automatic score calculation and tracking
- **Game States**: Setup, InProgress, Completed, Cancelled

### Mathematical Rules
- First tile can be placed anywhere
- Subsequent tiles must be adjacent to existing tiles
- Adjacent tiles must follow the rule: `a + b = 5` OR `|a - b| = 5`
- Optional "islands" mode allows non-adjacent placements

### Security Features
- Turn validation (only current player can move)
- Move timeouts (24 hours per turn)
- Position validation (prevent double placement)
- Mathematical rule enforcement
- Game state management

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or later)
- npm or yarn

### Installation
```bash
cd contracts
npm install
```

### Compilation
```bash
npm run compile
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Local Deployment
```bash
# Start local Hardhat node
npm run node

# Deploy to local network (in another terminal)
npm run deploy:local
```

## 🏗️ Contract Architecture

### Main Contract: FivesGame.sol

#### Data Structures
```solidity
enum GameState { Setup, InProgress, Completed, Cancelled }

struct Tile {
    uint8 number;      // 1-50
    int16 x, y;        // Coordinates
    bool isPlaced;     // Placement status
    uint256 turnPlaced; // Turn number
}

struct Player {
    address wallet;
    string name;
    uint256 score;
    uint8[] hand;      // Available tiles
    bool hasJoined;
    uint256 lastMoveTime;
}

struct Game {
    uint256 gameId;
    GameState state;
    address creator;
    uint8 maxPlayers;
    uint8 currentPlayerIndex;
    uint256 turnNumber;
    // ... additional fields
}
```

#### Key Functions

**Game Management:**
- `createGame(maxPlayers, allowIslands, playerName)` - Create new game
- `joinGame(gameId, playerName)` - Join existing game
- `startGame(gameId)` - Start game (creator only)
- `cancelGame(gameId)` - Cancel game

**Gameplay:**
- `placeTile(gameId, tileNumber, x, y)` - Place a tile
- `skipTurn(gameId)` - Skip current turn
- `forceNextTurn(gameId)` - Force turn due to timeout

**View Functions:**
- `getGame(gameId)` - Get game information
- `getPlayer(gameId, playerAddr)` - Get player information
- `getTileAt(gameId, x, y)` - Get tile at position
- `getPlayerGames(player)` - Get games for player

## 🔧 Configuration

### Hardhat Networks

The contract supports multiple networks:

- **Hardhat**: Local development network
- **Localhost**: Local Hardhat node
- **Sepolia**: Ethereum testnet

### Environment Variables

Create a `.env` file with:
```env
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🧪 Testing

The test suite covers:
- Game creation and validation
- Player joining and management
- Turn-based gameplay mechanics
- Mathematical rule validation
- Scoring system
- Edge cases and error conditions

Run tests:
```bash
npm test
```

## 🚀 Deployment

### Local Deployment
```bash
# Start local node
npm run node

# Deploy (in another terminal)
npm run deploy:local
```

### Testnet Deployment
```bash
npm run deploy:sepolia
```

### Mainnet Deployment
⚠️ **Be extremely careful with mainnet deployment!**
```bash
npm run deploy:mainnet
```

## 📊 Gas Optimization

The contract is optimized for gas efficiency:
- Packed structs to reduce storage slots
- Efficient mapping structures
- Minimal external calls
- Optimized mathematical operations

## 🔐 Security Considerations

- **Access Control**: Only authorized players can make moves
- **State Validation**: All game states are properly validated
- **Reentrancy Protection**: No external calls that could cause reentrancy
- **Integer Overflow**: Using Solidity 0.8.19+ with built-in overflow protection
- **Input Validation**: All inputs are validated before processing

## 🎯 Game Flow

1. **Setup Phase**
   - Player creates game with settings
   - Other players join
   - Creator starts game

2. **Gameplay Phase**
   - Players take turns placing tiles
   - Each move is validated on-chain
   - Scores are calculated automatically

3. **End Game**
   - Game ends when a player empties their hand
   - Final scores are recorded
   - Winner is determined

## 🔍 Events

The contract emits events for all major actions:
- `GameCreated`
- `PlayerJoined`
- `GameStarted`
- `TilePlaced`
- `TurnChanged`
- `GameCompleted`
- `GameCancelled`

## 📈 Future Enhancements

Potential improvements for v2:
- NFT integration for unique tiles
- Tournament systems
- Advanced scoring mechanisms
- Multi-game tournaments
- Spectator mode
- Replay system

## 🐛 Troubleshooting

### Common Issues

**"Game does not exist"**
- Check if gameId is valid
- Ensure game was created successfully

**"Not your turn"**
- Check current player index
- Wait for your turn or check if game is active

**"Invalid tile placement"**
- Verify mathematical rules (sum/difference = 5)
- Check if position is already occupied
- Ensure tile is in your hand

## 📞 Support

For issues or questions:
1. Check the test files for usage examples
2. Review the contract documentation
3. Check Hardhat documentation for setup issues

## 📄 License

MIT License - see LICENSE file for details. 