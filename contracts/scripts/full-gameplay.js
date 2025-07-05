const hre = require("hardhat");

async function main() {
  console.log("🎮 Full Gameplay Session - Creating Real Game Progression...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [player1, player2, player3, player4] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    // Function to find valid placement position
    async function findValidPosition(gameContract, gameId, preferCenter = true) {
      if (preferCenter) {
        try {
          const centerTile = await gameContract.getTileAt(gameId, 7, 7);
          if (!centerTile.exists) {
            return { x: 7, y: 7 };
          }
        } catch (e) {
          return { x: 7, y: 7 };
        }
      }
      
      // Find adjacent positions to existing tiles
      const adjacentPositions = [
        { x: 6, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 6 }, { x: 7, y: 8 },
        { x: 6, y: 6 }, { x: 8, y: 6 }, { x: 6, y: 8 }, { x: 8, y: 8 },
        { x: 5, y: 7 }, { x: 9, y: 7 }, { x: 7, y: 5 }, { x: 7, y: 9 },
        { x: 5, y: 6 }, { x: 9, y: 8 }, { x: 6, y: 5 }, { x: 8, y: 9 }
      ];
      
      for (const pos of adjacentPositions) {
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
    
    // Function to play one turn for a game
    async function playOneTurn(gameId, maxPlayers, gameLabel) {
      const game = FivesGame.attach(contractAddress).connect(player1);
      const gameInfo = await game.getGame(gameId);
      
      if (gameInfo.state !== 1) return false; // Game not in progress
      
      const currentPlayerIndex = gameInfo.currentPlayerIndex;
      const players = [player1, player2, player3, player4].slice(0, maxPlayers);
      const currentPlayer = players[currentPlayerIndex];
      const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
      
      const currentPlayerAddr = gameInfo.playerAddresses[currentPlayerIndex];
      const playerInfo = await gameContract.getPlayer(gameId, currentPlayerAddr);
      
      const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
      
      if (validTiles.length > 0) {
        const tile = validTiles[0];
        const position = await findValidPosition(gameContract, gameId);
        
        try {
          const placements = [{ number: tile, x: position.x, y: position.y }];
          const placeTx = await gameContract.playTurn(gameId, placements);
          await placeTx.wait();
          
          const updatedGameInfo = await game.getGame(gameId);
          const updatedPlayerInfo = await game.getPlayer(gameId, currentPlayerAddr);
          console.log(`  ${gameLabel} Turn ${updatedGameInfo.turnNumber}: Player ${currentPlayerIndex + 1} placed ${tile} at (${position.x},${position.y}) → Score: ${updatedPlayerInfo.score}`);
          return true;
        } catch (error) {
          console.log(`  ${gameLabel}: Player ${currentPlayerIndex + 1} placement failed, skipping...`);
          const skipTx = await gameContract.skipTurn(gameId);
          await skipTx.wait();
          return true;
        }
      } else {
        console.log(`  ${gameLabel}: Player ${currentPlayerIndex + 1} skipping (no 0/5) - Hand: [${playerInfo.hand.join(', ')}]`);
        const skipTx = await gameContract.skipTurn(gameId);
        await skipTx.wait();
        return true;
      }
    }
    
    // === Play multiple rounds across all games ===
    console.log("🎯 Playing 30 rounds across all games...\n");
    
    for (let round = 1; round <= 30; round++) {
      console.log(`Round ${round}:`);
      
      // Game 1 (4 players)
      await playOneTurn(1, 4, "Game1");
      
      // Game 2 (2 players)  
      await playOneTurn(2, 2, "Game2");
      
      // Game 3 (2 players)
      await playOneTurn(3, 2, "Game3");
      
      // Game 4 (3 players)
      await playOneTurn(4, 3, "Game4");
      
      console.log(""); // Empty line between rounds
    }
    
    // === Final comprehensive summary ===
    console.log("📊 FINAL GAME STATES:");
    console.log("=".repeat(50));
    
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
          console.log(`     ${playerInfo.name}: ${playerInfo.score} points | Hand: [${playerInfo.hand.join(', ')}] | Valid: ${validTiles.length}`);
          if (playerInfo.score > maxScore) {
            maxScore = playerInfo.score;
            leader = playerInfo.name;
          }
        }
        
        if (maxScore > 0) {
          console.log(`   🏆 Leading: ${leader} with ${maxScore} points`);
        }
        
        // Show board state (tiles placed)
        console.log(`   📋 Board State:`);
        let tilesPlaced = 0;
        for (let x = 5; x <= 9; x++) {
          for (let y = 5; y <= 9; y++) {
            try {
              const tile = await game.getTileAt(gameId, x, y);
              if (tile.exists) {
                console.log(`     (${x},${y}): ${tile.number}`);
                tilesPlaced++;
              }
            } catch (e) {
              // Ignore tile check errors
            }
          }
        }
        console.log(`   Total tiles placed: ${tilesPlaced}`);
        
      } catch (e) {
        console.log(`❌ Game ${gameId}: Error checking game state`);
      }
    }
    
    console.log(`\n🎉 Full gameplay session complete!`);
    console.log(`📱 Gallery should now show games with:`)
    console.log(`   ✅ Real tile placements on boards`);
    console.log(`   ✅ Player scores from actual gameplay`);
    console.log(`   ✅ Turn progression and game states`);
    console.log(`   ✅ Following proper Fives rules (0s and 5s only)`);
    
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