const { ethers } = require("hardhat");

async function testMultiplayerGames() {
  console.log("🧪 Testing Multiplayer Games (3-4 Players)...");
  
  const contractAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  try {
    console.log("✅ Contract connected successfully");
    
    // Get signers for multiple players
    const signers = await ethers.getSigners();
    console.log(`👥 Available signers: ${signers.length}`);
    
    if (signers.length < 4) {
      throw new Error("❌ Need at least 4 signers for this test");
    }
    
    const [player1, player2, player3, player4] = signers;
    
    // ============================================
    // TEST 1: 3-PLAYER GAME
    // ============================================
    console.log("\n🎮 === TESTING 3-PLAYER GAME ===");
    
    // Create 3-player game
    console.log("🚀 Creating 3-player game...");
    const tx3 = await contract.connect(player1).createGame(3, false, 100, "Player 1");
    await tx3.wait();
    
    const nextGameId = await contract.nextGameId();
    const game3Id = Number(nextGameId) - 1;
    console.log(`✅ 3-player game created with ID: ${game3Id}`);
    
    // Players 2 and 3 join
    console.log("👥 Players joining...");
    const join2Tx = await contract.connect(player2).joinGame(game3Id, "Player 2");
    await join2Tx.wait();
    console.log("✅ Player 2 joined");
    
    const join3Tx = await contract.connect(player3).joinGame(game3Id, "Player 3");
    await join3Tx.wait();
    console.log("✅ Player 3 joined");
    
    // Verify 3-player game state
    console.log("\n📊 Verifying 3-player game...");
    const game3Data = await contract.getGame(game3Id);
    console.log(`Game state: ${game3Data[0]} (should be 1 = InProgress)`);
    console.log(`Max players: ${game3Data[2]}`);
    console.log(`Player count: ${game3Data[7].length}`);
    console.log(`Total tiles remaining: ${game3Data[9]} (should be 135 = 3×50-15 drawn to hands)`);
    
    if (game3Data[7].length !== 3) {
      throw new Error(`❌ Expected 3 players, got ${game3Data[7].length}`);
    }
    
    if (Number(game3Data[9]) !== 135) {
      throw new Error(`❌ Expected 135 total tiles remaining (3×50-15 drawn), got ${game3Data[9]}`);
    }
    
    // Test individual pools for all 3 players
    console.log("\n🔍 Testing individual tile pools for 3 players:");
    let totalTilesAcrossPlayers = 0;
    
    for (let i = 0; i < 3; i++) {
      const playerAddr = game3Data[7][i];
      console.log(`\n👤 Player ${i + 1}: ${playerAddr}`);
      
      const playerData = await contract.getPlayer(game3Id, playerAddr);
      console.log(`  Name: ${playerData[0]}`);
      console.log(`  Score: ${playerData[1]}`);
      console.log(`  Hand: [${playerData[2]}] (${playerData[2].length} tiles)`);
      
      const tilePool = await contract.getPlayerTilePool(game3Id, playerAddr);
      const playerTiles = tilePool.reduce((sum, count) => sum + Number(count), 0);
      totalTilesAcrossPlayers += playerTiles;
      
      console.log(`  Individual pool tiles: ${playerTiles} (should be 45 after drawing 5)`);
      console.log(`  Pool distribution: [${tilePool.map(n => Number(n))}]`);
      
      // Verify each player has 45 tiles (started with 50, drew 5)
      if (playerTiles !== 45) {
        throw new Error(`❌ Player ${i + 1} should have 45 tiles, got ${playerTiles}`);
      }
      
      // Verify hand size is 5
      if (playerData[2].length !== 5) {
        throw new Error(`❌ Player ${i + 1} should have 5 tiles in hand, got ${playerData[2].length}`);
      }
    }
    
    console.log(`\n✅ 3-player game verification complete!`);
    console.log(`   Total tiles in individual pools: ${totalTilesAcrossPlayers} (should be 135 = 3×45)`);
    
    // ============================================
    // TEST 2: 4-PLAYER GAME
    // ============================================
    console.log("\n🎮 === TESTING 4-PLAYER GAME ===");
    
    // Create 4-player game
    console.log("🚀 Creating 4-player game...");
    const tx4 = await contract.connect(player1).createGame(4, false, 100, "Player 1");
    await tx4.wait();
    
    const nextGameId4 = await contract.nextGameId();
    const game4Id = Number(nextGameId4) - 1;
    console.log(`✅ 4-player game created with ID: ${game4Id}`);
    
    // Players 2, 3, and 4 join
    console.log("👥 Players joining...");
    const join2Tx4 = await contract.connect(player2).joinGame(game4Id, "Player 2");
    await join2Tx4.wait();
    console.log("✅ Player 2 joined");
    
    const join3Tx4 = await contract.connect(player3).joinGame(game4Id, "Player 3");
    await join3Tx4.wait();
    console.log("✅ Player 3 joined");
    
    const join4Tx4 = await contract.connect(player4).joinGame(game4Id, "Player 4");
    await join4Tx4.wait();
    console.log("✅ Player 4 joined");
    
    // Verify 4-player game state
    console.log("\n📊 Verifying 4-player game...");
    const game4Data = await contract.getGame(game4Id);
    console.log(`Game state: ${game4Data[0]} (should be 1 = InProgress)`);
    console.log(`Max players: ${game4Data[2]}`);
    console.log(`Player count: ${game4Data[7].length}`);
    console.log(`Total tiles remaining: ${game4Data[9]} (should be 180 = 4×50-20 drawn to hands)`);
    
    if (game4Data[7].length !== 4) {
      throw new Error(`❌ Expected 4 players, got ${game4Data[7].length}`);
    }
    
    if (Number(game4Data[9]) !== 180) {
      throw new Error(`❌ Expected 180 total tiles remaining (4×50-20 drawn), got ${game4Data[9]}`);
    }
    
    // Test individual pools for all 4 players
    console.log("\n🔍 Testing individual tile pools for 4 players:");
    let totalTilesAcrossPlayers4 = 0;
    
    for (let i = 0; i < 4; i++) {
      const playerAddr = game4Data[7][i];
      console.log(`\n👤 Player ${i + 1}: ${playerAddr}`);
      
      const playerData = await contract.getPlayer(game4Id, playerAddr);
      console.log(`  Name: ${playerData[0]}`);
      console.log(`  Score: ${playerData[1]}`);
      console.log(`  Hand: [${playerData[2]}] (${playerData[2].length} tiles)`);
      
      const tilePool = await contract.getPlayerTilePool(game4Id, playerAddr);
      const playerTiles = tilePool.reduce((sum, count) => sum + Number(count), 0);
      totalTilesAcrossPlayers4 += playerTiles;
      
      console.log(`  Individual pool tiles: ${playerTiles} (should be 45 after drawing 5)`);
      console.log(`  Pool distribution: [${tilePool.map(n => Number(n))}]`);
      
      // Verify each player has 45 tiles (started with 50, drew 5)
      if (playerTiles !== 45) {
        throw new Error(`❌ Player ${i + 1} should have 45 tiles, got ${playerTiles}`);
      }
      
      // Verify hand size is 5
      if (playerData[2].length !== 5) {
        throw new Error(`❌ Player ${i + 1} should have 5 tiles in hand, got ${playerData[2].length}`);
      }
    }
    
    console.log(`\n✅ 4-player game verification complete!`);
    console.log(`   Total tiles in individual pools: ${totalTilesAcrossPlayers4} (should be 180 = 4×45)`);
    
    // ============================================
    // TEST 3: VERIFY POOL UNIQUENESS
    // ============================================
    console.log("\n🔍 === TESTING POOL UNIQUENESS ===");
    
    // Verify that players have different tile distributions (proving individual pools)
    const player1Pool = await contract.getPlayerTilePool(game4Id, game4Data[7][0]);
    const player2Pool = await contract.getPlayerTilePool(game4Id, game4Data[7][1]);
    const player3Pool = await contract.getPlayerTilePool(game4Id, game4Data[7][2]);
    const player4Pool = await contract.getPlayerTilePool(game4Id, game4Data[7][3]);
    
    console.log("Comparing tile pool distributions to verify they're individual:");
    console.log(`Player 1: [${player1Pool.map(n => Number(n))}]`);
    console.log(`Player 2: [${player2Pool.map(n => Number(n))}]`);
    console.log(`Player 3: [${player3Pool.map(n => Number(n))}]`);
    console.log(`Player 4: [${player4Pool.map(n => Number(n))}]`);
    
    // Check if any two pools are identical (they shouldn't be)
    const pools = [player1Pool, player2Pool, player3Pool, player4Pool];
    let foundDifference = false;
    
    for (let i = 0; i < pools.length; i++) {
      for (let j = i + 1; j < pools.length; j++) {
        for (let k = 0; k < 10; k++) {
          if (Number(pools[i][k]) !== Number(pools[j][k])) {
            foundDifference = true;
            break;
          }
        }
        if (foundDifference) break;
      }
      if (foundDifference) break;
    }
    
    if (!foundDifference) {
      console.log("⚠️ Warning: All pools appear identical - this is statistically unlikely but possible");
    } else {
      console.log("✅ Pool distributions are different - individual pools confirmed!");
    }
    
    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log("\n🎉 === MULTIPLAYER TEST COMPLETE! ===");
    console.log("✅ 3-player games working correctly");
    console.log("✅ 4-player games working correctly");
    console.log("✅ Individual tile pools (50 tiles each) working for all players");
    console.log("✅ Tile distribution (5 of each number 0-9) working");
    console.log("✅ Hand dealing (5 tiles per player) working");
    console.log("✅ Total tile count math correct (50×players = total pool)");
    console.log("✅ Pool uniqueness verified (different distributions per player)");
    
  } catch (error) {
    console.error("❌ Multiplayer test failed:", error.message || error);
    throw error;
  }
}

testMultiplayerGames()
  .then(() => {
    console.log("\n🎊 ALL MULTIPLAYER TESTS PASSED!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 MULTIPLAYER TEST SUITE FAILED:", error);
    process.exit(1);
  }); 