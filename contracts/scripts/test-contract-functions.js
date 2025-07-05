const hre = require("hardhat");

async function main() {
  console.log("🎯 CONTRACT FUNCTIONS TEST");
  console.log("=" .repeat(50));
  
  const [deployer] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  // Deploy new contract
  console.log("🏗️ Deploying contract...");
  const contract = await FivesGame.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`✅ Contract deployed: ${contractAddress}`);
  
  console.log("\n🔍 PHASE 1: Contract Function Tests");
  
  // Test 1: Create game with playerAddress parameter
  console.log("\n1️⃣ Testing createGame with playerAddress...");
  const playerAddress = deployer.address;
  const createTx = await contract.createGame(
    1, // maxPlayers
    false, // allowIslands
    1000, // winningScore
    "Test Player",
    playerAddress // playerAddress parameter
  );
  await createTx.wait();
  console.log("✅ Game created successfully");
  
  // Test 2: Read game state
  console.log("\n2️⃣ Testing getGame...");
  const gameData = await contract.getGame(1);
  console.log("✅ Game data:", {
    state: gameData[0].toString(),
    creator: gameData[1],
    maxPlayers: gameData[2].toString(),
    playerAddresses: gameData[7],
    playerScores: gameData[8].map(s => s.toString())
  });
  
  // Test 3: Start game
  console.log("\n3️⃣ Testing startGame...");
  const startTx = await contract.startGame(1);
  await startTx.wait();
  console.log("✅ Game started successfully");
  
  // Test 4: Get player info
  console.log("\n4️⃣ Testing getPlayer...");
  const playerInfo = await contract.getPlayer(1, playerAddress);
  console.log("✅ Player info:", {
    name: playerInfo[0],
    score: playerInfo[1].toString(),
    hand: playerInfo[2].map(h => h.toString())
  });
  
  // Test 5: Valid move (should succeed)
  console.log("\n5️⃣ Testing valid move...");
  const hand = playerInfo[2].map(h => Number(h));
  console.log("Player hand:", hand);
  
  if (hand.length > 0) {
    const firstTile = hand[0];
    console.log(`Placing tile ${firstTile} at center (7,7)...`);
    
    const playTx = await contract.playTurn(1, [
      { number: firstTile, x: 7, y: 7 }
    ]);
    await playTx.wait();
    console.log("✅ Valid move successful");
  }
  
  // Test 6: Invalid move (should fail)
  console.log("\n6️⃣ Testing invalid move...");
  const updatedPlayerInfo = await contract.getPlayer(1, playerAddress);
  const updatedHand = updatedPlayerInfo[2].map(h => Number(h));
  console.log("Updated player hand:", updatedHand);
  
  if (updatedHand.length > 0) {
    const nextTile = updatedHand[0];
    const firstTile = hand[0];
    
    // Try to place a tile that creates an invalid sequence
    const sum = firstTile + nextTile;
    console.log(`Attempting to place tile ${nextTile} next to ${firstTile} (sum=${sum})...`);
    
    try {
      const invalidTx = await contract.playTurn(1, [
        { number: nextTile, x: 6, y: 7 } // Next to the first tile
      ]);
      await invalidTx.wait();
      console.log("❌ Invalid move was allowed! This should not happen.");
    } catch (error) {
      if (error.message.includes("Invalid tile placement")) {
        console.log("✅ Invalid move correctly rejected");
      } else {
        console.log("❌ Move rejected for different reason:", error.message);
      }
    }
  }
  
  // Test 7: Skip turn
  console.log("\n7️⃣ Testing skipTurn...");
  try {
    const skipTx = await contract.skipTurn(1);
    await skipTx.wait();
    console.log("✅ Skip turn successful");
  } catch (error) {
    console.log("❌ Skip turn failed:", error.message);
  }
  
  console.log("\n🎉 All contract function tests completed!");
  
  // Test 8: Frontend compatibility check
  console.log("\n8️⃣ Testing frontend compatibility...");
  
  // Test nextGameId (used by frontend)
  const nextGameId = await contract.nextGameId();
  console.log("nextGameId:", nextGameId.toString());
  
  // Test getPlacedTiles (used by frontend)
  const placedTiles = await contract.getPlacedTiles(1);
  console.log("placedTiles:", placedTiles);
  
  console.log("✅ Frontend compatibility verified");
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exitCode = 1;
}); 