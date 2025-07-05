/** @jsxImportSource @emotion/react */
import { useEffect } from 'react'
import {
  DynamicContextProvider,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core"
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum"
import { ZeroDevSmartWalletConnectors } from "@dynamic-labs/ethereum-aa"
import { GameDisplay } from './GameDisplay'
import { TexturePreview } from './components/TexturePreview'
import { NewAgeDisplay } from './NewAgeDisplay'
import { RulesPage } from './components/RulesPage'
import { GameGallery } from './components/GameGallery'
import { GameController } from './components/GameController'
import { GameLanding } from './components/GameLanding'
import { FivesGameInterface } from './components/FivesGameInterface'
import { MysticalGameJoinPage } from './components/MysticalGameJoinPage'
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

  // Simple routing based on pathname and hash
  const showTexturePreview = window.location.hash === '#textures'
  const showNewAge = window.location.pathname.includes('/new-age')
  const showRules = window.location.pathname.includes('/rules')
  const showGallery = window.location.pathname.includes('/gallery')
  const showGame = window.location.pathname.includes('/game/')
  const showSetup = window.location.pathname.includes('/setup')
  const showFives = window.location.pathname.includes('/fives')
  const showMysticalJoin = window.location.pathname.includes('/mystical-join')
  
  // Parse game ID from game URL like /game/123 or /game/123/play
  const gameMatch = window.location.pathname.match(/\/game\/(\d+)/)
  const gameId = gameMatch ? parseInt(gameMatch[1], 10) : null
  const autoJoin = window.location.pathname.includes('/play') // /game/123/play = join as player
  
  // Debug URL parsing
  console.log('🔍 App Router Debug:', {
    pathname: window.location.pathname,
    gameMatch: gameMatch,
    gameId: gameId,
    autoJoin: autoJoin,
    showGame: window.location.pathname.includes('/game/')
  })
  
  // Route to different components
  if (showTexturePreview) {
    return <TexturePreview />
  }
  
  if (showNewAge) {
    return <NewAgeDisplay />
  }
  
  if (showRules) {
    return <RulesPage onBackToGame={() => window.history.back()} />
  }
  
  if (showGallery) {
    return <GameGallery onSelectGame={(gameId) => {
      window.location.pathname = `/game/${gameId}`
    }} />
  }
  
  if (showFives) {
    return <FivesGameInterface />
  }
  
  if (showMysticalJoin) {
    return <MysticalGameJoinPage onBackToMenu={() => {
      window.location.pathname = '/'
    }} />
  }
  
  if (showGame && gameId) {
    console.log(`🎮 App Router: Rendering GameController for game ${gameId}, autoJoin: ${autoJoin}`)
    return <GameController 
      gameId={gameId} 
      autoJoin={autoJoin}
      onExit={() => {
        window.location.pathname = '/gallery'
      }} 
    />
  }

  if (showSetup) {
    return <GameDisplay />
  }
  
  // Default: Show the new landing page
  return <GameLanding
    onPlayGame={() => {
      window.location.pathname = '/setup'
    }}
    onViewRules={() => {
      window.location.pathname = '/rules'
    }}
    onViewGallery={() => {
      window.location.pathname = '/gallery'
    }}
    onPlayFives={() => {
      window.location.pathname = '/fives'
    }}
  />
}

function App() {
  // Environment detection
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1'
  
  const environmentId = process.env.REACT_APP_DYNAMIC_ENVIRONMENT_ID || 
                       (isDevelopment ? "dev-environment-needed" : "80ae4eec-6bf1-4268-8a7a-663fbb8aad69")
  
  // Log environment info for debugging
  console.log('🌍 App Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    hostname: window.location.hostname,
    isDevelopment,
    dynamicEnvironmentId: environmentId,
    customNetworksCount: customEvmNetworks.length
  })
  
  // Warning if using placeholder environment ID
  if (environmentId === "dev-environment-needed") {
    console.warn('⚠️ Development Dynamic environment not configured! Please create a dev environment and set REACT_APP_DYNAMIC_ENVIRONMENT_ID in .env.local')
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId: environmentId,
        walletConnectors: [
          EthereumWalletConnectors,
          ZeroDevSmartWalletConnectors,
        ],
        appName: "Fives - Tile Weaving Game",
        appLogoUrl: "/favicon-32x32.png",
        overrides: {
          evmNetworks: (networks) => [...networks, ...customEvmNetworks],
        },
        events: {
          onAuthFlowClose: () => {
            console.log('🔐 Dynamic auth flow closed')
          },
          onAuthSuccess: (user) => {
            console.log('🎉 Dynamic auth success:', user)
          },
          onAuthFailure: (error) => {
            console.error('❌ Dynamic auth failure:', error)
          },
          onLogout: () => {
            console.log('👋 Dynamic logout')
          }
        }
      }}
    >
      <GameRouter />
    </DynamicContextProvider>
  )
}

export default App
