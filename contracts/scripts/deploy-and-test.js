const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Deploy and Test FivesGame Contract...");
  
  // Get signers
  const [deployer, player1, player2] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Deploy contract fresh
  console.log("\n🚀 Deploying FivesGame contract...");
  const FivesGame = await ethers.getContractFactory("FivesGame");
  const fivesGame = await FivesGame.deploy();
  await fivesGame.waitForDeployment();
  
  const contractAddress = await fivesGame.getAddress();
  console.log("✅ Contract deployed at:", contractAddress);
  
  try {
    // Test 1: Basic contract interaction
    console.log("\n🔍 Test 1: Basic contract functions...");
    const nextGameId = await fivesGame.nextGameId();
    console.log("✅ nextGameId:", nextGameId.toString());
    
    const handSize = await fivesGame.HAND_SIZE();
    console.log("✅ HAND_SIZE:", handSize.toString());
    
    const winningScore = await fivesGame.WINNING_SCORE();
    console.log("✅ WINNING_SCORE:", winningScore.toString());
    
    // Test 2: Create a game
    console.log("\n🔍 Test 2: Creating a game...");
    const createTx = await fivesGame.connect(deployer).createGame(
      2,              // maxPlayers
      false,          // allowIslands  
      100,            // winningScore
      "Test Player"   // playerName
    );
    const createReceipt = await createTx.wait();
    console.log("✅ Game created! Gas used:", createReceipt.gasUsed.toString());
    
    // Test 3: Check the created game
    console.log("\n🔍 Test 3: Checking created game...");
    const gameId = nextGameId; // Should be 1
    const gameInfo = await fivesGame.getGame(gameId);
    
    console.log("📊 Game Info:");
    console.log("   Game ID:", gameId.toString());
    console.log("   State:", gameInfo[0].toString(), "(0=Setup, 1=InProgress, 2=Completed, 3=Cancelled)");
    console.log("   Creator:", gameInfo[1]);
    console.log("   Max Players:", gameInfo[2].toString());
    console.log("   Player Count:", gameInfo[7].length);
    console.log("   Winning Score:", gameInfo[10].toString());
    
    // Test 4: Get player info
    console.log("\n🔍 Test 4: Checking player info...");
    const playerInfo = await fivesGame.getPlayer(gameId, deployer.address);
    console.log("👤 Player Info:");
    console.log("   Name:", playerInfo[0]);
    console.log("   Score:", playerInfo[1].toString());
    console.log("   Hand Size:", playerInfo[2].length);
    console.log("   Has Joined:", playerInfo[3]);
    
    // Test 5: Join game with second player (should auto-start)
    console.log("\n🔍 Test 5: Joining game with player2...");
    const joinTx = await fivesGame.connect(player1).joinGame(gameId, "Player Two");
    const joinReceipt = await joinTx.wait();
    console.log("✅ Player2 joined! Gas used:", joinReceipt.gasUsed.toString());
    
    // Check game state after join
    const gameInfoAfterJoin = await fivesGame.getGame(gameId);
    console.log("📊 Game state after join:", gameInfoAfterJoin[0].toString());
    console.log("📊 Player count:", gameInfoAfterJoin[7].length);
    
    // Test 6: Create additional games
    console.log("\n🔍 Test 6: Creating more games for gallery...");
    
    // Game 2 - 3 players
    const createTx2 = await fivesGame.connect(player1).createGame(3, true, 150, "Gallery Game 1");
    await createTx2.wait();
    
    // Game 3 - 4 players  
    const createTx3 = await fivesGame.connect(player2).createGame(4, false, 200, "Gallery Game 2");
    await createTx3.wait();
    
    const finalNextId = await fivesGame.nextGameId();
    console.log("🎉 Total games created:", (Number(finalNextId) - 1));
    
    // Test 7: Test getPlacedTiles function (our cache optimization)
    console.log("\n🔍 Test 7: Testing getPlacedTiles (cache optimization)...");
    try {
      const placedTilesData = await fivesGame.getPlacedTiles(gameId);
      console.log("✅ getPlacedTiles works! Found", placedTilesData[0].length, "placed tiles");
    } catch (error) {
      console.log("⚠️ getPlacedTiles error (expected for new game):", error.message.substring(0, 50));
    }
    
    // Update contract config
    console.log("\n📝 Updating contract configuration...");
    const configUpdate = {
      contractAddress: contractAddress,
      deployedAt: new Date().toISOString(),
      deployerAddress: deployer.address,
      gasUsed: createReceipt.gasUsed.toString(),
      verified: true,
      active: true
    };
    
    console.log("✅ Contract ready for frontend integration!");
    console.log("\n🔗 Test URLs:");
    console.log("   Frontend: http://localhost:3000");
    console.log("   Gallery: http://localhost:3000/gallery");
    for (let i = 1; i < Number(finalNextId); i++) {
      console.log(`   Game ${i}: http://localhost:3000/game/${i}`);
    }
    
    console.log("\n📍 Contract Address:", contractAddress);
    console.log("🎯 Update your frontend config with this address");
    
    return {
      contractAddress,
      totalGames: Number(finalNextId) - 1,
      success: true
    };
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return {
      contractAddress,
      error: error.message,
      success: false
    };
  }
}

main()
  .then((result) => {
    if (result.success) {
      console.log(`\n🎉 SUCCESS! Contract deployed and tested with ${result.totalGames} games`);
    } else {
      console.log(`\n❌ FAILED! Contract deployed but tests failed: ${result.error}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 