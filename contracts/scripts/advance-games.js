const hre = require("hardhat");

async function main() {
  console.log("🚀 Advancing Games with More Players and Turns...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [player1, player2, player3, player4, player5, player6] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  console.log("👥 Available Players:");
  console.log("  Player 1:", player1.address.slice(0,10) + "...");
  console.log("  Player 2:", player2.address.slice(0,10) + "...");
  console.log("  Player 3:", player3.address.slice(0,10) + "...");
  console.log("  Player 4:", player4.address.slice(0,10) + "...");
  console.log("  Player 5:", player5.address.slice(0,10) + "...");
  console.log("  Player 6:", player6.address.slice(0,10) + "...");
  console.log();

  try {
    // === STEP 1: Fill up Game 1 (currently 1/4 players) ===
    console.log("🎯 Adding players to Game 1...");
    try {
      const game2 = FivesGame.attach(contractAddress).connect(player2);
      const game3 = FivesGame.attach(contractAddress).connect(player3);
      const game4 = FivesGame.attach(contractAddress).connect(player4);
      
      await game2.joinGame(1, "Bob");
      await game2.waitForDeployment ? await game2.waitForDeployment() : null;
      console.log("✅ Bob joined Game 1");
      
      await game3.joinGame(1, "Charlie");
      console.log("✅ Charlie joined Game 1");
      
      await game4.joinGame(1, "Diana");
      console.log("✅ Diana joined Game 1 (should auto-start)");
      
      const gameInfo = await game4.getGame(1);
      console.log(`  Game 1: State=${gameInfo.state}, Players=${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
    } catch (e) {
      console.log("❌ Error filling Game 1:", e.message);
    }

    // === STEP 2: Add more players to Game 2 (currently 2/4 players) ===
    console.log("\n🎯 Adding players to Game 2...");
    try {
      const game3 = FivesGame.attach(contractAddress).connect(player3);
      const game4 = FivesGame.attach(contractAddress).connect(player4);
      
      await game3.joinGame(2, "Charlie");
      console.log("✅ Charlie joined Game 2");
      
      await game4.joinGame(2, "Diana");
      console.log("✅ Diana joined Game 2 (should auto-start)");
      
      const gameInfo = await game4.getGame(2);
      console.log(`  Game 2: State=${gameInfo.state}, Players=${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
    } catch (e) {
      console.log("❌ Error filling Game 2:", e.message);
    }

    // === STEP 3: Make multiple turns in each game ===
    console.log("\n🎲 Making multiple turns to advance games...");
    
    // Advance Game 1 (4-player game)
    console.log("\n  🎯 Advancing Game 1 (4-player)...");
    try {
      for (let turn = 0; turn < 6; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(1);
        
        if (gameInfo.state !== 1) break; // Game ended
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
        const players = [player1, player2, player3, player4];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        // Get player's hand
        const playerInfo = await gameContract.getPlayer(1, currentPlayerAddr);
        
        if (playerInfo.hand.length > 0) {
          // Place first tile in hand at a random-ish position
          const tile = playerInfo.hand[0];
          const x = turn % 3; // Simple progression: 0,1,2,0,1,2...
          const y = Math.floor(turn / 3);
          
          try {
            const placements = [{ number: tile, x: x, y: y }];
            const placeTx = await gameContract.playTurn(1, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(1);
            const updatedPlayerInfo = await game1.getPlayer(1, currentPlayerAddr);
            console.log(`    Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placed tile ${tile} at (${x},${y}), Score: ${updatedPlayerInfo.score}`);
          } catch (placementError) {
            // If placement fails, skip turn
            const skipTx = await gameContract.skipTurn(1);
            await skipTx.wait();
            console.log(`    Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn`);
          }
        } else {
          // No tiles, skip turn
          const skipTx = await gameContract.skipTurn(1);
          await skipTx.wait();
          console.log(`    Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn (no tiles)`);
        }
      }
    } catch (e) {
      console.log("    ❌ Error advancing Game 1:", e.message);
    }

    // Advance Game 2 (4-player game)
    console.log("\n  🎯 Advancing Game 2 (4-player)...");
    try {
      for (let turn = 0; turn < 8; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(2);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
        const players = [player1, player2, player3, player4];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const playerInfo = await gameContract.getPlayer(2, currentPlayerAddr);
        
        if (playerInfo.hand.length > 0) {
          const tile = playerInfo.hand[0];
          const x = (turn + 1) % 4; // Different pattern
          const y = Math.floor((turn + 1) / 4);
          
          try {
            const placements = [{ number: tile, x: x, y: y }];
            const placeTx = await gameContract.playTurn(2, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(2);
            const updatedPlayerInfo = await game1.getPlayer(2, currentPlayerAddr);
            console.log(`    Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placed tile ${tile} at (${x},${y}), Score: ${updatedPlayerInfo.score}`);
          } catch (placementError) {
            const skipTx = await gameContract.skipTurn(2);
            await skipTx.wait();
            console.log(`    Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn`);
          }
        } else {
          const skipTx = await gameContract.skipTurn(2);
          await skipTx.wait();
          console.log(`    Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn (no tiles)`);
        }
      }
    } catch (e) {
      console.log("    ❌ Error advancing Game 2:", e.message);
    }

    // Advance Game 3 (2-player game) - make it more advanced
    console.log("\n  🎯 Advancing Game 3 (2-player)...");
    try {
      for (let turn = 0; turn < 12; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(3);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
        const players = [player1, player2];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const playerInfo = await gameContract.getPlayer(3, currentPlayerAddr);
        
        if (playerInfo.hand.length > 0) {
          const tile = playerInfo.hand[0];
          const x = turn % 5; // Wider spread
          const y = Math.floor(turn / 5);
          
          try {
            const placements = [{ number: tile, x: x, y: y }];
            const placeTx = await gameContract.playTurn(3, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(3);
            const updatedPlayerInfo = await game1.getPlayer(3, currentPlayerAddr);
            console.log(`    Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placed tile ${tile} at (${x},${y}), Score: ${updatedPlayerInfo.score}`);
          } catch (placementError) {
            const skipTx = await gameContract.skipTurn(3);
            await skipTx.wait();
            console.log(`    Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn`);
          }
        } else {
          const skipTx = await gameContract.skipTurn(3);
          await skipTx.wait();
          console.log(`    Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn (no tiles)`);
        }
      }
    } catch (e) {
      console.log("    ❌ Error advancing Game 3:", e.message);
    }

    // Advance Game 4 (3-player game) - moderate advancement
    console.log("\n  🎯 Advancing Game 4 (3-player)...");
    try {
      for (let turn = 0; turn < 9; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(4);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
        const players = [player1, player2, player3];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const playerInfo = await gameContract.getPlayer(4, currentPlayerAddr);
        
        if (playerInfo.hand.length > 0) {
          const tile = playerInfo.hand[0];
          const x = (turn * 2) % 6; // Different pattern
          const y = Math.floor((turn * 2) / 6);
          
          try {
            const placements = [{ number: tile, x: x, y: y }];
            const placeTx = await gameContract.playTurn(4, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(4);
            const updatedPlayerInfo = await game1.getPlayer(4, currentPlayerAddr);
            console.log(`    Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placed tile ${tile} at (${x},${y}), Score: ${updatedPlayerInfo.score}`);
          } catch (placementError) {
            const skipTx = await gameContract.skipTurn(4);
            await skipTx.wait();
            console.log(`    Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn`);
          }
        } else {
          const skipTx = await gameContract.skipTurn(4);
          await skipTx.wait();
          console.log(`    Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn (no tiles)`);
        }
      }
    } catch (e) {
      console.log("    ❌ Error advancing Game 4:", e.message);
    }

    // === STEP 4: Final summary ===
    console.log("\n📊 Final Advanced Game States:");
    console.log("=====================================");
    
    const game = FivesGame.attach(contractAddress).connect(player1);
    
    for (let gameId = 1; gameId <= 4; gameId++) {
      try {
        const gameInfo = await game.getGame(gameId);
        const stateNames = ['Setup', 'InProgress', 'Completed', 'Cancelled'];
        const stateName = stateNames[gameInfo.state] || 'Unknown';
        
        console.log(`\n🎯 Game ${gameId}:`);
        console.log(`   State: ${stateName} | Turn: ${gameInfo.turnNumber} | Players: ${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
        
        // Show top scores
        let topScore = 0;
        let topPlayer = '';
        for (let i = 0; i < gameInfo.playerAddresses.length; i++) {
          const playerAddr = gameInfo.playerAddresses[i];
          const playerInfo = await game.getPlayer(gameId, playerAddr);
          if (playerInfo.score > topScore) {
            topScore = playerInfo.score;
            topPlayer = playerInfo.name;
          }
        }
        console.log(`   Leading: ${topPlayer} with ${topScore} points`);
        
      } catch (e) {
        console.log(`❌ Game ${gameId}: Error`);
      }
    }
    
    console.log("\n🎉 Advanced gameplay testing complete!");
    console.log("📱 Gallery should now show games with realistic progression!");
    
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