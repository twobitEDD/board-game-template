# Frontend Integration Guide

This guide shows how to integrate the Fives Game smart contract with your React frontend using Dynamic wallet integration.

## 🔧 Setup

### 1. Install Dependencies

```bash
cd app
npm install ethers @dynamic-labs/sdk-react-core
```

### 2. Contract Information

After deployment, you'll need:
- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (example)
- **Network**: Localhost (chainId: 1337) for development
- **ABI**: Generated automatically by Hardhat in `artifacts/contracts/FivesGame.sol/FivesGame.json`

## 📱 React Integration

### 1. Create Contract Hook

Create `app/src/hooks/useContract.js`:

```javascript
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { ethers } from 'ethers'
import { useMemo } from 'react'

// Import ABI (copy from artifacts/contracts/FivesGame.sol/FivesGame.json)
import FivesGameABI from '../contracts/FivesGame.json'

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

export function useContract() {
  const { primaryWallet } = useDynamicContext()

  const contract = useMemo(() => {
    if (!primaryWallet) return null

    const provider = new ethers.BrowserProvider(primaryWallet.connector)
    const signer = provider.getSigner()
    
    return new ethers.Contract(CONTRACT_ADDRESS, FivesGameABI.abi, signer)
  }, [primaryWallet])

  return contract
}
```

### 2. Game Management Hook

Create `app/src/hooks/useGame.js`:

```javascript
import { useState, useEffect } from 'react'
import { useContract } from './useContract'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'

export function useGame() {
  const contract = useContract()
  const { primaryWallet } = useDynamicContext()
  const [games, setGames] = useState([])
  const [currentGame, setCurrentGame] = useState(null)
  const [loading, setLoading] = useState(false)

  // Create a new game
  const createGame = async (maxPlayers, allowIslands, playerName) => {
    if (!contract) throw new Error('Contract not connected')
    
    setLoading(true)
    try {
      const tx = await contract.createGame(maxPlayers, allowIslands, playerName)
      const receipt = await tx.wait()
      
      // Find GameCreated event
      const event = receipt.logs.find(log => 
        log.fragment?.name === 'GameCreated'
      )
      const gameId = event?.args[0]
      
      await loadGame(gameId)
      return gameId
    } finally {
      setLoading(false)
    }
  }

  // Join existing game
  const joinGame = async (gameId, playerName) => {
    if (!contract) throw new Error('Contract not connected')
    
    setLoading(true)
    try {
      const tx = await contract.joinGame(gameId, playerName)
      await tx.wait()
      await loadGame(gameId)
    } finally {
      setLoading(false)
    }
  }

  // Place a tile
  const placeTile = async (gameId, tileNumber, x, y) => {
    if (!contract) throw new Error('Contract not connected')
    
    setLoading(true)
    try {
      const tx = await contract.placeTile(gameId, tileNumber, x, y)
      await tx.wait()
      await loadGame(gameId)
    } finally {
      setLoading(false)
    }
  }

  // Load game data
  const loadGame = async (gameId) => {
    if (!contract || !primaryWallet) return

    try {
      const gameInfo = await contract.getGame(gameId)
      const playerInfo = await contract.getPlayer(gameId, primaryWallet.address)
      
      setCurrentGame({
        id: gameId,
        state: gameInfo.state,
        creator: gameInfo.creator,
        maxPlayers: gameInfo.maxPlayers,
        currentPlayerIndex: gameInfo.currentPlayerIndex,
        turnNumber: gameInfo.turnNumber,
        playerAddresses: gameInfo.playerAddresses,
        playerScores: gameInfo.playerScores,
        playerInfo: {
          name: playerInfo.name,
          score: playerInfo.score,
          hand: playerInfo.hand,
          hasJoined: playerInfo.hasJoined
        }
      })
    } catch (error) {
      console.error('Failed to load game:', error)
    }
  }

  // Get tile at position
  const getTileAt = async (gameId, x, y) => {
    if (!contract) return null
    
    try {
      const tile = await contract.getTileAt(gameId, x, y)
      return tile.exists ? {
        number: tile.number,
        turnPlaced: tile.turnPlaced
      } : null
    } catch (error) {
      console.error('Failed to get tile:', error)
      return null
    }
  }

  return {
    currentGame,
    games,
    loading,
    createGame,
    joinGame,
    placeTile,
    loadGame,
    getTileAt
  }
}
```

### 3. Integration with Existing Components

Update your `NewAgeGameBoard.tsx`:

```typescript
import { useGame } from '../hooks/useGame'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'

export function NewAgeGameBoard() {
  const { user } = useDynamicContext()
  const { currentGame, placeTile, getTileAt } = useGame()
  
  // Handle tile placement
  const handleTilePlacement = async (x: number, y: number, tileNumber: number) => {
    if (!user || !currentGame) return

    try {
      await placeTile(currentGame.id, tileNumber, x, y)
      // Update UI will happen automatically when currentGame updates
    } catch (error) {
      console.error('Failed to place tile:', error)
      // Show error to user
    }
  }

  // Check if position is valid for placement
  const isValidPosition = async (x: number, y: number) => {
    if (!currentGame) return false
    const tile = await getTileAt(currentGame.id, x, y)
    return tile === null // Position is valid if no tile exists
  }

  // Render tiles from blockchain
  const renderTilesFromChain = async () => {
    // You'll need to track placed tiles or query the contract
    // for the current board state
  }

  // Rest of your component...
}
```

## 🔄 Event Listening

Listen to contract events for real-time updates:

```javascript
// In your game component or hook
useEffect(() => {
  if (!contract) return

  const handleTilePlaced = (gameId, player, tileNumber, x, y, score) => {
    console.log(`Tile ${tileNumber} placed by ${player} at (${x}, ${y})`)
    // Update game state
    loadGame(gameId)
  }

  const handleTurnChanged = (gameId, nextPlayer, playerIndex) => {
    console.log(`Turn changed to player ${playerIndex}`)
    // Update UI to show whose turn it is
    loadGame(gameId)
  }

  // Listen to events
  contract.on('TilePlaced', handleTilePlaced)
  contract.on('TurnChanged', handleTurnChanged)

  // Cleanup
  return () => {
    contract.off('TilePlaced', handleTilePlaced)
    contract.off('TurnChanged', handleTurnChanged)
  }
}, [contract])
```

## 🎮 Game Flow Integration

### 1. Game Creation/Joining

```javascript
// In your game setup component
const handleCreateGame = async () => {
  try {
    const gameId = await createGame(2, false, "Player Name")
    console.log(`Game created with ID: ${gameId}`)
    // Navigate to game board
  } catch (error) {
    console.error('Failed to create game:', error)
  }
}

const handleJoinGame = async (gameId) => {
  try {
    await joinGame(gameId, "Player Name")
    console.log('Successfully joined game')
    // Navigate to game board
  } catch (error) {
    console.error('Failed to join game:', error)
  }
}
```

### 2. Tile Placement Validation

```javascript
// Validate move before sending to blockchain
const validateMove = (x, y, tileNumber) => {
  // Check if it's player's turn
  if (currentGame.currentPlayerIndex !== getPlayerIndex()) {
    throw new Error("Not your turn")
  }

  // Check if player has the tile
  if (!currentGame.playerInfo.hand.includes(tileNumber)) {
    throw new Error("You don't have this tile")
  }

  // Additional validation...
  return true
}
```

## 🔐 Error Handling

```javascript
const handleContractError = (error) => {
  if (error.reason) {
    // Contract revert with reason
    switch (error.reason) {
      case 'Not your turn':
        showError('Please wait for your turn')
        break
      case 'Invalid tile placement':
        showError('This tile placement is not allowed')
        break
      case "Player doesn't have this tile":
        showError('You do not have this tile in your hand')
        break
      default:
        showError(`Game error: ${error.reason}`)
    }
  } else {
    // Network or other error
    showError('Transaction failed. Please try again.')
  }
}
```

## 📋 Next Steps

1. **Copy ABI**: Copy the contract ABI from `artifacts/` to your React app
2. **Update Contract Address**: Use the actual deployed contract address
3. **Test Integration**: Start with basic functions like creating/joining games
4. **Add Event Listeners**: Implement real-time updates
5. **Error Handling**: Add comprehensive error handling
6. **Loading States**: Show loading indicators during transactions
7. **Gas Optimization**: Consider batching transactions if needed

## 🚀 Production Deployment

For production:

1. Deploy contract to testnet/mainnet
2. Update contract address and network in your app
3. Add environment variables for different networks
4. Implement proper error handling and user feedback
5. Add transaction confirmation UI
6. Consider gas fee estimation and optimization

## 💡 Tips

- Always validate moves client-side before sending to contract
- Use event listeners for real-time updates
- Handle loading states and transaction confirmations
- Test thoroughly on testnets before mainnet
- Consider implementing a game state cache for better UX
- Add proper error messages for all contract rejections 