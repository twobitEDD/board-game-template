const hre = require("hardhat");

async function main() {
  console.log("🎮 Creating test games...");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  try {
    const FivesGame = await hre.ethers.getContractFactory("FivesGame");
    const game = FivesGame.attach(contractAddress);
    
    // Check current state
    const nextId = await game.nextGameId();
    console.log("📊 Current nextGameId:", nextId.toString());
    
    // Create Game 1 - Setup game (4 players max)
    console.log("🎯 Creating Game 1 (4-player setup)...");
    const tx1 = await game.createGame(4, false, 100, "Test Game 1");
    await tx1.wait();
    console.log("✅ Game 1 created successfully");
    
    // Create Game 2 - Smaller game (2 players max)  
    console.log("🎯 Creating Game 2 (2-player game)...");
    const tx2 = await game.createGame(2, true, 150, "Test Game 2");
    await tx2.wait();
    console.log("✅ Game 2 created successfully");
    
    // Create Game 3 - Medium game (3 players max)
    console.log("🎯 Creating Game 3 (3-player game)...");
    const tx3 = await game.createGame(3, false, 200, "Test Game 3");
    await tx3.wait();
    console.log("✅ Game 3 created successfully");
    
    // Verify games exist
    const newNextId = await game.nextGameId();
    console.log("📊 New nextGameId:", newNextId.toString());
    console.log("🎉 Created", (Number(newNextId) - Number(nextId)), "games successfully!");
    
    // Test getting each game
    for (let i = Number(nextId); i < Number(newNextId); i++) {
      try {
        const gameInfo = await game.getGame(i);
        console.log(`✅ Game ${i}: State=${gameInfo.state}, Players=${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
      } catch (e) {
        console.log(`❌ Game ${i}: Error -`, e.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 