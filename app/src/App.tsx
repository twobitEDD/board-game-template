/** @jsxImportSource @emotion/react */
import { useEffect } from 'react'
import {
  DynamicContextProvider,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core"
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum"
import { GameDisplay } from './GameDisplay'
import { TexturePreview } from './components/TexturePreview'
import { NewAgeDisplay } from './NewAgeDisplay'
import { RulesPage } from './components/RulesPage'
import { userService } from './services/UserService'

// Define custom networks - both Hardhat for testing and Base for live game
const customEvmNetworks = [
  {
    blockExplorerUrls: [],
    chainId: 1337,
    chainName: "Hardhat Local",
    name: "Hardhat Local",
    rpcUrls: ["http://127.0.0.1:8545"],
    iconUrls: [],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    networkId: 1337,
    vanityName: "Hardhat Local",
  },
  {
    blockExplorerUrls: ["https://basescan.org"],
    chainId: 8453,
    chainName: "Base",
    name: "Base",
    rpcUrls: ["https://mainnet.base.org"],
    iconUrls: ["https://raw.githubusercontent.com/base-org/brand-kit/main/logo/in-product/Base_Network_Logo.svg"],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    networkId: 8453,
    vanityName: "Base Mainnet",
  },
  {
    blockExplorerUrls: ["https://sepolia.basescan.org"],
    chainId: 84532,
    chainName: "Base Sepolia",
    name: "Base Sepolia Testnet", 
    rpcUrls: ["https://sepolia.base.org"],
    iconUrls: ["https://raw.githubusercontent.com/base-org/brand-kit/main/logo/in-product/Base_Network_Logo.svg"],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    networkId: 84532,
    vanityName: "Base Sepolia",
  }
]

// Main game router component (inside Dynamic context)
function GameRouter() {
  const { user } = useDynamicContext()
  const isAuthenticated = !!user
  
  useEffect(() => {
    // Initialize user service when app loads
    userService.initialize()
    
    // If Dynamic user is authenticated, sync with our user service
    if (isAuthenticated && user) {
      const existingUser = userService.getCurrentUser()
      
      if (!existingUser || existingUser.id.startsWith('guest_')) {
        // Create or update user profile from Dynamic data
        const userProfile = userService.createGuestUser(
          user.email || user.alias || 'Player'
        )
        
        // Update with Dynamic data
        userService.updateUserProfile({
          email: user.email,
          walletAddress: (user as any).walletPublicKey,
          displayName: user.email || user.alias || userProfile.displayName
        })
        
        console.log('🔐 User synced with Dynamic:', user.email || user.alias)
      }
    } else if (!userService.isAuthenticated()) {
      // Create guest user for offline play
      userService.createGuestUser()
    }
  }, [isAuthenticated, user])

  // Simple routing based on pathname
  const showTexturePreview = window.location.hash === '#textures'
  const showNewAge = window.location.pathname.includes('/new-age')
  const showRules = window.location.pathname.includes('/rules')
  
  if (showTexturePreview) {
    return <TexturePreview />
  }
  
  if (showNewAge) {
    return <NewAgeDisplay />
  }
  
  if (showRules) {
    return <RulesPage onBackToGame={() => window.history.back()} />
  }
  
  return <GameDisplay />
}

function App() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: "c47818bf-7ad9-482e-8625-ea438d529538",
        walletConnectors: [EthereumWalletConnectors],
        appName: "Fives - Tile Weaving Game",
        appLogoUrl: "/favicon-32x32.png",
        overrides: {
          evmNetworks: (networks) => [...networks, ...customEvmNetworks],
        },
      }}
    >
      <GameRouter />
    </DynamicContextProvider>
  )
}

export default App
