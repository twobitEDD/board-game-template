const hre = require("hardhat");

async function main() {
  console.log("⏭️ Advancing Games by Skipping Turns...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [player1, player2, player3, player4] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    // === Skip different numbers of turns for each game ===
    
    // Game 1: Skip 8 turns (4 players × 2 rounds)
    console.log("⏭️ Advancing Game 1 (4-player) by 8 turns...");
    try {
      for (let turn = 0; turn < 8; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(1);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2, player3, player4];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const skipTx = await gameContract.skipTurn(1);
        await skipTx.wait();
        
        const updatedGameInfo = await game1.getGame(1);
        console.log(`  Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped`);
      }
    } catch (e) {
      console.log("❌ Error advancing Game 1:", e.message);
    }
    
    // Game 2: Skip 5 turns (2 players, mixed progression)
    console.log("\n⏭️ Advancing Game 2 (2-player) by 5 turns...");
    try {
      for (let turn = 0; turn < 5; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(2);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2]; // Only 2 players in this game
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const skipTx = await gameContract.skipTurn(2);
        await skipTx.wait();
        
        const updatedGameInfo = await game1.getGame(2);
        console.log(`  Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped`);
      }
    } catch (e) {
      console.log("❌ Error advancing Game 2:", e.message);
    }
    
    // Game 3: Skip 12 turns (2 players, advanced game)
    console.log("\n⏭️ Advancing Game 3 (2-player) by 12 turns...");
    try {
      for (let turn = 0; turn < 12; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(3);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const skipTx = await gameContract.skipTurn(3);
        await skipTx.wait();
        
        const updatedGameInfo = await game1.getGame(3);
        console.log(`  Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped`);
      }
    } catch (e) {
      console.log("❌ Error advancing Game 3:", e.message);
    }
    
    // Game 4: Skip 15 turns (3 players, very advanced)
    console.log("\n⏭️ Advancing Game 4 (3-player) by 15 turns...");
    try {
      for (let turn = 0; turn < 15; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(4);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2, player3];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const skipTx = await gameContract.skipTurn(4);
        await skipTx.wait();
        
        const updatedGameInfo = await game1.getGame(4);
        console.log(`  Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped`);
      }
    } catch (e) {
      console.log("❌ Error advancing Game 4:", e.message);
    }
    
    // === Final summary with varied game states ===
    console.log("\n📊 Final Game States with Progression:");
    console.log("==========================================");
    
    const game = FivesGame.attach(contractAddress).connect(player1);
    
    for (let gameId = 1; gameId <= 4; gameId++) {
      try {
        const gameInfo = await game.getGame(gameId);
        const stateNames = ['Setup', 'InProgress', 'Completed', 'Cancelled'];
        const stateName = stateNames[gameInfo.state] || 'Unknown';
        
        console.log(`\n🎯 Game ${gameId}:`);
        console.log(`   State: ${stateName}`);
        console.log(`   Turn: ${gameInfo.turnNumber}`);
        console.log(`   Players: ${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
        console.log(`   Tiles Remaining: ${gameInfo.tilesRemaining}`);
        
        // Show all player names
        console.log(`   Players:`);
        for (let i = 0; i < gameInfo.playerAddresses.length; i++) {
          const playerAddr = gameInfo.playerAddresses[i];
          const playerInfo = await game.getPlayer(gameId, playerAddr);
          const isCurrentTurn = gameInfo.state === 1 && i === gameInfo.currentPlayerIndex;
          const turnIndicator = isCurrentTurn ? ' 👈 CURRENT' : '';
          console.log(`     ${i+1}. "${playerInfo.name}" - ${playerInfo.hand.length} tiles${turnIndicator}`);
        }
        
      } catch (e) {
        console.log(`❌ Game ${gameId}: Error`);
      }
    }
    
    console.log("\n🎉 Games now have varied progression!");
    console.log("📱 Gallery URLs:");
    console.log("   Gallery: http://localhost:3001/gallery");
    console.log("   Game 1: http://localhost:3001/game/1 (Turn 9, 4 players)");
    console.log("   Game 2: http://localhost:3001/game/2 (Turn 6, 2 players)");
    console.log("   Game 3: http://localhost:3001/game/3 (Turn 13, 2 players)");
    console.log("   Game 4: http://localhost:3001/game/4 (Turn 16, 3 players)");
    
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