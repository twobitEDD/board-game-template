const hre = require("hardhat");

async function main() {
  console.log("📊 Final Game State Summary for Gallery\n");
  console.log("=====================================");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [player1] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  const game = FivesGame.attach(contractAddress).connect(player1);
  
  try {
    // Check how many games exist
    const nextGameId = await game.nextGameId();
    console.log(`🎮 Total games created: ${Number(nextGameId) - 1}\n`);
    
    // Show details for each game
    for (let gameId = 1; gameId < Number(nextGameId); gameId++) {
      try {
        const gameInfo = await game.getGame(gameId);
        const stateNames = ['Setup', 'InProgress', 'Completed', 'Cancelled'];
        const stateName = stateNames[gameInfo.state] || 'Unknown';
        
        console.log(`🎯 Game ${gameId}:`);
        console.log(`   State: ${stateName} (${gameInfo.state})`);
        console.log(`   Players: ${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
        console.log(`   Turn: ${gameInfo.turnNumber}`);
        console.log(`   Tiles Remaining: ${gameInfo.tilesRemaining}`);
        console.log(`   Winning Score: ${gameInfo.winningScore}`);
        console.log(`   Allow Islands: ${gameInfo.allowIslands}`);
        
        // Show player details
        console.log(`   Players:`);
        for (let i = 0; i < gameInfo.playerAddresses.length; i++) {
          const playerAddr = gameInfo.playerAddresses[i];
          const playerInfo = await game.getPlayer(gameId, playerAddr);
          const isCurrentPlayer = gameInfo.state === 1 && i === gameInfo.currentPlayerIndex;
          const turnIndicator = isCurrentPlayer ? ' 👈 CURRENT TURN' : '';
          
          console.log(`     ${i+1}. "${playerInfo.name}" (${playerAddr.slice(0,6)}...)`);
          console.log(`        Score: ${playerInfo.score}, Hand: ${playerInfo.hand.length} tiles${turnIndicator}`);
        }
        
        console.log();
        
      } catch (e) {
        console.log(`❌ Game ${gameId}: Error - ${e.message}\n`);
      }
    }
    
    console.log("🎉 All games ready for gallery display!");
    console.log("\n📱 Gallery URLs:");
    console.log("   Main Gallery: http://localhost:3001/gallery");
    for (let gameId = 1; gameId < Number(nextGameId); gameId++) {
      console.log(`   Game ${gameId}: http://localhost:3001/game/${gameId}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 