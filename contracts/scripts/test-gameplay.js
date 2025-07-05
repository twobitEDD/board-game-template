const hre = require("hardhat");

async function main() {
  console.log("🎮 Testing Complete Gameplay Flow...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  try {
    // Get signers (different players)
    const [player1, player2, player3, player4] = await hre.ethers.getSigners();
    
    console.log("👥 Players:");
    console.log("  Player 1:", player1.address);
    console.log("  Player 2:", player2.address);
    console.log("  Player 3:", player3.address);
    console.log("  Player 4:", player4.address);
    console.log();
    
    const FivesGame = await hre.ethers.getContractFactory("FivesGame");
    
    // === STEP 1: Check current game states ===
    console.log("📊 Current Game States:");
    const game1 = FivesGame.attach(contractAddress).connect(player1);
    
    for (let gameId = 2; gameId <= 4; gameId++) {
      try {
        const gameInfo = await game1.getGame(gameId);
        console.log(`  Game ${gameId}: State=${gameInfo.state}, Players=${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
      } catch (e) {
        console.log(`  Game ${gameId}: Error -`, e.message);
      }
    }
    console.log();
    
    // === STEP 2: Join Game 3 (2-player game) with Player 2 ===
    console.log("🎯 Player 2 joining Game 3 (2-player game)...");
    try {
      const game2 = FivesGame.attach(contractAddress).connect(player2);
      const joinTx = await game2.joinGame(3, "Player Two");
      await joinTx.wait();
      console.log("✅ Player 2 joined Game 3 successfully");
      
      // Check if game auto-started (should happen when full)
      const gameInfo = await game2.getGame(3);
      console.log(`  Game 3 now: State=${gameInfo.state}, Players=${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
      if (gameInfo.state === 1) {
        console.log("🚀 Game 3 auto-started!");
      }
    } catch (e) {
      console.log("❌ Error joining Game 3:", e.message);
    }
    console.log();
    
    // === STEP 3: Join Game 4 (3-player game) with Players 2 & 3 ===
    console.log("🎯 Players 2 & 3 joining Game 4 (3-player game)...");
    try {
      const game2 = FivesGame.attach(contractAddress).connect(player2);
      const game3 = FivesGame.attach(contractAddress).connect(player3);
      
      const joinTx2 = await game2.joinGame(4, "Player Two");
      await joinTx2.wait();
      console.log("✅ Player 2 joined Game 4");
      
      const joinTx3 = await game3.joinGame(4, "Player Three");
      await joinTx3.wait();
      console.log("✅ Player 3 joined Game 4");
      
      const gameInfo = await game3.getGame(4);
      console.log(`  Game 4 now: State=${gameInfo.state}, Players=${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
      if (gameInfo.state === 1) {
        console.log("🚀 Game 4 auto-started!");
      }
    } catch (e) {
      console.log("❌ Error joining Game 4:", e.message);
    }
    console.log();
    
    // === STEP 4: Manually start Game 2 (partial 4-player game) ===
    console.log("🎯 Manually starting Game 2 with current players...");
    try {
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      const startTx = await game1.startGame(2);
      await startTx.wait();
      console.log("✅ Game 2 started manually");
      
      const gameInfo = await game1.getGame(2);
      console.log(`  Game 2 now: State=${gameInfo.state}, Players=${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
    } catch (e) {
      console.log("❌ Error starting Game 2:", e.message);
    }
    console.log();
    
    // === STEP 5: Make some tile placements ===
    console.log("🎲 Making tile placements...");
    
    // Try placing tiles in Game 3 (2-player game)
    console.log("  🎯 Player 1 placing tiles in Game 3...");
    try {
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      
      // Place a single tile at origin
      const placements = [
        { number: 5, x: 0, y: 0 }
      ];
      
      const placeTx = await game1.playTurn(3, placements);
      await placeTx.wait();
      console.log("  ✅ Player 1 placed tile 5 at (0,0) in Game 3");
      
      // Check game state after move
      const gameInfo = await game1.getGame(3);
      const playerInfo = await game1.getPlayer(3, player1.address);
      console.log(`  📊 Game 3 - Turn: ${gameInfo.turnNumber}, Player 1 Score: ${playerInfo.score}`);
      
    } catch (e) {
      console.log("  ❌ Error placing tiles in Game 3:", e.message);
    }
    
    // Try placing tiles in Game 4 (3-player game)
    console.log("  🎯 Player 1 placing tiles in Game 4...");
    try {
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      
      // Place two tiles to form a sequence
      const placements = [
        { number: 3, x: 0, y: 0 },
        { number: 4, x: 1, y: 0 }
      ];
      
      const placeTx = await game1.playTurn(4, placements);
      await placeTx.wait();
      console.log("  ✅ Player 1 placed tiles 3,4 at (0,0),(1,0) in Game 4");
      
      const gameInfo = await game1.getGame(4);
      const playerInfo = await game1.getPlayer(4, player1.address);
      console.log(`  📊 Game 4 - Turn: ${gameInfo.turnNumber}, Player 1 Score: ${playerInfo.score}`);
      
    } catch (e) {
      console.log("  ❌ Error placing tiles in Game 4:", e.message);
    }
    
    console.log();
    
    // === STEP 6: Final game state summary ===
    console.log("📋 Final Game States:");
    for (let gameId = 2; gameId <= 4; gameId++) {
      try {
        const gameInfo = await game1.getGame(gameId);
        const stateNames = ['Setup', 'InProgress', 'Completed', 'Cancelled'];
        console.log(`  Game ${gameId}: ${stateNames[gameInfo.state]}, Players=${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}, Turn=${gameInfo.turnNumber}`);
        
        // Show scores for each player
        for (let i = 0; i < gameInfo.playerAddresses.length; i++) {
          const playerAddr = gameInfo.playerAddresses[i];
          const playerInfo = await game1.getPlayer(gameId, playerAddr);
          console.log(`    Player ${i+1} (${playerAddr.slice(0,6)}...): "${playerInfo.name}" - Score: ${playerInfo.score}`);
        }
      } catch (e) {
        console.log(`  Game ${gameId}: Error -`, e.message);
      }
    }
    
    console.log("\n🎉 Gameplay testing complete!");
    
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