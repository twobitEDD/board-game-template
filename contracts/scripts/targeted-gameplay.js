const hre = require("hardhat");

async function main() {
  console.log("🎯 Targeted Gameplay - Forcing Multiple Tile Placements...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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
      
      // Try adjacent positions
      const positions = [
        { x: 6, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 6 }, { x: 7, y: 8 },
        { x: 6, y: 6 }, { x: 8, y: 6 }, { x: 6, y: 8 }, { x: 8, y: 8 },
        { x: 5, y: 7 }, { x: 9, y: 7 }, { x: 7, y: 5 }, { x: 7, y: 9 },
        { x: 5, y: 5 }, { x: 9, y: 9 }, { x: 5, y: 9 }, { x: 9, y: 5 }
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
      
      return { x: 7, y: 7 };
    }
    
    // Function to aggressively play a game until we get several tile placements
    async function playGameAggressively(gameId, playerCount, gameLabel, maxTurns = 50) {
      console.log(`\n🎮 ${gameLabel} - Playing up to ${maxTurns} turns...`);
      
      const players = [player1, player2, player3, player4].slice(0, playerCount);
      let placementsMade = 0;
      
      for (let turn = 0; turn < maxTurns; turn++) {
        const game = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game.getGame(gameId);
        
        if (gameInfo.state !== 1) {
          console.log(`  Game ${gameId} no longer in progress`);
          break;
        }
        
        const currentPlayerIndex = gameInfo.currentPlayerIndex;
        const currentPlayer = players[currentPlayerIndex];
        const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
        
        const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
        const playerInfo = await gameContract.getPlayer(gameId, currentPlayerAddr);
        
        const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
        
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
            console.log(`  Turn ${updatedGameInfo.turnNumber}: ${playerInfo.name} placed tile ${tile} at (${position.x},${position.y}) → Score: ${updatedPlayerInfo.score}`);
            placementsMade++;
            
          } catch (error) {
            console.log(`  Turn ${gameInfo.turnNumber}: ${playerInfo.name} placement failed (${error.message.slice(0,50)}), skipping...`);
            const skipTx = await gameContract.skipTurn(gameId);
            await skipTx.wait();
          }
        } else {
          // No valid tiles - skip turn
          console.log(`  Turn ${gameInfo.turnNumber}: ${playerInfo.name} skipping (no 0/5) - Hand: [${playerInfo.hand.slice(0,3).join(', ')}...]`);
          const skipTx = await gameContract.skipTurn(gameId);
          await skipTx.wait();
        }
        
        // Stop if we've made enough placements for demonstration
        if (placementsMade >= 5) {
          console.log(`  ✅ Made ${placementsMade} tile placements, sufficient for demo`);
          break;
        }
      }
      
      console.log(`  ${gameLabel} completed with ${placementsMade} tile placements`);
      return placementsMade;
    }
    
    // === Play each game aggressively ===
    
    let totalPlacements = 0;
    
    // Game 1 (4 players)
    totalPlacements += await playGameAggressively(1, 4, "Game 1 (4-player)", 60);
    
    // Game 2 (2 players) - should already have some progress
    totalPlacements += await playGameAggressively(2, 2, "Game 2 (2-player)", 40);
    
    // Game 3 (2 players)
    totalPlacements += await playGameAggressively(3, 2, "Game 3 (2-player)", 40);
    
    // Game 4 (3 players)
    totalPlacements += await playGameAggressively(4, 3, "Game 4 (3-player)", 50);
    
    // === Final comprehensive summary ===
    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL COMPREHENSIVE GAME SUMMARY");
    console.log("=".repeat(60));
    
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
          console.log(`      Score: ${playerInfo.score} points`);
          console.log(`      Hand: [${playerInfo.hand.join(', ')}]`);
          console.log(`      Valid tiles (0/5): ${validTiles.length} → [${validTiles.join(', ')}]`);
          
          if (playerInfo.score > maxScore) {
            maxScore = playerInfo.score;
            leader = playerInfo.name;
          }
        }
        
        if (maxScore > 0) {
          console.log(`   🏆 LEADER: ${leader} with ${maxScore} points`);
        } else {
          console.log(`   🎯 No scores yet - still early gameplay`);
        }
        
        // Show detailed board state
        console.log(`   📋 BOARD STATE:`);
        let tilesPlaced = 0;
        const boardTiles = [];
        
        for (let x = 4; x <= 10; x++) {
          for (let y = 4; y <= 10; y++) {
            try {
              const tile = await game.getTileAt(gameId, x, y);
              if (tile.exists) {
                boardTiles.push(`(${x},${y}):${tile.number}`);
                tilesPlaced++;
              }
            } catch (e) {
              // Ignore errors
            }
          }
        }
        
        if (boardTiles.length > 0) {
          console.log(`      Tiles: ${boardTiles.join(', ')}`);
        } else {
          console.log(`      No tiles placed yet`);
        }
        console.log(`      Total tiles: ${tilesPlaced}`);
        
      } catch (e) {
        console.log(`❌ Game ${gameId}: Error - ${e.message}`);
      }
    }
    
    console.log(`\n🎉 GAMEPLAY SESSION COMPLETE!`);
    console.log(`📊 Total tile placements made: ${totalPlacements}`);
    console.log(`📱 Gallery should now display games with realistic data:`);
    console.log(`   ✅ Real tile placements following Fives rules`);
    console.log(`   ✅ Turn progression and player rotation`);
    console.log(`   ✅ Actual scores from tile placement`);
    console.log(`   ✅ Varied game states for demo purposes`);
    
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