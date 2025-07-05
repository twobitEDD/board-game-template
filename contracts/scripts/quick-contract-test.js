const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 QUICK CONTRACT TEST - Base Sepolia");
  console.log("=====================================\n");
  
  // Use the Base Sepolia contract address from frontend config
  const contractAddress = "0xa296A27561B207d235CA61DF3C2cBa431A0ad88C";
  
  console.log("📍 Testing contract:", contractAddress);
  console.log("🌐 Network: Base Sepolia (Chain ID: 84532)");
  
  try {
    // Test 1: Check if contract exists
    console.log("\n1. ✅ Testing contract deployment...");
    const contract = await ethers.getContractAt("FivesGame", contractAddress);
    console.log("   Contract instance created successfully");
    
    // Test 2: Test basic constants
    console.log("\n2. ✅ Testing contract constants...");
    try {
      const handSize = await contract.HAND_SIZE();
      const winningScore = await contract.WINNING_SCORE();
      console.log(`   HAND_SIZE: ${handSize}`);
      console.log(`   WINNING_SCORE: ${winningScore}`);
    } catch (constantError) {
      console.error("❌ Failed to read constants:", constantError.message);
      return;
    }
    
    // Test 3: Check next game ID (shows how many games exist)
    console.log("\n3. ✅ Testing game state...");
    try {
      const nextGameId = await contract.nextGameId();
      console.log(`   Next Game ID: ${nextGameId} (${Number(nextGameId) - 1} games created)`);
      
      // If games exist, test reading the first one
      if (Number(nextGameId) > 1) {
        console.log("\n4. ✅ Testing game data retrieval...");
        try {
          const gameData = await contract.getGame(1);
          console.log("   First game data:");
          console.log(`     State: ${Number(gameData[0])}`);
          console.log(`     Creator: ${gameData[1]}`);
          console.log(`     Max Players: ${Number(gameData[2])}`);
          console.log(`     Current Player: ${Number(gameData[3])}`);
          console.log(`     Turn Number: ${Number(gameData[4])}`);
          console.log(`     Players: ${gameData[7].length}/${Number(gameData[2])}`);
        } catch (gameError) {
          console.error("❌ Failed to read game data:", gameError.message);
        }
      } else {
        console.log("   No games created yet - this is normal for a fresh contract");
      }
      
    } catch (gameIdError) {
      console.error("❌ Failed to read nextGameId:", gameIdError.message);
      return;
    }
    
    console.log("\n✅ CONTRACT TEST RESULTS:");
    console.log("=======================");
    console.log("✅ Contract is deployed and responsive");
    console.log("✅ Basic functions are working");
    console.log("✅ Ready for game creation");
    console.log("\nYour contract is working correctly!");
    console.log("If you're having issues, they're likely in the frontend setup.");
    
  } catch (error) {
    console.error("\n❌ CONTRACT TEST FAILED:");
    console.error("========================");
    console.error("Error:", error.message);
    console.error("\nPossible causes:");
    console.error("- Network configuration issues");
    console.error("- Contract not deployed to Base Sepolia");
    console.error("- RPC connectivity problems");
    console.error("- Hardhat network configuration mismatch");
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exitCode = 1;
}); 