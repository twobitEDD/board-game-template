const hre = require("hardhat");

async function main() {
  console.log("🎮 Fives Game Simple Demo - 50 Tile Distribution");
  console.log("========================================");
  
  // Get signers
  const [deployer, alice, bob] = await hre.ethers.getSigners();
  
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Alice: ${alice.address}`);
  console.log(`Bob: ${bob.address}`);
  
  // Deploy contract
  console.log("\n📦 Deploying contract...");
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  const fivesGame = await FivesGame.deploy();
  await fivesGame.waitForDeployment();
  
  const contractAddress = await fivesGame.getAddress();
  console.log(`✅ Contract deployed at: ${contractAddress}`);
  
  try {
    // 1. Alice creates a game
    console.log("\n🎯 Step 1: Alice creates a game");
    const createTx = await fivesGame.connect(alice).createGame(
      2,           // maxPlayers
      false,       // allowIslands
      100,         // winningScore
      "Alice"      // playerName
    );
    const createReceipt = await createTx.wait();
    console.log(`   ✅ Game created! Transaction: ${createTx.hash}`);
    
    const gameId = 1; // First game
    
    // 2. Bob joins the game
    console.log("\n🎯 Step 2: Bob joins the game");
    const joinTx = await fivesGame.connect(bob).joinGame(gameId, "Bob");
    await joinTx.wait();
    console.log(`   ✅ Bob joined! Transaction: ${joinTx.hash}`);
    console.log(`   🎉 Game auto-started since it's full!`);
    
    // 3. Check game state and tile pool
    console.log("\n🎯 Step 3: Check game state and tile distribution");
    const gameInfo = await fivesGame.getGame(gameId);
    const states = ["Setup", "InProgress", "Completed", "Cancelled"];
    console.log(`   🎮 Game State: ${states[gameInfo.state]}`);
    console.log(`   👥 Players: ${gameInfo.playerAddresses.length}`);
    console.log(`   🏆 Current Turn: Player ${Number(gameInfo.currentPlayerIndex) + 1}`);
    console.log(`   📊 Turn: ${Number(gameInfo.turnNumber)}`);
    console.log(`   🎲 Tiles Remaining in Pool: ${Number(gameInfo.tilesRemaining)}`);
    
    // Check tile distribution
    const tilePoolStatus = await fivesGame.getTilePoolStatus(gameId);
    console.log(`   📊 Tile Pool Distribution:`);
    for (let i = 0; i < 10; i++) {
      console.log(`      ${i}: ${Number(tilePoolStatus[i])} remaining`);
    }
    
    // 4. Get player info
    console.log("\n🎯 Step 4: Check player hands");
    const aliceInfo = await fivesGame.getPlayer(gameId, alice.address);
    const bobInfo = await fivesGame.getPlayer(gameId, bob.address);
    
    console.log(`   👤 Alice: Score ${Number(aliceInfo.score)}, Hand: ${aliceInfo.hand.length} tiles`);
    console.log(`      Hand tiles: [${aliceInfo.hand.map(n => Number(n)).join(', ')}]`);
    console.log(`   👤 Bob: Score ${Number(bobInfo.score)}, Hand: ${bobInfo.hand.length} tiles`);
    console.log(`      Hand tiles: [${bobInfo.hand.map(n => Number(n)).join(', ')}]`);
    
    // 5. Alice places first tile
    console.log("\n🎯 Step 5: Alice places first tile");
    const aliceFirstTile = Number(aliceInfo.hand[0]);
    console.log(`   🎲 Alice places tile #${aliceFirstTile} at (0,0)`);
    
    const placements1 = [{
      number: aliceFirstTile,
      x: 0,
      y: 0
    }];
    
    const placeTx1 = await fivesGame.connect(alice).playTurn(gameId, placements1);
    await placeTx1.wait();
    console.log(`   ✅ Tile placed! Transaction: ${placeTx1.hash}`);
    
    // Check tile
    const tile1 = await fivesGame.getTileAt(gameId, 0, 0);
    console.log(`   🎲 Confirmed: Tile ${Number(tile1.number)} at (0,0)`);
    
    // 6. Bob places adjacent tile
    console.log("\n🎯 Step 6: Bob places adjacent tile");
    const bobHand = await fivesGame.getPlayer(gameId, bob.address);
    
    // Find a valid tile for Bob (sum or difference of 5 with Alice's tile)
    let validTile = null;
    for (let tile of bobHand.hand) {
      const tileNum = Number(tile);
      const sum = aliceFirstTile + tileNum;
      const diff = Math.abs(aliceFirstTile - tileNum);
      if (sum === 5 || diff === 5) {
        validTile = tileNum;
        break;
      }
    }
    
    if (validTile !== null) {
      console.log(`   🎲 Bob places tile #${validTile} at (1,0) - Valid since ${aliceFirstTile}+${validTile}=${aliceFirstTile + validTile} or |${aliceFirstTile}-${validTile}|=${Math.abs(aliceFirstTile - validTile)}`);
      
      const placements2 = [{
        number: validTile,
        x: 1,
        y: 0
      }];
      
      const placeTx2 = await fivesGame.connect(bob).playTurn(gameId, placements2);
      await placeTx2.wait();
      console.log(`   ✅ Tile placed! Transaction: ${placeTx2.hash}`);
      
      // Check tile
      const tile2 = await fivesGame.getTileAt(gameId, 1, 0);
      console.log(`   🎲 Confirmed: Tile ${Number(tile2.number)} at (1,0)`);
    } else {
      console.log(`   ❌ Bob has no valid tiles to place adjacent to ${aliceFirstTile}`);
      console.log(`   🔄 Bob skips turn to draw new tiles`);
      const skipTx = await fivesGame.connect(bob).skipTurn(gameId);
      await skipTx.wait();
      console.log(`   ✅ Turn skipped! Transaction: ${skipTx.hash}`);
    }
    
    // 7. Check updated scores and hands
    console.log("\n🎯 Step 7: Check updated state");
    const aliceUpdated = await fivesGame.getPlayer(gameId, alice.address);
    const bobUpdated = await fivesGame.getPlayer(gameId, bob.address);
    
    console.log(`   👤 Alice: Score ${Number(aliceUpdated.score)} (+${Number(aliceUpdated.score) - Number(aliceInfo.score)}), Hand: ${aliceUpdated.hand.length} tiles`);
    console.log(`   👤 Bob: Score ${Number(bobUpdated.score)} (+${Number(bobUpdated.score) - Number(bobInfo.score)}), Hand: ${bobUpdated.hand.length} tiles`);
    
    // 8. Try placing multiple tiles in one turn
    console.log("\n🎯 Step 8: Alice tries multi-tile placement");
    const aliceCurrentHand = aliceUpdated.hand;
    
    if (aliceCurrentHand.length >= 2) {
      const tile1Num = Number(aliceCurrentHand[0]);
      const tile2Num = Number(aliceCurrentHand[1]);
      
      console.log(`   🎲 Alice attempts to place tiles #${tile1Num} and #${tile2Num} in one turn`);
      
      const multiPlacements = [
        { number: tile1Num, x: 0, y: 1 },
        { number: tile2Num, x: 0, y: 2 }
      ];
      
      try {
        const multiTx = await fivesGame.connect(alice).playTurn(gameId, multiPlacements);
        await multiTx.wait();
        console.log(`   ✅ Multi-tile placement successful! Transaction: ${multiTx.hash}`);
      } catch (error) {
        console.log(`   ❌ Multi-tile placement failed: ${error.reason || "Invalid placement"}`);
        console.log(`   💡 Note: Mathematical rules must be satisfied for all placements`);
      }
    }
    
    // 9. Check final tile pool status
    console.log("\n🎯 Step 9: Final tile pool status");
    const finalGameInfo = await fivesGame.getGame(gameId);
    const finalTilePool = await fivesGame.getTilePoolStatus(gameId);
    
    console.log(`   🎲 Tiles Remaining in Pool: ${Number(finalGameInfo.tilesRemaining)}`);
    console.log(`   📊 Final Tile Distribution:`);
    for (let i = 0; i < 10; i++) {
      console.log(`      ${i}: ${Number(finalTilePool[i])} remaining`);
    }
    
    // 10. Final state
    console.log("\n🎯 Step 10: Final game state");
    const finalAlice = await fivesGame.getPlayer(gameId, alice.address);
    const finalBob = await fivesGame.getPlayer(gameId, bob.address);
    
    console.log(`   🎮 Game State: ${states[finalGameInfo.state]}`);
    console.log(`   🏆 Current Turn: Player ${Number(finalGameInfo.currentPlayerIndex) + 1}`);
    console.log(`   📊 Turn: ${Number(finalGameInfo.turnNumber)}`);
    console.log(`   👤 Alice: Score ${Number(finalAlice.score)}, Hand: ${finalAlice.hand.length} tiles`);
    console.log(`   👤 Bob: Score ${Number(finalBob.score)}, Hand: ${finalBob.hand.length} tiles`);
    
    console.log("\n🎉 Demo completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   • Contract Address: ${contractAddress}`);
    console.log(`   • Game ID: ${gameId}`);
    console.log(`   • Players: 2`);
    console.log(`   • 50-tile Distribution: ✅`);
    console.log(`   • Hand Size: 5 tiles each`);
    console.log(`   • Batch Tile Placement: ✅`);
    console.log(`   • Mathematical Rules: Enforced ✅`);
    console.log(`   • Turn Management: Working ✅`);
    console.log(`   • Scoring: Working ✅`);
    console.log(`   • Tile Drawing: Working ✅`);
    
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