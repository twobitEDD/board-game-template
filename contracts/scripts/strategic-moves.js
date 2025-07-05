const hre = require("hardhat");

async function main() {
  console.log("🎯 Making Strategic Moves Following Fives Rules...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [player1, player2, player3, player4] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    // === Strategic move sequences that create multiples of 5 ===
    
    // Game 1: Create a sequence summing to 5 (4 players)
    console.log("🎯 Game 1 - Creating sequences summing to multiples of 5...");
    try {
      for (let turn = 0; turn < 12; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(1);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2, player3, player4];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const playerInfo = await gameContract.getPlayer(1, currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex]);
        
        if (playerInfo.hand.length > 0) {
          // Strategic placements to create sequences summing to multiples of 5
          let tile, x, y;
          
          if (turn === 0) {
            // First move: place any tile at center
            tile = playerInfo.hand[0];
            x = 0; y = 0;
          } else if (turn === 1) {
            // Second move: find a tile that with first tile sums to 5
            const firstTileAtCenter = await gameContract.getTileAt(1, 0, 0);
            if (firstTileAtCenter.exists) {
              const needed = 5 - firstTileAtCenter.number;
              tile = playerInfo.hand.find(t => t === needed) || playerInfo.hand[0];
              x = 1; y = 0; // Place adjacent horizontally
            } else {
              tile = playerInfo.hand[0];
              x = 0; y = 0;
            }
          } else if (turn === 2) {
            // Third move: extend sequence or start new one
            tile = playerInfo.hand.find(t => t === 5) || playerInfo.hand[0]; // Try to place a 5
            x = 0; y = 1; // Place adjacent vertically
          } else if (turn === 3) {
            // Fourth move: complete vertical sequence to sum to 10
            const tileAbove = await gameContract.getTileAt(1, 0, 1);
            if (tileAbove.exists) {
              const needed = 10 - (5 + tileAbove.number); // Assuming we want sum of 10
              tile = playerInfo.hand.find(t => t === needed) || playerInfo.hand[0];
              x = 0; y = 2;
            } else {
              tile = playerInfo.hand[0];
              x = 2; y = 0;
            }
          } else {
            // Later moves: spread around center with strategic values
            tile = playerInfo.hand.find(t => [0, 5].includes(t)) || playerInfo.hand[0]; // Prefer 0s and 5s
            x = (turn % 3) - 1; // -1, 0, 1, -1, 0, 1...
            y = Math.floor(turn / 3) - 1;
          }
          
          try {
            const placements = [{ number: tile, x: x, y: y }];
            const placeTx = await gameContract.playTurn(1, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(1);
            const updatedPlayerInfo = await game1.getPlayer(1, currentPlayerAddr);
            console.log(`  Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placed tile ${tile} at (${x},${y}), Score: ${updatedPlayerInfo.score}`);
          } catch (placementError) {
            // If strategic placement fails, skip turn
            const skipTx = await gameContract.skipTurn(1);
            await skipTx.wait();
            console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn (placement failed)`);
          }
        } else {
          const skipTx = await gameContract.skipTurn(1);
          await skipTx.wait();
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn (no tiles)`);
        }
      }
    } catch (e) {
      console.log("❌ Error with Game 1:", e.message);
    }
    
    // Game 2: Focus on creating sequences of 10 and 15
    console.log("\n🎯 Game 2 - Building sequences for higher multiples...");
    try {
      for (let turn = 0; turn < 8; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(2);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2]; // Only 2 players
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const playerInfo = await gameContract.getPlayer(2, gameInfo.playerAddresses[currentPlayerIndex]);
        
        if (playerInfo.hand.length > 0) {
          let tile, x, y;
          
          // Strategic placements for Game 2
          if (turn === 0) {
            tile = playerInfo.hand.find(t => t === 2) || playerInfo.hand[0];
            x = 0; y = 0; // Start at center
          } else if (turn === 1) {
            tile = playerInfo.hand.find(t => t === 3) || playerInfo.hand[0]; // 2+3=5
            x = 1; y = 0;
          } else if (turn === 2) {
            tile = playerInfo.hand.find(t => t === 5) || playerInfo.hand[0]; // Start new sequence
            x = 0; y = 1;
          } else if (turn === 3) {
            tile = playerInfo.hand.find(t => t === 5) || playerInfo.hand[0]; // 5+5=10
            x = 1; y = 1;
          } else {
            // Fill in strategic positions
            tile = playerInfo.hand.find(t => [1, 4, 6, 9].includes(t)) || playerInfo.hand[0];
            x = (turn - 4) % 3;
            y = Math.floor((turn - 4) / 3) + 2;
          }
          
          try {
            const placements = [{ number: tile, x: x, y: y }];
            const placeTx = await gameContract.playTurn(2, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(2);
            const updatedPlayerInfo = await game1.getPlayer(2, gameInfo.playerAddresses[currentPlayerIndex]);
            console.log(`  Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placed tile ${tile} at (${x},${y}), Score: ${updatedPlayerInfo.score}`);
          } catch (placementError) {
            const skipTx = await gameContract.skipTurn(2);
            await skipTx.wait();
            console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn`);
          }
        } else {
          const skipTx = await gameContract.skipTurn(2);
          await skipTx.wait();
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn (no tiles)`);
        }
      }
    } catch (e) {
      console.log("❌ Error with Game 2:", e.message);
    }
    
    // Game 3: Create complex sequences (2-player advanced)
    console.log("\n🎯 Game 3 - Advanced strategic sequences...");
    try {
      for (let turn = 0; turn < 16; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(3);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const playerInfo = await gameContract.getPlayer(3, gameInfo.playerAddresses[currentPlayerIndex]);
        
        if (playerInfo.hand.length > 0) {
          let tile, x, y;
          
          // Create a grid pattern focusing on multiples of 5
          if (turn < 4) {
            // First 4 moves: create a 2x2 square at center
            tile = playerInfo.hand.find(t => [1, 2, 3, 4].includes(t)) || playerInfo.hand[0];
            x = turn % 2;
            y = Math.floor(turn / 2);
          } else if (turn < 8) {
            // Next 4 moves: extend outward
            tile = playerInfo.hand.find(t => [0, 5, 6].includes(t)) || playerInfo.hand[0];
            x = (turn - 4) % 2 - 1; // -1, 0, -1, 0
            y = Math.floor((turn - 4) / 2); // 0, 0, 1, 1
          } else {
            // Later moves: fill strategic positions
            tile = playerInfo.hand.find(t => [7, 8, 9].includes(t)) || playerInfo.hand[0];
            x = ((turn - 8) % 3) - 1; // -1, 0, 1, -1, 0, 1
            y = Math.floor((turn - 8) / 3) + 2;
          }
          
          try {
            const placements = [{ number: tile, x: x, y: y }];
            const placeTx = await gameContract.playTurn(3, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(3);
            const updatedPlayerInfo = await game1.getPlayer(3, gameInfo.playerAddresses[currentPlayerIndex]);
            console.log(`  Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placed tile ${tile} at (${x},${y}), Score: ${updatedPlayerInfo.score}`);
          } catch (placementError) {
            const skipTx = await gameContract.skipTurn(3);
            await skipTx.wait();
            console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn`);
          }
        } else {
          const skipTx = await gameContract.skipTurn(3);
          await skipTx.wait();
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn (no tiles)`);
        }
      }
    } catch (e) {
      console.log("❌ Error with Game 3:", e.message);
    }
    
    // Game 4: Strategic 3-player competition
    console.log("\n🎯 Game 4 - 3-player strategic competition...");
    try {
      for (let turn = 0; turn < 12; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(4);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2, player3];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const playerInfo = await gameContract.getPlayer(4, gameInfo.playerAddresses[currentPlayerIndex]);
        
        if (playerInfo.hand.length > 0) {
          let tile, x, y;
          
          // Each player gets their own section
          const playerSection = currentPlayerIndex;
          
          if (turn < 6) {
            // Early game: establish positions
            tile = playerInfo.hand.find(t => [2, 3, 5].includes(t)) || playerInfo.hand[0];
            x = (playerSection - 1) * 2; // Player sections: -2, 0, 2
            y = Math.floor(turn / 3);
          } else {
            // Mid game: build sequences
            tile = playerInfo.hand.find(t => [1, 4, 6, 9].includes(t)) || playerInfo.hand[0];
            x = (playerSection - 1) * 2 + ((turn - 6) % 2);
            y = Math.floor((turn - 6) / 2) + 2;
          }
          
          try {
            const placements = [{ number: tile, x: x, y: y }];
            const placeTx = await gameContract.playTurn(4, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(4);
            const updatedPlayerInfo = await game1.getPlayer(4, gameInfo.playerAddresses[currentPlayerIndex]);
            console.log(`  Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placed tile ${tile} at (${x},${y}), Score: ${updatedPlayerInfo.score}`);
          } catch (placementError) {
            const skipTx = await gameContract.skipTurn(4);
            await skipTx.wait();
            console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn`);
          }
        } else {
          const skipTx = await gameContract.skipTurn(4);
          await skipTx.wait();
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipped turn (no tiles)`);
        }
      }
    } catch (e) {
      console.log("❌ Error with Game 4:", e.message);
    }
    
    // === Final summary ===
    console.log("\n📊 Strategic Games Summary:");
    console.log("=======================================");
    
    const game = FivesGame.attach(contractAddress).connect(player1);
    
    for (let gameId = 1; gameId <= 4; gameId++) {
      try {
        const gameInfo = await game.getGame(gameId);
        const stateNames = ['Setup', 'InProgress', 'Completed', 'Cancelled'];
        
        console.log(`\n🎯 Game ${gameId}:`);
        console.log(`   State: ${stateNames[gameInfo.state]} | Turn: ${gameInfo.turnNumber}`);
        console.log(`   Players: ${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
        
        // Show player scores
        let maxScore = 0;
        let leader = '';
        for (let i = 0; i < gameInfo.playerAddresses.length; i++) {
          const playerAddr = gameInfo.playerAddresses[i];
          const playerInfo = await game.getPlayer(gameId, playerAddr);
          console.log(`     ${playerInfo.name}: ${playerInfo.score} points`);
          if (playerInfo.score > maxScore) {
            maxScore = playerInfo.score;
            leader = playerInfo.name;
          }
        }
        
        if (maxScore > 0) {
          console.log(`   🏆 Leading: ${leader} with ${maxScore} points`);
        }
        
      } catch (e) {
        console.log(`❌ Game ${gameId}: Error`);
      }
    }
    
    console.log("\n🎉 Strategic gameplay complete!");
    console.log("📱 Gallery now shows games with real scores and progression!");
    
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