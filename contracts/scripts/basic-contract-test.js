const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Testing basic contract functions on Base Sepolia...");
  
  // Get the deployed contract (NEW: single-player enabled)
  const contractAddress = "0xa296A27561B207d235CA61DF3C2cBa431A0ad88C";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  
  // Get the player address (deployer)
  const accounts = await ethers.getSigners();
  const player = accounts[0];
  console.log("👤 Player:", player.address);
  
  try {
    // Test basic contract constants and view functions
    console.log("\n🔍 Testing contract constants...");
    
    const handSize = await contract.HAND_SIZE();
    console.log("✅ Hand size:", Number(handSize));
    
    const winningScore = await contract.WINNING_SCORE();
    console.log("✅ Winning score:", Number(winningScore));
    
    const nextGameId = await contract.nextGameId();
    console.log("✅ Next game ID:", Number(nextGameId));
    
    // Test tile distribution
    console.log("\n🔍 Testing tile distribution...");
    for (let i = 0; i < 10; i++) {
      const count = await contract.TILE_DISTRIBUTION(i);
      console.log(`  Tile ${i}: ${Number(count)} copies`);
    }
    
    // Check wallet balance to ensure sufficient gas
    const balance = await ethers.provider.getBalance(player.address);
    console.log("\n💰 Wallet balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.001")) {
      console.log("⚠️ WARNING: Low balance, may cause transaction failures");
    }
    
    console.log("\n🎯 All basic functions working. Issue likely in createGame function.");
    console.log("📋 Summary:");
    console.log("  ✅ Contract deployed and accessible");
    console.log("  ✅ Constants readable");
    console.log("  ✅ View functions working");
    console.log("  ❌ createGame function failing (needs investigation)");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 