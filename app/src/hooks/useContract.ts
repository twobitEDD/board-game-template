import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useMemo } from 'react'

// Contract configuration - Updated with deployed FivesGame contract
const CONTRACT_ADDRESS = '0x80f80B22D1839F2216F7f7814398e7039Fc17546' // Deployed FivesGame on Base
const BASE_CHAIN_ID = 8453 // Base Mainnet

// Contract ABI - Updated with actual FivesGame functions
const CONTRACT_ABI = [
  "function createGame(uint8 maxPlayers, bool allowIslands, uint256 winningScore, string memory playerName) external returns (uint256)",
  "function joinGame(uint256 gameId, string memory playerName) external",
  "function startGame(uint256 gameId) external",
  "function playTurn(uint256 gameId, tuple(uint8 number, int16 x, int16 y)[] memory placements) external",
  "function skipTurn(uint256 gameId) external",
  "function cancelGame(uint256 gameId) external",
  "function getGame(uint256 gameId) external view returns (uint8 state, address creator, uint8 maxPlayers, uint8 currentPlayerIndex, uint256 turnNumber, uint256 createdAt, bool allowIslands, address[] memory playerAddresses, uint256[] memory playerScores, uint256 tilesRemaining, uint256 winningScore)",
  "function getPlayer(uint256 gameId, address playerAddr) external view returns (string memory name, uint256 score, uint8[] memory hand, bool hasJoined, uint256 lastMoveTime)",
  "function getTileAt(uint256 gameId, int16 x, int16 y) external view returns (bool exists, uint8 number, uint256 turnPlaced)",
  "function getPlayerGames(address player) external view returns (uint256[] memory)",
  "function getTilePoolStatus(uint256 gameId) external view returns (uint8[10] memory)",
  "function HAND_SIZE() external view returns (uint8)",
  "function WINNING_SCORE() external view returns (uint256)",
  "function nextGameId() external view returns (uint256)",
  "event GameCreated(uint256 indexed gameId, address indexed creator, uint8 maxPlayers)",
  "event PlayerJoined(uint256 indexed gameId, address indexed player, string name)",
  "event GameStarted(uint256 indexed gameId)",
  "event TurnPlaced(uint256 indexed gameId, address indexed player, tuple(uint8 number, int16 x, int16 y)[] placements, uint256 score)",
  "event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 score)",
  "event GameCancelled(uint256 indexed gameId)",
  "event TurnChanged(uint256 indexed gameId, address indexed currentPlayer, uint8 playerIndex)",
  "event TilesDrawn(uint256 indexed gameId, address indexed player, uint8 tilesDrawn)"
]

export function useContract() {
  const { primaryWallet } = useDynamicContext()

  const contractInfo = useMemo(() => {
    if (!primaryWallet) return null

    return {
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      wallet: primaryWallet,
      chainId: BASE_CHAIN_ID
    }
  }, [primaryWallet])

  // Contract interaction functions using Dynamic's wallet
  const callContract = async (method: string, args: any[] = []) => {
    if (!contractInfo) throw new Error('Wallet not connected')

    try {
      // Use Dynamic's wallet to interact with contract
      const result = await primaryWallet.connector.request({
        method: 'eth_call',
        params: [{
          to: CONTRACT_ADDRESS,
          data: encodeFunction(method, args)
        }, 'latest']
      })
      
      return result
    } catch (error) {
      console.error('Contract call failed:', error)
      throw error
    }
  }

  const sendTransaction = async (method: string, args: any[] = []) => {
    if (!contractInfo) throw new Error('Wallet not connected')

    try {
      const txHash = await primaryWallet.connector.request({
        method: 'eth_sendTransaction',
        params: [{
          to: CONTRACT_ADDRESS,
          data: encodeFunction(method, args),
          from: primaryWallet.address
        }]
      })
      
      return txHash
    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    }
  }

  return {
    contractInfo,
    callContract,
    sendTransaction,
    isConnected: !!primaryWallet,
    contractAddress: CONTRACT_ADDRESS,
    chainId: BASE_CHAIN_ID
  }
}

// Helper function to encode function calls (simplified)
function encodeFunction(method: string, args: any[]): string {
  // For demo purposes, we'll use a simplified approach
  // In production, you'd use ethers.js or web3.js for proper encoding
  return '0x' // This would be properly encoded function call
} 