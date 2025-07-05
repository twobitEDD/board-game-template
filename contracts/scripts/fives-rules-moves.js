const hre = require("hardhat");

async function main() {
  console.log("🎯 Following Actual Fives Rules: Skip until 0/5, place at (7,7) or adjacent...\n");
  
  const contractAddress = "0x922D6956C99E12DFeB3224DEA977D0939758A1Fe";
  const [player1, player2, player3, player4] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    // === Function to find valid placement positions ===
    async function findValidPosition(gameContract, gameId) {
      // Check if center (7,7) is available
      try {
        const centerTile = await gameContract.getTileAt(gameId, 7, 7);
        if (!centerTile.exists) {
          return { x: 7, y: 7 }; // Center is available
        }
      } catch (e) {
        // If getTileAt fails, assume center is available
        return { x: 7, y: 7 };
      }
      
      // If center is taken, find positions adjacent to existing tiles
      const adjacentPositions = [
        { x: 6, y: 7 }, { x: 8, y: 7 }, // Left and right of center
        { x: 7, y: 6 }, { x: 7, y: 8 }, // Above and below center
        { x: 6, y: 6 }, { x: 8, y: 6 }, { x: 6, y: 8 }, { x: 8, y: 8 }, // Diagonals
        { x: 5, y: 7 }, { x: 9, y: 7 }, { x: 7, y: 5 }, { x: 7, y: 9 }, // Further out
      ];
      
      for (const pos of adjacentPositions) {
        try {
          const tile = await gameContract.getTileAt(gameId, pos.x, pos.y);
          if (!tile.exists) {
            return pos; // Found an empty adjacent position
          }
        } catch (e) {
          return pos; // If getTileAt fails, assume position is valid
        }
      }
      
      return { x: 7, y: 7 }; // Fallback to center
    }
    
    // === Play games following Fives rules ===
    
    // Game 1: 4-player game
    console.log("🎯 Game 1 - Following Fives rules (4 players)...");
    try {
      for (let turn = 0; turn < 20; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(1);
        
        if (gameInfo.state !== 1) break; // Game not in progress
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2, player3, player4];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
        const playerInfo = await gameContract.getPlayer(1, currentPlayerAddr);
        
        // Check if player has 0 or 5 in hand (use loose equality for BigInt)
        const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
        
        if (validTiles.length > 0) {
          // Player has a 0 or 5, place it
          const tile = validTiles[0];
          const position = await findValidPosition(gameContract, 1);
          
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placing tile ${tile} at (${position.x},${position.y})`);
          
          try {
            const placements = [{ number: tile, x: position.x, y: position.y }];
            const placeTx = await gameContract.playTurn(1, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(1);
            const updatedPlayerInfo = await game1.getPlayer(1, currentPlayerAddr);
            console.log(`    ✅ SUCCESS! Score: ${updatedPlayerInfo.score}, Hand: [${updatedPlayerInfo.hand.join(', ')}]`);
          } catch (placementError) {
            console.log(`    ❌ Placement failed: ${placementError.message}`);
            // Skip turn instead
            const skipTx = await gameContract.skipTurn(1);
            await skipTx.wait();
            console.log(`    ⏭️ Skipped turn`);
          }
        } else {
          // No valid tiles (0 or 5), skip turn
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipping (no 0 or 5) - Hand: [${playerInfo.hand.join(', ')}]`);
          
          const skipTx = await gameContract.skipTurn(1);
          await skipTx.wait();
          console.log(`    ⏭️ Skipped turn`);
        }
      }
    } catch (e) {
      console.log("❌ Error with Game 1:", e.message);
    }
    
    // Game 2: 2-player game
    console.log("\n🎯 Game 2 - Following Fives rules (2 players)...");
    try {
      for (let turn = 0; turn < 15; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(2);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
        const playerInfo = await gameContract.getPlayer(2, currentPlayerAddr);
        
        const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
        
        if (validTiles.length > 0) {
          const tile = validTiles[0];
          const position = await findValidPosition(gameContract, 2);
          
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placing tile ${tile} at (${position.x},${position.y})`);
          
          try {
            const placements = [{ number: tile, x: position.x, y: position.y }];
            const placeTx = await gameContract.playTurn(2, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(2);
            const updatedPlayerInfo = await game1.getPlayer(2, currentPlayerAddr);
            console.log(`    ✅ SUCCESS! Score: ${updatedPlayerInfo.score}, Hand: [${updatedPlayerInfo.hand.join(', ')}]`);
          } catch (placementError) {
            console.log(`    ❌ Placement failed: ${placementError.message}`);
            const skipTx = await gameContract.skipTurn(2);
            await skipTx.wait();
            console.log(`    ⏭️ Skipped turn`);
          }
        } else {
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipping (no 0 or 5) - Hand: [${playerInfo.hand.join(', ')}]`);
          
          const skipTx = await gameContract.skipTurn(2);
          await skipTx.wait();
          console.log(`    ⏭️ Skipped turn`);
        }
      }
    } catch (e) {
      console.log("❌ Error with Game 2:", e.message);
    }
    
    // Game 3: 2-player game
    console.log("\n🎯 Game 3 - Following Fives rules (2 players)...");
    try {
      for (let turn = 0; turn < 15; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(3);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
        const playerInfo = await gameContract.getPlayer(3, currentPlayerAddr);
        
        const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
        
        if (validTiles.length > 0) {
          const tile = validTiles[0];
          const position = await findValidPosition(gameContract, 3);
          
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placing tile ${tile} at (${position.x},${position.y})`);
          
          try {
            const placements = [{ number: tile, x: position.x, y: position.y }];
            const placeTx = await gameContract.playTurn(3, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(3);
            const updatedPlayerInfo = await game1.getPlayer(3, currentPlayerAddr);
            console.log(`    ✅ SUCCESS! Score: ${updatedPlayerInfo.score}, Hand: [${updatedPlayerInfo.hand.join(', ')}]`);
          } catch (placementError) {
            console.log(`    ❌ Placement failed: ${placementError.message}`);
            const skipTx = await gameContract.skipTurn(3);
            await skipTx.wait();
            console.log(`    ⏭️ Skipped turn`);
          }
        } else {
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipping (no 0 or 5) - Hand: [${playerInfo.hand.join(', ')}]`);
          
          const skipTx = await gameContract.skipTurn(3);
          await skipTx.wait();
          console.log(`    ⏭️ Skipped turn`);
        }
      }
    } catch (e) {
      console.log("❌ Error with Game 3:", e.message);
    }
    
    // Game 4: 3-player game
    console.log("\n🎯 Game 4 - Following Fives rules (3 players)...");
    try {
      for (let turn = 0; turn < 15; turn++) {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(4);
        
        if (gameInfo.state !== 1) break;
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const players = [player1, player2, player3];
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
        const playerInfo = await gameContract.getPlayer(4, currentPlayerAddr);
        
        const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
        
        if (validTiles.length > 0) {
          const tile = validTiles[0];
          const position = await findValidPosition(gameContract, 4);
          
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placing tile ${tile} at (${position.x},${position.y})`);
          
          try {
            const placements = [{ number: tile, x: position.x, y: position.y }];
            const placeTx = await gameContract.playTurn(4, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game1.getGame(4);
            const updatedPlayerInfo = await game1.getPlayer(4, currentPlayerAddr);
            console.log(`    ✅ SUCCESS! Score: ${updatedPlayerInfo.score}, Hand: [${updatedPlayerInfo.hand.join(', ')}]`);
          } catch (placementError) {
            console.log(`    ❌ Placement failed: ${placementError.message}`);
            const skipTx = await gameContract.skipTurn(4);
            await skipTx.wait();
            console.log(`    ⏭️ Skipped turn`);
          }
        } else {
          console.log(`  Turn ${gameInfo.turnNumber}: Player ${currentPlayerIndex + 1} skipping (no 0 or 5) - Hand: [${playerInfo.hand.join(', ')}]`);
          
          const skipTx = await gameContract.skipTurn(4);
          await skipTx.wait();
          console.log(`    ⏭️ Skipped turn`);
        }
      }
    } catch (e) {
      console.log("❌ Error with Game 4:", e.message);
    }
    
    // === Final summary ===
    console.log("\n📊 Games Summary After Following Fives Rules:");
    console.log("===============================================");
    
    const game = FivesGame.attach(contractAddress).connect(player1);
    
    for (let gameId = 1; gameId <= 4; gameId++) {
      try {
        const gameInfo = await game.getGame(gameId);
        const stateNames = ['Setup', 'InProgress', 'Completed', 'Cancelled'];
        
        console.log(`\n🎯 Game ${gameId}:`);
        console.log(`   State: ${stateNames[gameInfo.state]} | Turn: ${gameInfo.turnNumber}`);
        console.log(`   Players: ${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
        
        // Show player scores and hands
        let maxScore = 0;
        let leader = '';
        for (let i = 0; i < gameInfo.playerAddresses.length; i++) {
          const playerAddr = gameInfo.playerAddresses[i];
          const playerInfo = await game.getPlayer(gameId, playerAddr);
          const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
          console.log(`     ${playerInfo.name}: ${playerInfo.score} points, Hand: [${playerInfo.hand.join(', ')}] (${validTiles.length} valid)`);
          if (playerInfo.score > maxScore) {
            maxScore = playerInfo.score;
            leader = playerInfo.name;
          }
        }
        
        if (maxScore > 0) {
          console.log(`   🏆 Leading: ${leader} with ${maxScore} points`);
        }
        
        // Show a few placed tiles for verification
        console.log(`   Board tiles placed:`);
        for (let x = 6; x <= 8; x++) {
          for (let y = 6; y <= 8; y++) {
            try {
              const tile = await game.getTileAt(gameId, x, y);
              if (tile.exists) {
                console.log(`     (${x},${y}): ${tile.number}`);
              }
            } catch (e) {
              // Ignore tile check errors
            }
          }
        }
        
      } catch (e) {
        console.log(`❌ Game ${gameId}: Error checking game state`);
      }
    }
    
    console.log("\n🎉 Fives rules gameplay complete!");
    console.log("📱 Gallery should now show games with real tile placements and scores!");
    console.log("🎯 Rules followed: Skip until 0/5, place at (7,7) or adjacent to existing tiles");
    
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