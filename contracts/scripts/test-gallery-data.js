const hre = require("hardhat");

async function main() {
  console.log("🔍 Testing Gallery Data Access...\n");

  // Contract address from our deployment
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  try {
    // Get the contract instance
    const FivesGame = await hre.ethers.getContractFactory("FivesGame");
    const game = FivesGame.attach(contractAddress);
    
    console.log("📍 Testing contract at:", contractAddress);
    
    // Test 1: Check if contract exists
    const code = await hre.ethers.provider.getCode(contractAddress);
    if (code === "0x") {
      console.log("❌ Contract not found at this address");
      return;
    }
    console.log("✅ Contract exists");
    
    // Test 2: Try calling nextGameId to see how many games exist
    try {
      const nextGameId = await game.nextGameId();
      console.log("🎮 Next game ID:", nextGameId.toString());
      console.log("📊 Total games created:", (Number(nextGameId) - 1));
    } catch (e) {
      console.log("⚠️ Could not get nextGameId:", e.message);
    }
    
    // Test 3: Try to get information for games 1-5
    console.log("\n🎯 Testing individual games:");
    for (let gameId = 1; gameId <= 5; gameId++) {
      try {
        const gameInfo = await game.getGame(gameId);
        console.log(`Game ${gameId}:`, {
          state: gameInfo.state,
          playerCount: gameInfo.playerAddresses.length,
          maxPlayers: gameInfo.maxPlayers,
          turnNumber: gameInfo.turnNumber.toString(),
          tilesRemaining: gameInfo.tilesRemaining.toString()
        });
      } catch (e) {
        console.log(`Game ${gameId}: ❌ Error -`, e.message);
      }
    }
    
    // Test 4: Check game state values
    console.log("\n📋 Game state meanings:");
    console.log("0 = Setup (waiting for players)");
    console.log("1 = Playing (active game)");
    console.log("2 = Completed");
    console.log("3 = Cancelled");
    
    console.log("\n✅ Gallery data test complete!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 