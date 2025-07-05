const hre = require("hardhat");

async function main() {
  console.log("🎮 FINAL GAMEPLAY - Creating Rich Game Progression with Correct Comparisons...\n");
  
  const contractAddress = "0x922D6956C99E12DFeB3224DEA977D0939758A1Fe";
  const [player1, player2, player3, player4] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    // Function to find valid placement position
    async function findValidPosition(gameContract, gameId) {
      // Try center first
      try {
        const centerTile = await gameContract.getTileAt(gameId, 7, 7);
        if (!centerTile.exists) {
          return { x: 7, y: 7 };
        }
      } catch (e) {
        return { x: 7, y: 7 };
      }
      
      // Try adjacent positions in a spiral pattern from center
      const positions = [
        { x: 6, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 6 }, { x: 7, y: 8 },
        { x: 6, y: 6 }, { x: 8, y: 6 }, { x: 6, y: 8 }, { x: 8, y: 8 },
        { x: 5, y: 7 }, { x: 9, y: 7 }, { x: 7, y: 5 }, { x: 7, y: 9 },
        { x: 5, y: 6 }, { x: 9, y: 6 }, { x: 5, y: 8 }, { x: 9, y: 8 },
        { x: 5, y: 5 }, { x: 9, y: 5 }, { x: 5, y: 9 }, { x: 9, y: 9 },
        { x: 4, y: 7 }, { x: 10, y: 7 }, { x: 7, y: 4 }, { x: 7, y: 10 }
      ];
      
      for (const pos of positions) {
        try {
          const tile = await gameContract.getTileAt(gameId, pos.x, pos.y);
          if (!tile.exists) {
            return pos;
          }
        } catch (e) {
          return pos;
        }
      }
      
      return { x: 7, y: 7 }; // Fallback
    }
    
    // Function to play extensive turns on a game
    async function playGameExtensively(gameId, playerCount, gameLabel, maxTurns = 100) {
      console.log(`\n🎮 ${gameLabel} - Playing up to ${maxTurns} turns...`);
      
      const players = [player1, player2, player3, player4].slice(0, playerCount);
      let placementsMade = 0;
      let turnsMade = 0;
      
      for (let turn = 0; turn < maxTurns; turn++) {
        const game = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game.getGame(gameId);
        
        // Use loose equality for BigInt comparison
        if (gameInfo.state != 1) {
          console.log(`  Game ${gameId} no longer in progress (state: ${gameInfo.state})`);
          break;
        }
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
        const playerInfo = await gameContract.getPlayer(gameId, currentPlayerAddr);
        
        const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
        turnsMade++;
        
        if (validTiles.length > 0) {
          // Player has valid tiles - place one
          const tile = validTiles[0];
          const position = await findValidPosition(gameContract, gameId);
          
          try {
            const placements = [{ number: tile, x: position.x, y: position.y }];
            const placeTx = await gameContract.playTurn(gameId, placements);
            await placeTx.wait();
            
            const updatedGameInfo = await game.getGame(gameId);
            const updatedPlayerInfo = await game.getPlayer(gameId, currentPlayerAddr);
            console.log(`  Turn ${updatedGameInfo.turnNumber}: ${playerInfo.name} placed ${tile} at (${position.x},${position.y}) → Score: ${updatedPlayerInfo.score}`);
            placementsMade++;
            
          } catch (error) {
            console.log(`  Turn ${gameInfo.turnNumber}: ${playerInfo.name} placement failed, skipping...`);
            const skipTx = await gameContract.skipTurn(gameId);
            await skipTx.wait();
          }
        } else {
          // No valid tiles - skip turn (this will cycle through and eventually get 0s/5s)
          console.log(`  Turn ${gameInfo.turnNumber}: ${playerInfo.name} skipping (no 0/5)`);
          const skipTx = await gameContract.skipTurn(gameId);
          await skipTx.wait();
        }
        
        // Stop if we've made good progress for demonstration
        if (placementsMade >= 8) {
          console.log(`  ✅ Made ${placementsMade} tile placements, excellent progress!`);
          break;
        }
      }
      
      console.log(`  ${gameLabel} completed: ${placementsMade} placements in ${turnsMade} turns`);
      return placementsMade;
    }
    
    // === Play each game extensively ===
    
    let totalPlacements = 0;
    
    // Game 1 (4 players) - Current player Alice has no valid tiles, so skip through
    totalPlacements += await playGameExtensively(1, 4, "Game 1 (4-player)", 120);
    
    // Game 2 (2 players) - Player Two has valid tiles
    totalPlacements += await playGameExtensively(2, 2, "Game 2 (2-player)", 80);
    
    // Game 3 (2 players) - Player Two has valid tiles but not current player
    totalPlacements += await playGameExtensively(3, 2, "Game 3 (2-player)", 80);
    
    // Game 4 (3 players) - Test Game 3 has a 0
    totalPlacements += await playGameExtensively(4, 3, "Game 4 (3-player)", 100);
    
    // === Final comprehensive summary ===
    console.log("\n" + "=".repeat(70));
    console.log("🏆 FINAL COMPREHENSIVE GAME SUMMARY - FIVES RULES GAMEPLAY");
    console.log("=".repeat(70));
    
    const game = FivesGame.attach(contractAddress).connect(player1);
    
    for (let gameId = 1; gameId <= 4; gameId++) {
      try {
        const gameInfo = await game.getGame(gameId);
        const stateNames = ['Setup', 'InProgress', 'Completed', 'Cancelled'];
        
        console.log(`\n🎯 GAME ${gameId}:`);
        console.log(`   State: ${stateNames[gameInfo.state]} | Turn: ${gameInfo.turnNumber}`);
        console.log(`   Players: ${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
        
        // Show player scores, hands, and valid tiles
        let maxScore = 0;
        let leader = '';
        for (let i = 0; i < gameInfo.playerAddresses.length; i++) {
          const playerAddr = gameInfo.playerAddresses[i];
          const playerInfo = await game.getPlayer(gameId, playerAddr);
          const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
          
          console.log(`   👤 ${playerInfo.name}:`);
          console.log(`      💰 Score: ${playerInfo.score} points`);
          console.log(`      🎴 Hand: [${playerInfo.hand.join(', ')}]`);
          console.log(`      ✅ Valid (0/5): ${validTiles.length} tiles → [${validTiles.join(', ')}]`);
          
          if (playerInfo.score > maxScore) {
            maxScore = playerInfo.score;
            leader = playerInfo.name;
          }
        }
        
        if (maxScore > 0) {
          console.log(`   🏆 LEADER: ${leader} with ${maxScore} points`);
        } else {
          console.log(`   🎯 No scoring yet - tiles placed but no scoring sequences`);
        }
        
        // Show detailed board state with visual representation
        console.log(`   📋 BOARD STATE:`);
        let tilesPlaced = 0;
        const boardMap = new Map();
        
        // Scan wider area around center
        for (let x = 3; x <= 11; x++) {
          for (let y = 3; y <= 11; y++) {
            try {
              const tile = await game.getTileAt(gameId, x, y);
              if (tile.exists) {
                boardMap.set(`${x},${y}`, tile.number);
                tilesPlaced++;
              }
            } catch (e) {
              // Ignore errors
            }
          }
        }
        
        if (tilesPlaced > 0) {
          console.log(`      Placed tiles:`);
          for (const [pos, value] of boardMap.entries()) {
            const [x, y] = pos.split(',');
            console.log(`        (${x},${y}): ${value}`);
          }
          
          // Show a visual representation of the board center
          console.log(`      Visual (center area):`);
          for (let y = 5; y <= 9; y++) {
            let row = "        ";
            for (let x = 5; x <= 9; x++) {
              const key = `${x},${y}`;
              if (boardMap.has(key)) {
                row += `${boardMap.get(key)} `;
              } else {
                row += ". ";
              }
            }
            console.log(row);
          }
        } else {
          console.log(`      No tiles placed yet`);
        }
        console.log(`      Total tiles: ${tilesPlaced}`);
        
      } catch (e) {
        console.log(`❌ Game ${gameId}: Error - ${e.message}`);
      }
    }
    
    console.log(`\n🎉 FINAL RESULTS:`);
    console.log(`📊 Total tile placements made: ${totalPlacements}`);
    console.log(`🎯 Fives rules followed: Only 0s and 5s placed`);
    console.log(`📍 Placement strategy: Center (7,7) first, then adjacent`);
    console.log(`🔄 Turn cycling: Players skip when no valid tiles`);
    console.log(`\n📱 Your Gallery should now display:`);
    console.log(`   ✅ Games with actual tile placements`);
    console.log(`   ✅ Real turn progression`);
    console.log(`   ✅ Player hands and scores`);
    console.log(`   ✅ Authentic Fives gameplay data`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 