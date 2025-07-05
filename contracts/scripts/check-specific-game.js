const { ethers } = require("hardhat");
const { getLatestContractAddress } = require("./get-latest-contract");

async function main() {
  // Get gameId from hardhat arguments or default to 7
  const gameId = process.env.GAME_ID || "7";
  
  console.log(`🎮 Checking Game ${gameId}`);
  console.log("==================================================");
  
  const FivesGame = await ethers.getContractFactory("FivesGame");
  const contractAddress = getLatestContractAddress(); // Get from latest deployment
  const fivesGame = FivesGame.attach(contractAddress);
  
  try {
    // Get next game ID to see what games exist
    const nextGameId = await fivesGame.nextGameId();
    console.log(`📊 Next Game ID: ${nextGameId}`);
    console.log(`🔍 Checking if Game ${gameId} exists...`);
    
    if (parseInt(gameId) >= parseInt(nextGameId.toString())) {
      console.log(`❌ Game ${gameId} doesn't exist yet. Last game is ${parseInt(nextGameId.toString()) - 1}`);
      return;
    }
    
    // Get game info
    const gameData = await fivesGame.getGame(gameId);
    console.log(`📊 Game State: ${gameData.state}`);
    console.log(`👥 Players: ${gameData.playerAddresses.length}`);
    console.log(`🎯 Current Player Index: ${gameData.currentPlayerIndex}`);
    console.log(`🔄 Turn Number: ${gameData.turnNumber}`);
    
    console.log("\n👥 Player Details:");
    console.log("==============================");
    for (let i = 0; i < gameData.playerAddresses.length; i++) {
      const addr = gameData.playerAddresses[i];
      console.log(`👤 Player ${i + 1}: ${addr}`);
      
      try {
        const playerData = await fivesGame.getPlayer(gameId, addr);
        console.log(`   Name: ${playerData.name}`);
        console.log(`   Score: ${playerData.score}`);
        console.log(`   Hand: [${playerData.hand.join(", ")}]`);
        console.log(`   Has Joined: ${playerData.hasJoined}`);
      } catch (err) {
        console.log(`   ❌ Error getting player data: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error checking game ${gameId}:`, error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 