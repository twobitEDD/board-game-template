import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useMemo } from 'react'

// Contract configuration
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const HARDHAT_CHAIN_ID = 1337

// Contract ABI - key functions we need
const CONTRACT_ABI = [
  "function createGame(uint8 maxPlayers, bool allowIslands, string memory playerName) external returns (uint256)",
  "function joinGame(uint256 gameId, string memory playerName) external",
  "function placeTile(uint256 gameId, uint8 tileNumber, int16 x, int16 y) external",
  "function getGame(uint256 gameId) external view returns (uint8 state, address creator, uint8 maxPlayers, uint8 currentPlayerIndex, uint256 turnNumber, uint256 createdAt, bool allowIslands, address[] memory playerAddresses, uint256[] memory playerScores)",
  "function getPlayer(uint256 gameId, address playerAddr) external view returns (string memory name, uint256 score, uint8[] memory hand, bool hasJoined, uint256 lastMoveTime)",
  "function getTileAt(uint256 gameId, int16 x, int16 y) external view returns (bool exists, uint8 number, uint256 turnPlaced)",
  "function getPlayerGames(address player) external view returns (uint256[] memory)",
  "event GameCreated(uint256 indexed gameId, address indexed creator, uint8 maxPlayers)",
  "event PlayerJoined(uint256 indexed gameId, address indexed player, string name)",
  "event GameStarted(uint256 indexed gameId)",
  "event TilePlaced(uint256 indexed gameId, address indexed player, uint8 tileNumber, int16 x, int16 y, uint256 score)",
  "event TurnChanged(uint256 indexed gameId, address indexed nextPlayer, uint8 playerIndex)"
]

export function useContract() {
  const { primaryWallet } = useDynamicContext()

  const contractInfo = useMemo(() => {
    if (!primaryWallet) return null

    return {
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      wallet: primaryWallet,
      chainId: HARDHAT_CHAIN_ID
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
    isConnected: !!primaryWallet
  }
}

// Helper function to encode function calls (simplified)
function encodeFunction(method: string, args: any[]): string {
  // For demo purposes, we'll use a simplified approach
  // In production, you'd use ethers.js or web3.js for proper encoding
  return '0x' // This would be properly encoded function call
} 