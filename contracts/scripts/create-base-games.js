const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Creating test games on Base Sepolia...");
  
  // Get the deployed contract
  const contractAddress = "0x80f80B22D1839F2216F7f7814398e7039Fc17546";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  
  // Check current state
  const currentGameId = await contract.nextGameId();
  console.log("📊 Current games:", Number(currentGameId) - 1);
  
  // Create 3 test games
  console.log("\n🎯 Creating test games...");
  
  try {
    // Game 1: Simple 2-player game
    console.log("Creating Game 1...");
    const tx1 = await contract.createGame(2, true, 1000, "Test Game 1");
    await tx1.wait();
    console.log("✅ Game 1 created");
    
    // Game 2: 4-player game
    console.log("Creating Game 2...");
    const tx2 = await contract.createGame(4, false, 1500, "Test Game 2");
    await tx2.wait();
    console.log("✅ Game 2 created");
    
    // Game 3: Another 2-player game
    console.log("Creating Game 3...");
    const tx3 = await contract.createGame(2, true, 800, "Test Game 3");
    await tx3.wait();
    console.log("✅ Game 3 created");
    
    // Check final state
    const finalGameId = await contract.nextGameId();
    console.log("\n📊 FINAL STATE:");
    console.log("Total games:", Number(finalGameId) - 1);
    
    console.log("\n🎉 SUCCESS! Gallery should now show games!");
    console.log("🔗 Test: http://localhost:3001/gallery");
    
  } catch (error) {
    console.error("❌ Error creating games:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 