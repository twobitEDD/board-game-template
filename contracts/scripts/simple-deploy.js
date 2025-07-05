const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Deploying contract and creating test games...");
  
  // Get signers (multiple accounts for testing)
  const [deployer, player1, player2, player3] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Get contract factory
  console.log("🏗️ Getting contract factory...");
  const FivesGame = await ethers.getContractFactory("FivesGame");
  
  // Deploy contract
  console.log("🚀 Deploying contract...");
  const fivesGame = await FivesGame.deploy();
  
  console.log("⏳ Waiting for deployment...");
  await fivesGame.waitForDeployment();
  
  const address = await fivesGame.getAddress();
  console.log("✅ Contract deployed to:", address);
  
  // Test basic functions
  console.log("🧪 Testing basic functions...");
  try {
    const handSize = await fivesGame.HAND_SIZE();
    console.log("🃏 Hand Size:", handSize.toString());
    
    const initialNextId = await fivesGame.nextGameId();
    console.log("🎯 Initial Next Game ID:", initialNextId.toString());
    
    console.log("\n🎮 Creating test games...");
    
    // Create Game 1 - Setup game (4 players, waiting for more players)
    console.log("🎯 Creating Game 1 (4-player setup)...");
    const tx1 = await fivesGame.connect(deployer).createGame(4, false, 150, "Galaxy Conquest");
    await tx1.wait();
    console.log("✅ Game 1 created by deployer");
    
    // Create Game 2 - 2-player game
    console.log("🎯 Creating Game 2 (2-player game)...");
    const tx2 = await fivesGame.connect(player1).createGame(2, false, 100, "Quick Match");
    await tx2.wait();
    console.log("✅ Game 2 created by player1");
    
    // Join Game 2 with player2 to start it
    const gameId2 = Number(initialNextId) + 1;
    console.log("👥 Player2 joining Game", gameId2, "...");
    const tx2join = await fivesGame.connect(player2).joinGame(gameId2, "Player Two");
    await tx2join.wait();
    console.log("✅ Player2 joined Game", gameId2);
    
    // Create Game 3 - 3-player game
    console.log("🎯 Creating Game 3 (3-player game)...");
    const tx3 = await fivesGame.connect(player2).createGame(3, false, 200, "Tournament Match");
    await tx3.wait();
    console.log("✅ Game 3 created by player2");
    
    // Join Game 3 with other players
    const gameId3 = Number(initialNextId) + 2;
    console.log("👥 Player3 joining Game", gameId3, "...");
    const tx3join1 = await fivesGame.connect(player3).joinGame(gameId3, "Player Three");
    await tx3join1.wait();
    console.log("✅ Player3 joined Game", gameId3);
    
    console.log("👥 Deployer joining Game", gameId3, "...");
    const tx3join2 = await fivesGame.connect(deployer).joinGame(gameId3, "Game Master");
    await tx3join2.wait();
    console.log("✅ Deployer joined Game", gameId3);
    
    // Check final state
    const finalNextId = await fivesGame.nextGameId();
    console.log("\n📊 Final nextGameId:", finalNextId.toString());
    console.log("🎉 Created", (Number(finalNextId) - Number(initialNextId)), "games!");
    
    // Display game summaries
    console.log("\n📋 GAME SUMMARY:");
    console.log("=================");
    
    for (let i = Number(initialNextId); i < Number(finalNextId); i++) {
      try {
        const gameInfo = await fivesGame.getGame(i);
        const stateNames = ["Setup", "InProgress", "Completed", "Abandoned"];
        const stateName = stateNames[gameInfo.state] || "Unknown";
        
        console.log(`\n🎮 Game ${i}: ${gameInfo.gameName}`);
        console.log(`   State: ${stateName} (${gameInfo.state})`);
        console.log(`   Players: ${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}`);
        console.log(`   Target Score: ${gameInfo.winningScore}`);
        
        if (gameInfo.playerAddresses.length > 0) {
          console.log(`   Current Turn: Player ${gameInfo.currentPlayerIndex + 1}`);
        }
        
      } catch (e) {
        console.log(`❌ Game ${i}: Error - ${e.message}`);
      }
    }
    
    console.log("\n✅ Test games created successfully!");
    console.log("📍 Contract address for frontend:", address);
    console.log("🔗 You can now view these games in the gallery at: http://localhost:3000/gallery");
    
  } catch (error) {
    console.error("❌ Testing failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 