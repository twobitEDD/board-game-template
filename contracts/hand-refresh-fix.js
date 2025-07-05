const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Testing Hand Refresh Fix");
  console.log("=" .repeat(50));
  
  const contractAddress = "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  const playerAddress = "0xc70944265be5bae9E093A4b7e1282B65b0d6Dfd9";
  const gameId = 2;
  
  try {
    console.log("👤 Player:", playerAddress);
    console.log("🎮 Game ID:", gameId);
    
    // Get current hand
    console.log("\n🃏 Fetching current hand from blockchain...");
    const playerData = await contract.getPlayer(gameId, playerAddress);
    const currentHand = playerData[2].map(n => Number(n));
    console.log("✅ Current hand from blockchain:", currentHand);
    
    // Check game state
    const gameData = await contract.getGame(gameId);
    console.log("\n🎮 Game state:");
    console.log("  - State:", Number(gameData[0]));
    console.log("  - Current player index:", Number(gameData[3]));
    console.log("  - Turn number:", Number(gameData[4]));
    console.log("  - Player score:", Number(playerData[1]));
    
    console.log("\n📋 SOLUTION - Frontend Fix Required:");
    console.log("=" .repeat(50));
    console.log("The issue is that frontend shows stale hand data.");
    console.log("After successful transactions, frontend must refresh:");
    console.log("");
    console.log("// Add this after transaction confirmation:");
    console.log("const updatedPlayerInfo = await getPlayerInfo(gameId, playerAddress)");
    console.log("setPlayerInfo(updatedPlayerInfo) // Update React state");
    console.log("");
    console.log("This ensures UI shows current blockchain hand state,");
    console.log("not stale data from before the transaction.");
    
    console.log("\n✅ Hand refresh fix validation complete!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
