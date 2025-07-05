const { ethers } = require("hardhat");

async function debug() {
  console.log("🔍 Debugging FivesGame contract...");
  
  const contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  try {
    const gameId = 1;
    console.log("📊 Checking game", gameId);
    
    // Get game data
    const gameData = await contract.getGame(gameId);
    console.log("Game state:", gameData[0]);
    console.log("Player addresses:", gameData[7]);
    console.log("Player scores:", gameData[8].map(s => s.toString()));
    console.log("Total tiles remaining:", gameData[9].toString());
    
    // Check both players
    for (let i = 0; i < gameData[7].length; i++) {
      const player = gameData[7][i];
      console.log(`\n👤 === PLAYER ${i + 1}: ${player} ===`);
      
      // Get player data
      const playerData = await contract.getPlayer(gameId, player);
      console.log("Player name:", playerData[0]);
      console.log("Player score:", playerData[1].toString());
      console.log("Player hand:", playerData[2].map(t => t.toString()));
      console.log("Player has joined:", playerData[3]);
      
      // Check player's individual tile pool
      console.log("🎲 Individual tile pool...");
      const playerPool = await contract.getPlayerTilePool(gameId, player);
      console.log("Player tile pool counts:", playerPool.map(c => c.toString()));
      console.log("Total tiles in player pool:", playerPool.reduce((a, b) => Number(a) + Number(b), 0));
      
      // Test what happens with wrong address
      console.log("🧪 Testing with different address...");
      try {
        const wrongPool = await contract.getPlayerTilePool(gameId, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
        console.log("Wrong address result:", wrongPool.map(c => c.toString()));
      } catch (error) {
        console.log("Wrong address error:", error.message);
      }
    }
    
    // Test the scoring calculation
    console.log("\n🎯 === SCORING DEBUG ===");
    console.log("Player 1 score:", gameData[8][0].toString());
    console.log("Player 2 score:", gameData[8][1].toString());
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

debug()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 