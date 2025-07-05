const hre = require("hardhat");

async function main() {
  console.log("🎯 Making Valid Tile Placements...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [player1, player2, player3, player4] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    // === STEP 1: Add Player 2 to Game 2 and start it ===
    console.log("🎯 Adding Player 2 to Game 2 and starting it...");
    try {
      const game2 = FivesGame.attach(contractAddress).connect(player2);
      const joinTx = await game2.joinGame(2, "Player Two");
      await joinTx.wait();
      console.log("✅ Player 2 joined Game 2");
      
      // Now start Game 2 (creator = player1)
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      const startTx = await game1.startGame(2);
      await startTx.wait();
      console.log("✅ Game 2 started");
      
      const gameInfo = await game1.getGame(2);
      console.log(`  Game 2: State=${gameInfo.state}, Players=${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
    } catch (e) {
      console.log("❌ Error with Game 2:", e.message);
    }
    console.log();
    
    // === STEP 2: Check what tiles players actually have ===
    console.log("🎲 Checking player hands...");
    
    for (let gameId = 2; gameId <= 4; gameId++) {
      try {
        const game1 = FivesGame.attach(contractAddress).connect(player1);
        const gameInfo = await game1.getGame(gameId);
        
        if (gameInfo.state === 1) { // InProgress
          console.log(`\n📋 Game ${gameId} player hands:`);
          
          for (let i = 0; i < gameInfo.playerAddresses.length; i++) {
            const playerAddr = gameInfo.playerAddresses[i];
            const playerInfo = await game1.getPlayer(gameId, playerAddr);
            const playerName = playerInfo.name;
            const hand = playerInfo.hand;
            
            console.log(`  ${playerName} (${playerAddr.slice(0,6)}...): [${hand.join(', ')}]`);
          }
        }
      } catch (e) {
        console.log(`❌ Error checking Game ${gameId}:`, e.message);
      }
    }
    
    // === STEP 3: Make valid first moves using actual tiles ===
    console.log("\n🎯 Making moves with actual player tiles...");
    
    // Game 2: Player 1's turn first
    try {
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      const playerInfo = await game1.getPlayer(2, player1.address);
      
      if (playerInfo.hand.length > 0) {
        const firstTile = playerInfo.hand[0]; // Use first tile in hand
        console.log(`  Game 2: Player 1 placing tile ${firstTile} at (0,0)...`);
        
        const placements = [{ number: firstTile, x: 0, y: 0 }];
        const placeTx = await game1.playTurn(2, placements);
        await placeTx.wait();
        
        console.log(`  ✅ Player 1 placed tile ${firstTile} at (0,0) in Game 2`);
        
        // Check results
        const gameInfo = await game1.getGame(2);
        const updatedPlayerInfo = await game1.getPlayer(2, player1.address);
        console.log(`  📊 Turn: ${gameInfo.turnNumber}, Score: ${updatedPlayerInfo.score}, Hand: [${updatedPlayerInfo.hand.join(', ')}]`);
      }
    } catch (e) {
      console.log("  ❌ Error in Game 2:", e.message);
    }
    
    // Game 3: Player 1's turn first
    try {
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      const playerInfo = await game1.getPlayer(3, player1.address);
      
      if (playerInfo.hand.length > 0) {
        const firstTile = playerInfo.hand[0];
        console.log(`  Game 3: Player 1 placing tile ${firstTile} at (0,0)...`);
        
        const placements = [{ number: firstTile, x: 0, y: 0 }];
        const placeTx = await game1.playTurn(3, placements);
        await placeTx.wait();
        
        console.log(`  ✅ Player 1 placed tile ${firstTile} at (0,0) in Game 3`);
        
        const gameInfo = await game1.getGame(3);
        const updatedPlayerInfo = await game1.getPlayer(3, player1.address);
        console.log(`  📊 Turn: ${gameInfo.turnNumber}, Score: ${updatedPlayerInfo.score}, Hand: [${updatedPlayerInfo.hand.join(', ')}]`);
      }
    } catch (e) {
      console.log("  ❌ Error in Game 3:", e.message);
    }
    
    // Game 4: Player 1's turn first  
    try {
      const game1 = FivesGame.attach(contractAddress).connect(player1);
      const playerInfo = await game1.getPlayer(4, player1.address);
      
      if (playerInfo.hand.length > 1) {
        // Try placing two tiles for a sequence
        const tile1 = playerInfo.hand[0];
        const tile2 = playerInfo.hand[1];
        console.log(`  Game 4: Player 1 placing tiles ${tile1},${tile2} at (0,0),(1,0)...`);
        
        const placements = [
          { number: tile1, x: 0, y: 0 },
          { number: tile2, x: 1, y: 0 }
        ];
        const placeTx = await game1.playTurn(4, placements);
        await placeTx.wait();
        
        console.log(`  ✅ Player 1 placed tiles ${tile1},${tile2} in Game 4`);
        
        const gameInfo = await game1.getGame(4);
        const updatedPlayerInfo = await game1.getPlayer(4, player1.address);
        console.log(`  📊 Turn: ${gameInfo.turnNumber}, Score: ${updatedPlayerInfo.score}, Hand: [${updatedPlayerInfo.hand.join(', ')}]`);
      }
    } catch (e) {
      console.log("  ❌ Error in Game 4:", e.message);
    }
    
    console.log("\n🎉 Move testing complete!");
    
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