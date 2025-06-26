const hre = require("hardhat");

async function main() {
  // Contract address from deployment
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Get signers
  const [player1, player2, player3] = await hre.ethers.getSigners();
  
  // Get contract instance
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  const fivesGame = FivesGame.attach(contractAddress);
  
  console.log("🎮 Fives Game Contract Interaction Demo");
  console.log("=====================================");
  
  try {
    // 1. Create a new game
    console.log("\n1. Creating a new game...");
    const createTx = await fivesGame.connect(player1).createGame(2, false, "Alice");
    const createReceipt = await createTx.wait();
    
    // Find the GameCreated event
    const gameCreatedEvent = createReceipt.logs.find(
      log => log.fragment?.name === "GameCreated"
    );
    const gameId = gameCreatedEvent?.args[0] || 2; // Start from 2 since deploy script created game 1
    
    console.log(`   ✅ Game created with ID: ${gameId}`);
    console.log(`   📍 Transaction: ${createTx.hash}`);
    
    // 2. Second player joins
    console.log("\n2. Second player joining...");
    const joinTx = await fivesGame.connect(player2).joinGame(gameId, "Bob");
    await joinTx.wait();
    console.log(`   ✅ Bob joined the game`);
    console.log(`   📍 Transaction: ${joinTx.hash}`);
    
    // 3. Get game information
    console.log("\n3. Getting game information...");
    const gameInfo = await fivesGame.getGame(gameId);
    console.log(`   🎯 Game State: ${["Setup", "InProgress", "Completed", "Cancelled"][gameInfo.state]}`);
    console.log(`   👥 Players: ${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
    console.log(`   🏆 Current Turn: Player ${gameInfo.currentPlayerIndex + 1}`);
    
    // 4. Get player information
    console.log("\n4. Getting player information...");
    const aliceInfo = await fivesGame.getPlayer(gameId, player1.address);
    const bobInfo = await fivesGame.getPlayer(gameId, player2.address);
    
    console.log(`   👤 Alice: ${aliceInfo.name}, Score: ${aliceInfo.score}, Hand: ${aliceInfo.hand.length} tiles`);
    console.log(`   👤 Bob: ${bobInfo.name}, Score: ${bobInfo.score}, Hand: ${bobInfo.hand.length} tiles`);
    
    // 5. Start gameplay - Place first tile
    console.log("\n5. Starting gameplay...");
    console.log("   Alice places tile #25 at position (0, 0)");
    const placeTx1 = await fivesGame.connect(player1).placeTile(gameId, 25, 0, 0);
    await placeTx1.wait();
    console.log(`   ✅ Tile placed! Transaction: ${placeTx1.hash}`);
    
    // 6. Check tile placement
    const tile = await fivesGame.getTileAt(gameId, 0, 0);
    console.log(`   🎲 Tile at (0,0): Number ${tile.number}, Turn ${tile.turnPlaced}`);
    
    // 7. Bob's turn - place adjacent tile
    console.log("\n6. Bob's turn...");
    console.log("   Bob places tile #30 at position (1, 0) - should work since |25-30| = 5");
    const placeTx2 = await fivesGame.connect(player2).placeTile(gameId, 30, 1, 0);
    await placeTx2.wait();
    console.log(`   ✅ Tile placed! Transaction: ${placeTx2.hash}`);
    
    // 8. Check updated scores
    console.log("\n7. Updated scores...");
    const aliceInfoUpdated = await fivesGame.getPlayer(gameId, player1.address);
    const bobInfoUpdated = await fivesGame.getPlayer(gameId, player2.address);
    console.log(`   👤 Alice: Score ${aliceInfoUpdated.score}, Hand: ${aliceInfoUpdated.hand.length} tiles`);
    console.log(`   👤 Bob: Score ${bobInfoUpdated.score}, Hand: ${bobInfoUpdated.hand.length} tiles`);
    
    // 9. Demonstrate invalid move
    console.log("\n8. Demonstrating invalid move...");
    try {
      console.log("   Alice tries to place tile #10 at (2, 0) - should fail since |30-10| ≠ 5 and 30+10 ≠ 5");
      await fivesGame.connect(player1).placeTile(gameId, 10, 2, 0);
    } catch (error) {
      console.log(`   ❌ Move rejected: ${error.reason || error.message}`);
    }
    
    // 10. Valid move
    console.log("\n9. Valid move...");
    console.log("   Alice places tile #35 at (2, 0) - should work since 30+35 = 65... wait, that's wrong!");
    console.log("   Let me try tile #25 at (-1, 0) - should work since 25+25 = 50... no, that's taken!");
    console.log("   Let me try tile #20 at (0, 1) - should work since |25-20| = 5");
    
    try {
      const placeTx3 = await fivesGame.connect(player1).placeTile(gameId, 20, 0, 1);
      await placeTx3.wait();
      console.log(`   ✅ Tile placed! Transaction: ${placeTx3.hash}`);
    } catch (error) {
      console.log(`   ❌ Move failed: ${error.reason || error.message}`);
      console.log("   Note: Player might not have tile #20 in hand (random distribution)");
    }
    
    // 11. Get final game state
    console.log("\n10. Final game state...");
    const finalGameInfo = await fivesGame.getGame(gameId);
    console.log(`   🎯 Game State: ${["Setup", "InProgress", "Completed", "Cancelled"][finalGameInfo.state]}`);
    console.log(`   🏆 Current Turn: Player ${finalGameInfo.currentPlayerIndex + 1}`);
    console.log(`   📊 Turn Number: ${finalGameInfo.turnNumber}`);
    
    console.log("\n🎉 Demo completed successfully!");
    console.log("\n💡 Integration Tips:");
    console.log("   • Use contract events to update your UI in real-time");
    console.log("   • Call view functions to get current game state");
    console.log("   • Handle transaction confirmations for better UX");
    console.log("   • Implement error handling for invalid moves");
    console.log("   • Consider gas optimization for production");
    
  } catch (error) {
    console.error("❌ Demo failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 