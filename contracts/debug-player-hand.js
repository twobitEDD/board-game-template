const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging Player Hand State");
  console.log("=" .repeat(50));
  
  const contractAddress = "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  const playerAddress = "0xc70944265be5bae9E093A4b7e1282B65b0d6Dfd9";
  const gameId = 2;
  
  try {
    console.log("📍 Contract:", contractAddress);
    console.log("👤 Player:", playerAddress);
    console.log("🎮 Game ID:", gameId);
    
    // Get player data
    const playerData = await contract.getPlayer(gameId, playerAddress);
    const hand = playerData[2].map(n => Number(n));
    console.log("🃏 Contract says player hand:", hand);
    
    // Get game data
    const gameData = await contract.getGame(gameId);
    console.log("🎮 Game state:", Number(gameData[0])); // 0=Setup, 1=InProgress, 2=Complete
    console.log("👤 Current player index:", Number(gameData[3]));
    console.log("🔄 Turn number:", Number(gameData[4]));
    
    // Check what the frontend tried to play
    const frontendTiles = [6, 9, 7, 8];
    console.log("\n📋 Frontend tried to play: [" + frontendTiles.join(", ") + "]");
    console.log("❓ Which tiles does player actually have?");
    
    frontendTiles.forEach(tile => {
      const hasIt = hand.includes(tile);
      console.log(`  - Tile ${tile}: ${hasIt ? '✅ HAS' : '❌ MISSING'}`);
    });
    
    // Check if it's the player's turn
    console.log("\n🔄 Turn Check:");
    const gamePlayerAddresses = gameData[7]; // playerAddresses array
    console.log("🔍 Player addresses in game:", gamePlayerAddresses);
    const playerIndex = gamePlayerAddresses.findIndex(addr => addr.toLowerCase() === playerAddress.toLowerCase());
    console.log("👤 Player index:", playerIndex);
    console.log("🎯 Current player index:", Number(gameData[3]));
    const isPlayerTurn = playerIndex === Number(gameData[3]);
    console.log("✅ Is player's turn:", isPlayerTurn);
    
    // Additional debug: Check if player exists in game
    console.log("\n🔍 Player Status:");
    console.log("📊 Player score:", Number(playerData[1]));
    console.log("📅 Last move time:", Number(playerData[3]));
    
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
