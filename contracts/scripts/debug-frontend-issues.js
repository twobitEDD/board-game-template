const hre = require("hardhat");

async function main() {
  console.log("🔍 DEBUGGING FRONTEND GAME LOADING ISSUES");
  console.log("=" .repeat(50));
  
  // Configure for Base Sepolia
  const contractAddress = "0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F";
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📋 Network: Base Sepolia");
  console.log("📋 Contract:", contractAddress);
  console.log("📋 Deployer:", deployer.address);
  
  // Connect to the contract
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  const fivesGame = FivesGame.attach(contractAddress);
  
  console.log("\n🎮 CHECKING GAME COUNT...");
  try {
    const nextGameId = await fivesGame.nextGameId();
    const totalGames = Number(nextGameId) - 1;
    console.log(`📊 nextGameId: ${nextGameId}`);
    console.log(`📊 Total games: ${totalGames}`);
    
    if (totalGames === 0) {
      console.log("❌ No games found! This explains why the frontend can't load any games.");
      console.log("💡 Frontend probably doesn't have any games to display.");
      return;
    }
    
    console.log("\n🔍 TESTING INDIVIDUAL GAME RETRIEVAL...");
    
    for (let i = 1; i <= Math.min(totalGames, 5); i++) { // Test first 5 games
      try {
        console.log(`\n--- Testing Game ${i} ---`);
        
        // Test getGame function (what frontend uses)
        const gameData = await fivesGame.getGame(i);
        console.log(`✅ Game ${i} getGame() response:`, {
          state: Number(gameData[0]),
          creator: gameData[1],
          maxPlayers: Number(gameData[2]),
          currentPlayerIndex: Number(gameData[3]),
          turnNumber: Number(gameData[4]),
          playerAddresses: gameData[7],
          playerScores: gameData[8].map(s => Number(s)),
          tilesRemaining: Number(gameData[9])
        });
        
        // Test if there are any player data
        if (gameData[7].length > 0) {
          const playerAddr = gameData[7][0];
          try {
            const playerData = await fivesGame.getPlayer(i, playerAddr);
            console.log(`👤 Player data for ${playerAddr}:`, {
              name: playerData[0],
              score: Number(playerData[1]),
              hand: playerData[2].map(h => Number(h)),
              hasJoined: playerData[3]
            });
          } catch (playerError) {
            console.log(`❌ Could not get player data: ${playerError.message}`);
          }
        }
        
        // Test placed tiles
        try {
          const tilesData = await fivesGame.getPlacedTiles(i);
          console.log(`🎯 Placed tiles for game ${i}:`, {
            count: tilesData[0].length,
            xPositions: tilesData[0].slice(0, 3).map(x => Number(x)), // First 3
            yPositions: tilesData[1].slice(0, 3).map(y => Number(y)), // First 3
            numbers: tilesData[2].slice(0, 3).map(n => Number(n)) // First 3
          });
        } catch (tilesError) {
          console.log(`❌ Could not get tiles data: ${tilesError.message}`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to get game ${i}:`, error.message);
      }
    }
    
    console.log("\n🌐 TESTING FRONTEND-STYLE ACCESS...");
    
    // Simulate what the frontend does
    const publicClient = hre.ethers.provider;
    console.log("📡 Testing direct contract call (like frontend does)...");
    
    try {
      // Call using the same method as frontend
      const call = await publicClient.call({
        to: contractAddress,
        data: fivesGame.interface.encodeFunctionData('nextGameId', [])
      });
      const decoded = fivesGame.interface.decodeFunctionResult('nextGameId', call);
      console.log("✅ Direct contract call works:", Number(decoded[0]));
    } catch (error) {
      console.log("❌ Direct contract call failed:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Error checking games:", error);
  }
  
  console.log("\n💡 SUMMARY:");
  console.log("If you see games listed above, the contract is working.");
  console.log("If frontend still can't load games, the issue is likely:");
  console.log("1. Network mismatch between frontend and contract");
  console.log("2. Contract address mismatch");
  console.log("3. RPC connection issues");
  console.log("4. Frontend routing/component issues");
  console.log("\n🎯 Next steps: Check browser console for frontend errors!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 