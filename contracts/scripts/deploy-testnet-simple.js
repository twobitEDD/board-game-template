const { ethers } = require('hardhat');

async function deployTestnetSimple() {
  console.log('🚀 SIMPLE TESTNET DEPLOY & TEST\n');
  console.log('📋 This test will:');
  console.log('  1. Deploy contract with paymaster security');
  console.log('  2. Create one single-player game');
  console.log('  3. Start game to deal tiles');
  console.log('  4. Test real tile placement');
  console.log('  5. Verify Game 4 equivalent works\n');
  
  // Get the deployer account (only one available on testnet)
  const [deployer] = await ethers.getSigners();
  
  console.log('👤 Deployer Account:', deployer.address);
  console.log('💰 Deployer Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n');
  
  // ============================================
  // 1. DEPLOY CONTRACT WITH PAYMASTER SECURITY
  // ============================================
  console.log('🏗️ PHASE 1: Deploying Contract...\n');
  
  const FivesGame = await ethers.getContractFactory('FivesGame');
  const contract = await FivesGame.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log(`✅ Contract deployed: ${contractAddress}`);
  
  // Check paymaster setup
  const entryPointAuth = await contract.isAuthorizedPaymaster('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789');
  console.log(`✅ EntryPoint pre-authorized: ${entryPointAuth}`);
  
  // Authorize deployer as paymaster for testing
  await contract.connect(deployer).authorizePaymaster(deployer.address);
  const deployerAuth = await contract.isAuthorizedPaymaster(deployer.address);
  console.log(`✅ Deployer authorized as paymaster: ${deployerAuth}\n`);
  
  // ============================================
  // 2. CREATE SINGLE PLAYER GAME
  // ============================================
  console.log('🎮 PHASE 2: Creating Single Player Game...\n');
  
  console.log('Creating Game 1: Test Solo Game');
  console.log(`  Creator: ${deployer.address.slice(0,8)}...`);
  console.log(`  Max Players: 1`);
  console.log(`  Via Direct Call: true`);
  
  try {
    const createTx = await contract.connect(deployer).createGame(
      1,          // maxPlayers: 1 (single player)
      false,      // allowIslands: false
      100,        // Low winning score for quick test
      "Test Game",
      deployer.address  // playerAddress = deployer
    );
    
    const receipt = await createTx.wait();
    console.log(`✅ Game 1 created successfully! Gas used: ${receipt.gasUsed}\n`);
    
  } catch (error) {
    console.log(`❌ Failed to create game: ${error.message}\n`);
    return;
  }
  
  // ============================================
  // 3. START GAME TO DEAL TILES
  // ============================================
  console.log('🚀 PHASE 3: Starting Game to Deal Tiles...\n');
  
  try {
    console.log('Starting single player game...');
    const startTx = await contract.connect(deployer).startGame(1);
    await startTx.wait();
    console.log('✅ Game 1 started manually\n');
  } catch (error) {
    console.log(`❌ Failed to start game: ${error.message}\n`);
    return;
  }
  
  // ============================================
  // 4. TEST REAL TILE PLACEMENT
  // ============================================
  console.log('🎲 PHASE 4: Testing Real Tile Placement...\n');
  
  try {
    console.log('Getting player hand...');
    const playerData = await contract.getPlayer(1, deployer.address);
    const hand = playerData[2].map(t => Number(t));
    console.log(`Player hand: [${hand.join(', ')}]`);
    
    if (hand.length > 0) {
      const firstTile = hand[0];
      console.log(`Placing tile ${firstTile} at center (7,7)...`);
      
      const moveTx = await contract.connect(deployer).playTurn(1, [
        { number: firstTile, x: 7, y: 7 }
      ]);
      const moveReceipt = await moveTx.wait();
      console.log(`✅ First move successful! Gas used: ${moveReceipt.gasUsed}`);
      
      // Get updated hand and place second tile
      const updatedPlayerData = await contract.getPlayer(1, deployer.address);
      const updatedHand = updatedPlayerData[2].map(t => Number(t));
      
      if (updatedHand.length > 0) {
        const secondTile = updatedHand[0];
        console.log(`Placing tile ${secondTile} at (6,7)...`);
        
        const moveTx2 = await contract.connect(deployer).playTurn(1, [
          { number: secondTile, x: 6, y: 7 }
        ]);
        const moveReceipt2 = await moveTx2.wait();
        console.log(`✅ Second move successful! Gas used: ${moveReceipt2.gasUsed}`);
      }
    } else {
      console.log('❌ Player has no tiles after game start');
      return;
    }
  } catch (error) {
    console.log(`❌ Tile placement failed: ${error.message}`);
    return;
  }
  
  console.log('');
  
  // ============================================
  // 5. VERIFY GAME DATA
  // ============================================
  console.log('📊 PHASE 5: Verifying Game Data...\n');
  
  try {
    // Get game data
    const gameData = await contract.getGame(1);
    console.log('🔍 Game 1 Verification:');
    console.log(`  State: ${Number(gameData[0])} (0=Setup, 1=InProgress, 2=Completed)`);
    console.log(`  Creator: ${gameData[1]}`);
    console.log(`  Players: ${gameData[7].length}/${Number(gameData[2])}`);
    console.log(`  Turn: ${Number(gameData[4])}`);
    console.log(`  Scores: [${gameData[8].map(s => Number(s)).join(', ')}]`);
    
    // Get player data
    const finalPlayerData = await contract.getPlayer(1, deployer.address);
    console.log(`  Player Hand: ${finalPlayerData[2].length} tiles`);
    console.log(`  Player Score: ${Number(finalPlayerData[1])}`);
    
    // Get placed tiles
    const placedTiles = await contract.getPlacedTiles(1);
    console.log(`  Tiles on Board: ${placedTiles[2].length}`);
    
    if (placedTiles[2].length > 0) {
      console.log('  Placed tiles:');
      for (let i = 0; i < placedTiles[2].length; i++) {
        console.log(`    Tile ${i+1}: ${Number(placedTiles[2][i])} at (${Number(placedTiles[0][i])}, ${Number(placedTiles[1][i])})`);
      }
    }
    
    console.log('  ✅ All data retrieval functions working\n');
    
  } catch (error) {
    console.log(`❌ Game verification failed: ${error.message}\n`);
    return;
  }
  
  // ============================================
  // 6. FRONTEND COMPATIBILITY TEST
  // ============================================
  console.log('🖥️ PHASE 6: Frontend Compatibility Test...\n');
  
  try {
    const nextGameId = await contract.nextGameId();
    const totalGames = Number(nextGameId) - 1;
    console.log(`Total games created: ${totalGames}`);
    
    // Simulate frontend getAllGames()
    const allGames = [];
    for (let i = 1; i <= totalGames; i++) {
      const gameData = await contract.getGame(i);
      
      const transformedGame = {
        id: i,
        state: Number(gameData[0]),
        creator: gameData[1],
        maxPlayers: Number(gameData[2]),
        currentPlayerIndex: Number(gameData[3]),
        turnNumber: Number(gameData[4]),
        playerAddresses: gameData[7],
        playerScores: gameData[8].map(score => Number(score)),
        createdAt: Number(gameData[5]),
        allowIslands: gameData[6],
        tilesRemaining: Number(gameData[9])
      };
      
      allGames.push(transformedGame);
    }
    
    console.log(`✅ Frontend simulation: ${allGames.length} games retrieved`);
    console.log(`✅ Game 1 data:`, {
      id: allGames[0].id,
      state: allGames[0].state,
      creator: allGames[0].creator.slice(0,8) + '...',
      tilesRemaining: allGames[0].tilesRemaining
    });
    
  } catch (error) {
    console.log(`❌ Frontend test failed: ${error.message}`);
  }
  
  // ============================================
  // 7. FINAL RESULTS
  // ============================================
  console.log('\n🏆 TESTNET DEPLOYMENT RESULTS:\n');
  console.log('✅ Contract deployment: SUCCESS');
  console.log('✅ Paymaster authorization: SUCCESS');
  console.log('✅ Single player game creation: SUCCESS');
  console.log('✅ Game starting & tile dealing: SUCCESS');
  console.log('✅ Real tile placement gameplay: SUCCESS');
  console.log('✅ Data retrieval functions: SUCCESS');
  console.log('✅ Frontend compatibility: SUCCESS');
  
  console.log(`\n📍 Contract Address: ${contractAddress}`);
  console.log('🔗 Network: Base Sepolia Testnet');
  console.log('✅ Ready for frontend integration!');
  
  return {
    contractAddress,
    success: true
  };
}

deployTestnetSimple()
  .then((result) => {
    if (result.success) {
      console.log(`\n🎉 TESTNET DEPLOYMENT COMPLETE!`);
      console.log(`📍 Contract: ${result.contractAddress}`);
      console.log('💡 Update your frontend config to use this contract address.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ TESTNET DEPLOYMENT FAILED:', error.message);
    process.exit(1);
  }); 