const { ethers } = require("hardhat");
const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');

// This replicates the frontend's getAllGames logic exactly
async function testFrontendConnection() {
  console.log("🧪 Testing Frontend Connection Logic...");
  
  const contractAddress = "0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F";
  const userWallet = "0x06b8E118eDe5AC5aa96fCecc5E7832EEdA29186d";
  
  console.log("📍 Testing for Game 4 with user wallet:", userWallet);
  
  // Method 1: Hardhat way (known working)
  console.log("\n=== METHOD 1: Hardhat ethers (working baseline) ===");
  try {
    const contract = await ethers.getContractAt("FivesGame", contractAddress);
    const nextGameId = await contract.nextGameId();
    const totalGames = Number(nextGameId) - 1;
    console.log("✅ Hardhat: Total games:", totalGames);
    
    if (totalGames >= 4) {
      const gameData = await contract.getGame(4);
      console.log("✅ Hardhat: Game 4 exists with creator:", gameData[1]);
    }
  } catch (error) {
    console.log("❌ Hardhat method failed:", error.message);
  }
  
  // Method 2: Viem way (frontend approach) with Base Sepolia
  console.log("\n=== METHOD 2: Viem with Base Sepolia (frontend method) ===");
  try {
    // Create exactly the same client the frontend should use
    const publicClient = createPublicClient({
      chain: { 
        ...base, 
        id: 84532, 
        name: 'Base Sepolia Testnet',
        rpcUrls: {
          default: { http: ['https://sepolia.base.org'] },
          public: { http: ['https://sepolia.base.org'] }
        }
      },
      transport: http('https://sepolia.base.org', {
        retryCount: 2,
        retryDelay: 1000,
        timeout: 10000
      })
    });
    
    console.log("🔗 Testing RPC connection...");
    const blockNumber = await publicClient.getBlockNumber();
    console.log("✅ Connected to Base Sepolia, block:", blockNumber.toString());
    
    // Load the ABI exactly like frontend
    const FivesGameABI = require('../artifacts/contracts/FivesGame.sol/FivesGame.json');
    console.log("📋 ABI loaded, functions count:", FivesGameABI.abi.length);
    
    // Test nextGameId call
    console.log("🔍 Calling nextGameId...");
    const nextGameId = await publicClient.readContract({
      address: contractAddress,
      abi: FivesGameABI.abi,
      functionName: 'nextGameId',
      args: []
    });
    
    const totalGames = Number(nextGameId) - 1;
    console.log("✅ nextGameId:", nextGameId.toString(), "→ totalGames:", totalGames);
    
    if (totalGames === 0) {
      console.log("❌ No games found! Frontend would show empty list.");
      return;
    }
    
    // Test individual game fetching
    console.log(`\n🎮 Testing individual game fetching (1 to ${totalGames})...`);
    const games = [];
    
    for (let gameId = 1; gameId <= totalGames; gameId++) {
      try {
        console.log(`🔍 Fetching game ${gameId}...`);
        
        const gameData = await publicClient.readContract({
          address: contractAddress,
          abi: FivesGameABI.abi,
          functionName: 'getGame',
          args: [gameId]
        });
        
        // Parse exactly like frontend
        const game = {
          id: gameId,
          state: Number(gameData[0]),
          creator: gameData[1],
          maxPlayers: Number(gameData[2]),
          currentPlayerIndex: Number(gameData[3]),
          turnNumber: Number(gameData[4]),
          playerAddresses: gameData[7],
          playerScores: gameData[8].map(score => Number(score)),
          createdAt: Number(gameData[5]),
          allowIslands: gameData[6],
          tilesRemaining: Number(gameData[9])
        };
        
        games.push(game);
        
        const stateNames = ['Setup', 'InProgress', 'Completed', 'Cancelled'];
        console.log(`✅ Game ${gameId}: ${stateNames[game.state]}, Creator: ${game.creator.slice(0,8)}..., Players: ${game.playerAddresses.length}/${game.maxPlayers}`);
        
        // Special focus on Game 4
        if (gameId === 4) {
          console.log(`🎯 GAME 4 DETAILS:`, {
            id: game.id,
            state: stateNames[game.state],
            creator: game.creator,
            maxPlayers: game.maxPlayers,
            playerAddresses: game.playerAddresses,
            playerScores: game.playerScores,
            isUserCreator: game.creator.toLowerCase() === userWallet.toLowerCase(),
            isUserPlayer: game.playerAddresses.some(addr => addr.toLowerCase() === userWallet.toLowerCase()),
            turnNumber: game.turnNumber,
            tilesRemaining: game.tilesRemaining
          });
        }
        
      } catch (error) {
        console.log(`❌ Game ${gameId} failed:`, error.message);
      }
    }
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`  Total games fetched: ${games.length}`);
    console.log(`  Games list:`, games.map(g => `Game ${g.id} (${['Setup', 'InProgress', 'Completed', 'Cancelled'][g.state]})`));
    
    // Test the exact find logic the frontend uses
    console.log(`\n🔍 Testing frontend's find logic for Game 4...`);
    const targetGameId = 4;
    console.log(`  Looking for gameId: ${targetGameId} (type: ${typeof targetGameId})`);
    console.log(`  Available game IDs:`, games.map(g => `${g.id} (${typeof g.id})`));
    
    const foundGame = games.find(g => g.id === targetGameId);
    
    if (foundGame) {
      console.log(`✅ Game 4 FOUND by frontend logic!`);
      console.log(`  User role analysis:`);
      console.log(`    - Is creator: ${foundGame.creator.toLowerCase() === userWallet.toLowerCase()}`);
      console.log(`    - Is player: ${foundGame.playerAddresses.some(addr => addr.toLowerCase() === userWallet.toLowerCase())}`);
      console.log(`    - Can join: ${foundGame.state === 0 && foundGame.playerAddresses.length < foundGame.maxPlayers}`);
      console.log(`    - Should show start button: ${foundGame.creator.toLowerCase() === userWallet.toLowerCase() && foundGame.state === 0}`);
    } else {
      console.log(`❌ Game 4 NOT FOUND by frontend logic!`);
      console.log(`  This explains why frontend shows "Game 4 not found"`);
    }
    
  } catch (error) {
    console.log("❌ Viem method failed:", error.message);
    console.log("❌ Full error:", error);
  }
}

testFrontendConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 