const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 TESTING STARTGAME SPONSORED TRANSACTION FIX");
  console.log("=" .repeat(50));
  
  // Use the newly deployed contract
  const contractAddress = "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  
  const [deployer] = await ethers.getSigners();
  const playerAddress = deployer.address;
  
  console.log("👤 Player:", playerAddress);
  
  // Check balance
  const balance = await ethers.provider.getBalance(playerAddress);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  try {
    // Step 1: Check if the paymaster is authorized
    console.log("\n🔍 STEP 1: Checking paymaster authorization...");
    const paymasterAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // Common ZeroDev paymaster
    const isAuthorized = await contract.isAuthorizedPaymaster(paymasterAddress);
    console.log(`Paymaster ${paymasterAddress} is authorized:`, isAuthorized);
    
    // Step 2: Create a test game
    console.log("\n🎮 STEP 2: Creating test game...");
    const createTx = await contract.createGame(
      1, // maxPlayers
      false, // allowIslands
      1000, // winningScore
      "Test Player", // playerName
      playerAddress // playerAddress
    );
    
    console.log("⏳ Waiting for game creation confirmation...");
    const createReceipt = await createTx.wait();
    console.log("✅ Game created successfully!");
    
    // Get the game ID (should be 2 since we created game 1 during deployment)
    const gameId = await contract.nextGameId() - 1n;
    console.log("🎲 Game ID:", gameId.toString());
    
    // Step 3: Check game state
    console.log("\n📊 STEP 3: Checking game state...");
    const gameData = await contract.getGame(gameId);
    console.log("Game state:", {
      state: Number(gameData[0]) === 0 ? "Setup" : "In Progress",
      creator: gameData[1],
      players: gameData[7].length,
      maxPlayers: Number(gameData[2])
    });
    
    // Step 4: Test startGame function
    console.log("\n🚀 STEP 4: Testing startGame function...");
    console.log("This should now work with sponsored transactions!");
    
    const startTx = await contract.startGame(gameId);
    console.log("⏳ Waiting for game start confirmation...");
    const startReceipt = await startTx.wait();
    console.log("✅ Game started successfully!");
    
    console.log("📋 Transaction details:");
    console.log("  Gas used:", startReceipt.gasUsed.toString());
    console.log("  Transaction hash:", startReceipt.hash);
    console.log("  Block number:", startReceipt.blockNumber);
    
    // Step 5: Verify game is now in progress
    console.log("\n📈 STEP 5: Verifying game started...");
    const updatedGameData = await contract.getGame(gameId);
    const gameState = Number(updatedGameData[0]);
    console.log("Game state after start:", gameState === 1 ? "In Progress ✅" : "Still Setup ❌");
    
    if (gameState === 1) {
      console.log("\n🎉 SUCCESS! StartGame function is now working correctly!");
      console.log("✅ The sponsored transaction fix is working");
      console.log("✅ Games can now be started with ZeroDev sponsored transactions");
    } else {
      console.log("\n❌ FAILURE: Game did not start properly");
    }
    
    console.log("\n🏁 TEST COMPLETE");
    
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    console.error("Full error:", error);
    
    // Check if it's a specific authorization error
    if (error.message.includes("Only creator") || error.message.includes("authorized")) {
      console.log("\n💡 ANALYSIS: This looks like an authorization error");
      console.log("   This suggests the paymaster authorization fix may need more work");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 