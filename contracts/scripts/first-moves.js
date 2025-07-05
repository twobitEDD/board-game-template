const hre = require("hardhat");

async function main() {
  console.log("🎯 Making First Moves to Start Games...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [player1, player2, player3, player4] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    // === Try to make the first move in each game ===
    
    // Game 1: First move by Alice
    console.log("🎯 Game 1 - Alice making first move...");
    try {
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      const gameInfo = await game1.getGame(1);
      console.log(`  Current turn: ${gameInfo.turnNumber}, Current player index: ${gameInfo.currentPlayerIndex}`);
      
      const playerInfo = await game1.getPlayer(1, gameInfo.playerAddresses[gameInfo.currentPlayerIndex]);
      console.log(`  Player hand: [${playerInfo.hand.join(', ')}]`);
      
      if (playerInfo.hand.length > 0) {
        // Try placing first tile at center (0,0)
        const tile = playerInfo.hand[0];
        console.log(`  Attempting to place tile ${tile} at (0,0)...`);
        
        const placements = [{ number: tile, x: 0, y: 0 }];
        const placeTx = await game1.playTurn(1, placements);
        await placeTx.wait();
        
        console.log(`  ✅ SUCCESS! Placed tile ${tile} at (0,0)`);
        
        // Check the results
        const updatedGameInfo = await game1.getGame(1);
        const updatedPlayerInfo = await game1.getPlayer(1, gameInfo.playerAddresses[gameInfo.currentPlayerIndex]);
        console.log(`  New turn: ${updatedGameInfo.turnNumber}, Score: ${updatedPlayerInfo.score}`);
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
      console.log("  Let's try a different position or tile...");
      
      // Try alternative first moves
      try {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(1);
        const playerInfo = await game1.getPlayer(1, gameInfo.playerAddresses[gameInfo.currentPlayerIndex]);
        
        if (playerInfo.hand.length > 1) {
          // Try second tile in hand
          const tile = playerInfo.hand[1];
          console.log(`  Trying tile ${tile} at (0,0)...`);
          
          const placements = [{ number: tile, x: 0, y: 0 }];
          const placeTx = await game1.playTurn(1, placements);
          await placeTx.wait();
          
          console.log(`  ✅ SUCCESS with second tile! Placed ${tile} at (0,0)`);
        }
      } catch (e2) {
        console.log(`  ❌ Still failed: ${e2.message}`);
        
        // Try skipping turn to advance the game
        try {
          const game1 = FivesGame.attach(contractAddress).connect(player1);
          const skipTx = await game1.skipTurn(1);
          await skipTx.wait();
          console.log("  ⏭️ Skipped turn to advance game");
        } catch (e3) {
          console.log(`  ❌ Skip also failed: ${e3.message}`);
        }
      }
    }
    
    // Game 2: First move by Test Game 1 player
    console.log("\n🎯 Game 2 - First player making move...");
    try {
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      const gameInfo = await game1.getGame(2);
      console.log(`  Current turn: ${gameInfo.turnNumber}, Current player index: ${gameInfo.currentPlayerIndex}`);
      
      const currentPlayerAddr = gameInfo.playerAddresses[gameInfo.currentPlayerIndex];
      const playerInfo = await game1.getPlayer(2, currentPlayerAddr);
      console.log(`  Player hand: [${playerInfo.hand.join(', ')}]`);
      
      if (playerInfo.hand.length > 0) {
        const tile = playerInfo.hand[0];
        console.log(`  Attempting to place tile ${tile} at (0,0)...`);
        
        const placements = [{ number: tile, x: 0, y: 0 }];
        const placeTx = await game1.playTurn(2, placements);
        await placeTx.wait();
        
        console.log(`  ✅ SUCCESS! Placed tile ${tile} at (0,0)`);
        
        const updatedGameInfo = await game1.getGame(2);
        const updatedPlayerInfo = await game1.getPlayer(2, currentPlayerAddr);
        console.log(`  New turn: ${updatedGameInfo.turnNumber}, Score: ${updatedPlayerInfo.score}`);
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
      
      // Try skipping
      try {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const skipTx = await game1.skipTurn(2);
        await skipTx.wait();
        console.log("  ⏭️ Skipped turn");
      } catch (skipError) {
        console.log(`  ❌ Skip failed: ${skipError.message}`);
      }
    }
    
    // Game 3: Try with Player 2's turn  
    console.log("\n🎯 Game 3 - First player making move...");
    try {
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      const gameInfo = await game1.getGame(3);
      console.log(`  Current turn: ${gameInfo.turnNumber}, Current player index: ${gameInfo.currentPlayerIndex}`);
      
      const currentPlayerAddr = gameInfo.playerAddresses[gameInfo.currentPlayerIndex];
      const playerInfo = await game1.getPlayer(3, currentPlayerAddr);
      console.log(`  Player hand: [${playerInfo.hand.join(', ')}]`);
      
      if (playerInfo.hand.length > 0) {
        // Try placing any tile from hand
        const tile = playerInfo.hand[0];
        console.log(`  Attempting to place tile ${tile} at (0,0)...`);
        
        const placements = [{ number: tile, x: 0, y: 0 }];
        const placeTx = await game1.playTurn(3, placements);
        await placeTx.wait();
        
        console.log(`  ✅ SUCCESS! Placed tile ${tile} at (0,0)`);
        
        const updatedGameInfo = await game1.getGame(3);
        const updatedPlayerInfo = await game1.getPlayer(3, currentPlayerAddr);
        console.log(`  New turn: ${updatedGameInfo.turnNumber}, Score: ${updatedPlayerInfo.score}`);
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
    
    // Game 4: Try 3-player game
    console.log("\n🎯 Game 4 - First player making move...");
    try {
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      const gameInfo = await game1.getGame(4);
      console.log(`  Current turn: ${gameInfo.turnNumber}, Current player index: ${gameInfo.currentPlayerIndex}`);
      
      const currentPlayerAddr = gameInfo.playerAddresses[gameInfo.currentPlayerIndex];
      const playerInfo = await game1.getPlayer(4, currentPlayerAddr);
      console.log(`  Player hand: [${playerInfo.hand.join(', ')}]`);
      
      if (playerInfo.hand.length > 0) {
        const tile = playerInfo.hand[0];
        console.log(`  Attempting to place tile ${tile} at (0,0)...`);
        
        const placements = [{ number: tile, x: 0, y: 0 }];
        const placeTx = await game1.playTurn(4, placements);
        await placeTx.wait();
        
        console.log(`  ✅ SUCCESS! Placed tile ${tile} at (0,0)`);
        
        const updatedGameInfo = await game1.getGame(4);
        const updatedPlayerInfo = await game1.getPlayer(4, currentPlayerAddr);
        console.log(`  New turn: ${updatedGameInfo.turnNumber}, Score: ${updatedPlayerInfo.score}`);
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
    
    console.log("\n📊 Results after first move attempts:");
    const game = FivesGame.attach(contractAddress).connect(player1);
    
    for (let gameId = 1; gameId <= 4; gameId++) {
      try {
        const gameInfo = await game.getGame(gameId);
        console.log(`  Game ${gameId}: Turn ${gameInfo.turnNumber}`);
      } catch (e) {
        console.log(`  Game ${gameId}: Error checking`);
      }
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