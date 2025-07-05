const hre = require("hardhat");

async function main() {
  console.log("🔧 Simple Tile Placement Test...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [player1, player2] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    // Test Game 2 - Player Two has [2, 1, 8, 5, 0] (2 valid: 5 and 0)
    console.log("🎯 Testing Game 2 - Player Two should place a 5 or 0...");
    
    const game = FivesGame.attach(contractAddress).connect(player1);
    const gameInfo = await game.getGame(2);
    
    console.log(`  Current turn: ${gameInfo.turnNumber}`);
    console.log(`  Current player index: ${gameInfo.currentPlayerIndex}`);
    console.log(`  Player addresses: [${gameInfo.playerAddresses.join(', ')}]`);
    
    // Get the current player
    const currentPlayerAddr = gameInfo.playerAddresses[gameInfo.currentPlayerIndex];
    console.log(`  Current player address: ${currentPlayerAddr}`);
    
    // Connect as the current player
    const isPlayer1Turn = currentPlayerAddr.toLowerCase() === player1.address.toLowerCase();
    const isPlayer2Turn = currentPlayerAddr.toLowerCase() === player2.address.toLowerCase();
    
    console.log(`  Is Player 1 turn: ${isPlayer1Turn}`);
    console.log(`  Is Player 2 turn: ${isPlayer2Turn}`);
    
    if (isPlayer1Turn) {
      console.log("  → Player 1's turn");
      const gameContract = FivesGame.attach(contractAddress).connect(player1);
      const playerInfo = await gameContract.getPlayer(2, currentPlayerAddr);
      console.log(`  Player 1 hand: [${playerInfo.hand.join(', ')}]`);
      
      const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
      console.log(`  Valid tiles (0 or 5): [${validTiles.join(', ')}]`);
      
      if (validTiles.length > 0) {
        const tile = validTiles[0];
        console.log(`  Attempting to place tile ${tile} at center (7,7)...`);
        
        try {
          const placements = [{ number: tile, x: 7, y: 7 }];
          console.log(`  Placement data:`, placements);
          
          const placeTx = await gameContract.playTurn(2, placements);
          console.log(`  Transaction submitted, waiting for confirmation...`);
          await placeTx.wait();
          
          console.log(`  ✅ SUCCESS! Tile placed.`);
          
          // Check the updated game state
          const updatedGameInfo = await game.getGame(2);
          const updatedPlayerInfo = await game.getPlayer(2, currentPlayerAddr);
          console.log(`  New turn: ${updatedGameInfo.turnNumber}`);
          console.log(`  New score: ${updatedPlayerInfo.score}`);
          console.log(`  New hand: [${updatedPlayerInfo.hand.join(', ')}]`);
          
          // Verify the tile was placed
          const placedTile = await game.getTileAt(2, 7, 7);
          console.log(`  Tile at (7,7): exists=${placedTile.exists}, number=${placedTile.number}`);
          
        } catch (error) {
          console.log(`  ❌ Placement failed: ${error.message}`);
          console.log(`  Error details:`, error);
        }
      } else {
        console.log("  No valid tiles to place, skipping turn...");
        const skipTx = await gameContract.skipTurn(2);
        await skipTx.wait();
        console.log("  ⏭️ Turn skipped");
      }
      
    } else if (isPlayer2Turn) {
      console.log("  → Player 2's turn");
      const gameContract = FivesGame.attach(contractAddress).connect(player2);
      const playerInfo = await gameContract.getPlayer(2, currentPlayerAddr);
      console.log(`  Player 2 hand: [${playerInfo.hand.join(', ')}]`);
      
      const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
      console.log(`  Valid tiles (0 or 5): [${validTiles.join(', ')}]`);
      
      if (validTiles.length > 0) {
        const tile = validTiles[0];
        console.log(`  Attempting to place tile ${tile} at center (7,7)...`);
        
        try {
          const placements = [{ number: tile, x: 7, y: 7 }];
          console.log(`  Placement data:`, placements);
          
          const placeTx = await gameContract.playTurn(2, placements);
          console.log(`  Transaction submitted, waiting for confirmation...`);
          await placeTx.wait();
          
          console.log(`  ✅ SUCCESS! Tile placed.`);
          
          // Check the updated game state
          const updatedGameInfo = await game.getGame(2);
          const updatedPlayerInfo = await game.getPlayer(2, currentPlayerAddr);
          console.log(`  New turn: ${updatedGameInfo.turnNumber}`);
          console.log(`  New score: ${updatedPlayerInfo.score}`);
          console.log(`  New hand: [${updatedPlayerInfo.hand.join(', ')}]`);
          
          // Verify the tile was placed
          const placedTile = await game.getTileAt(2, 7, 7);
          console.log(`  Tile at (7,7): exists=${placedTile.exists}, number=${placedTile.number}`);
          
        } catch (error) {
          console.log(`  ❌ Placement failed: ${error.message}`);
          console.log(`  Error details:`, error);
        }
      } else {
        console.log("  No valid tiles to place, skipping turn...");
        const skipTx = await gameContract.skipTurn(2);
        await skipTx.wait();
        console.log("  ⏭️ Turn skipped");
      }
      
    } else {
      console.log("  → Neither Player 1 nor Player 2 is current player!");
      console.log("  This suggests there might be other players in the game.");
    }
    
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