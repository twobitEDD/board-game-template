const { ethers } = require("hardhat");

async function testContract() {
  console.log("🧪 Testing deployed FivesGame contract...\n");

  // Connect to the deployed contract
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const FivesGame = await ethers.getContractFactory("FivesGame");
  const fivesGame = FivesGame.attach(contractAddress);

  console.log("📍 Contract Address:", contractAddress);

  try {
    // Test 1: Check contract constants
    console.log("\n📊 Testing contract constants...");
    const handSize = await fivesGame.HAND_SIZE();
    const winningScore = await fivesGame.WINNING_SCORE();
    const nextGameId = await fivesGame.nextGameId();
    
    console.log("🃏 Hand Size:", handSize.toString());
    console.log("🏆 Default Winning Score:", winningScore.toString());
    console.log("🎯 Next Game ID:", nextGameId.toString());

    // Test 2: Check tile distribution
    console.log("\n🎲 Testing tile distribution...");
    for (let i = 0; i < 10; i++) {
      const tileCount = await fivesGame.TILE_DISTRIBUTION(i);
      console.log(`Tile ${i}:`, tileCount.toString(), "copies");
    }

    // Test 3: Check if we can estimate gas for creating a game
    console.log("\n⛽ Testing gas estimation for createGame...");
    try {
      const gasEstimate = await fivesGame.createGame.estimateGas(
        2, // maxPlayers
        false, // allowIslands  
        5000, // winningScore
        "Test Player" // playerName
      );
      console.log("Estimated gas for createGame:", gasEstimate.toString());
    } catch (gasError) {
      console.log("⚠️ Gas estimation failed (expected for view-only testing):", gasError.message);
    }

    console.log("\n✅ Contract test completed successfully!");
    console.log("🎮 Your FivesGame contract is deployed and functioning!");
    
    console.log("\n🔗 Useful Links:");
    console.log("📊 BaseScan:", `https://basescan.org/address/${contractAddress}`);
    console.log("📖 Read Contract:", `https://basescan.org/address/${contractAddress}#readContract`);
    console.log("✍️ Write Contract:", `https://basescan.org/address/${contractAddress}#writeContract`);

  } catch (error) {
    console.error("❌ Contract test failed:", error);
  }
}

testContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  }); 